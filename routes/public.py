from flask import Blueprint, render_template, jsonify, send_from_directory, request, current_app
from models import db, Portfolio, Booking, Message
from extensions import limiter, csrf
from utils.email import send_booking_notification, send_contact_notification
import re

public_bp = Blueprint('public', __name__)

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_NAME_LEN    = 100
MAX_EMAIL_LEN   = 254
MAX_PHONE_LEN   = 20
MAX_SERVICE_LEN = 100
MAX_MSG_LEN     = 2000

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

ALLOWED_SERVICES = {
    # Photography
    'studio-portrait', 'wedding', 'event', 'commercial',
    # Special Shoots
    'birthday', 'maternity', 'graduation', 'kids', 'family', 'passport',
    # Video
    'video', 'drone', 'livestream',
    # Creative
    'graphic-design', 'branding', 'printing', 'social-media',
    # Fallback
    'other',
}

# Human-readable labels for every category value stored in the database.
# Used by serialize() so the frontend gets "Wedding Coverage" not "Wedding".
CATEGORY_LABELS = {
    # Photography
    'studio-portrait' : 'Studio Portrait',
    'wedding'         : 'Wedding Coverage',
    'event'           : 'Event Photography',
    'commercial'      : 'Commercial Photography',
    # Special Shoots
    'birthday'        : 'Birthday Photoshoot',
    'maternity'       : 'Maternity Photoshoot',
    'graduation'      : 'Graduation Photoshoot',
    'kids'            : "Kids' Photoshoot",
    'family'          : 'Family Photoshoot',
    'passport'        : 'Passport Photos',
    # Video
    'video'           : 'Video Production',
    'drone'           : 'Drone Services',
    'livestream'      : 'Live Streaming',
    # Creative
    'graphic-design'  : 'Graphic Design',
    'branding'        : 'Branding',
    'printing'        : 'Printing',
    'social-media'    : 'Social Media',
    # Fallback
    'general'         : 'General',
    'other'           : 'Other',
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _clean(value, max_len):
    return (value or '').strip()[:max_len]

def _valid_email(email):
    return bool(EMAIL_RE.match(email))

def _serialize_portfolio_item(item):
    """
    Shared serializer for Portfolio rows used by both /api/portfolio
    and /api/what-we-do. Returns a dict safe for jsonify().
    """
    if item.cloudinary_url:
        # Cloudinary on-the-fly transformation: 800 px wide, auto quality & format
        image_url = item.cloudinary_url.replace('/upload/', '/upload/w_800,q_auto,f_auto/')
        full_url  = item.cloudinary_url
    elif item.file_path:
        image_url = full_url = f"/static/uploads/{item.file_path}"
    else:
        image_url = full_url = "/static/img/placeholder.jpg"

    cat = item.category or 'general'

    return {
        "id"            : item.id,
        "title"         : item.title,
        "description"   : item.description or "",
        "category"      : cat,
        # Use the label map; fall back to a clean title-case string
        "category_label": CATEGORY_LABELS.get(cat, cat.replace('-', ' ').title()),
        "image_url"     : image_url,
        "full_url"      : full_url,
        "featured"      : item.featured,
        "created_at"    : item.created_at.strftime("%Y-%m-%d"),
    }

def _portfolio_query(request_args):
    """
    Shared query builder for portfolio endpoints.
    Reads category, featured, page, per_page from request args.
    Returns (items, total, page, pages, per_page).
    """
    category = _clean(request_args.get('category', ''), 50).lower()
    featured = _clean(request_args.get('featured', ''), 10).lower()
    page     = max(1, int(request_args.get('page', 1)))
    per_page = min(max(0, int(request_args.get('per_page', 0))), 100)

    q = Portfolio.query.order_by(Portfolio.created_at.desc())

    if category and category != 'all':
        q = q.filter(Portfolio.category == category)
    if featured == 'true':
        q = q.filter(Portfolio.featured == True)

    if per_page > 0:
        paginated = q.paginate(page=page, per_page=per_page, error_out=False)
        return paginated.items, paginated.total, page, paginated.pages, per_page
    else:
        items = q.all()
        return items, len(items), 1, 1, per_page


# ── Public pages ──────────────────────────────────────────────────────────────
@public_bp.route('/')
def index():
    featured = Portfolio.query.filter_by(featured=True)\
                              .order_by(Portfolio.created_at.desc())\
                              .limit(6).all()
    return render_template('public/index.html', featured=featured)

@public_bp.route('/portfolio')
def portfolio():
    return render_template('public/portfolio.html')

@public_bp.route('/services')
def services():
    return render_template('public/services.html')

@public_bp.route('/about')
def about():
    return render_template('public/about.html')

@public_bp.route('/contact')
def contact():
    return render_template('public/contact.html')

@public_bp.route('/packages')
def packages():
    return render_template('public/packages.html')

@public_bp.route('/videos')
def videos():
    return render_template('public/video_production.html')

@public_bp.route('/what-we-do')
@public_bp.route('/what_we_do')
def what_we_do():
    return render_template('public/what_we_do.html')


# ── API: Portfolio ────────────────────────────────────────────────────────────
@public_bp.route('/api/portfolio')
@limiter.limit("60 per minute")
def api_portfolio():
    try:
        items, total, page, pages, per_page = _portfolio_query(request.args)
        return jsonify({
            "items"   : [_serialize_portfolio_item(i) for i in items],
            "total"   : total,
            "page"    : page,
            "pages"   : pages,
            "per_page": per_page,
        })
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid query parameters", "items": []}), 400
    except Exception as e:
        current_app.logger.error(f"API portfolio error: {e}")
        return jsonify({"error": "Failed to load portfolio", "items": []}), 500


# ── API: What We Do ───────────────────────────────────────────────────────────
# Identical query to /api/portfolio but kept as a separate endpoint so the
# What We Do page can evolve independently (e.g. add sorting, limits, etc.)
@public_bp.route('/api/what-we-do')
@limiter.limit("60 per minute")
def api_what_we_do():
    try:
        items, total, page, pages, per_page = _portfolio_query(request.args)
        return jsonify({
            "items"   : [_serialize_portfolio_item(i) for i in items],
            "total"   : total,
            "page"    : page,
            "pages"   : pages,
            "per_page": per_page,
        })
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid query parameters", "items": []}), 400
    except Exception as e:
        current_app.logger.error(f"API what-we-do error: {e}")
        return jsonify({"error": "Failed to load what we do", "items": []}), 500


# ── API: Booking form ─────────────────────────────────────────────────────────
# Route first, then csrf.exempt, then limiter — this order is required.
@public_bp.route('/api/booking', methods=['POST'])
@csrf.exempt
@limiter.limit("5 per minute; 15 per hour")
def api_booking():
    try:
        data = request.get_json(silent=True) or request.form

        first_name = _clean(data.get('first_name'), MAX_NAME_LEN)
        last_name  = _clean(data.get('last_name'),  MAX_NAME_LEN)
        name = f"{first_name} {last_name}".strip() or _clean(data.get('name'), MAX_NAME_LEN)

        email   = _clean(data.get('email'),   MAX_EMAIL_LEN)
        phone   = _clean(data.get('phone'),   MAX_PHONE_LEN)
        service = _clean(data.get('service'), MAX_SERVICE_LEN)
        date    = _clean(data.get('date'),    20)
        message = _clean(data.get('message'), MAX_MSG_LEN)

        errors = []
        if not name:
            errors.append('Full name is required.')
        if not email:
            errors.append('Email is required.')
        elif not _valid_email(email):
            errors.append('Please enter a valid email address.')
        if not service:
            errors.append('Please select a service.')
        elif service not in ALLOWED_SERVICES:
            errors.append('Invalid service selected.')
        if not message:
            errors.append('Please describe your project.')
        elif len(message) < 10:
            errors.append('Message is too short — please give us a bit more detail.')

        if errors:
            return jsonify({'error': ' '.join(errors)}), 400

        # Embed preferred date into the saved message
        full_message = f"[Preferred Date: {date}]\n\n{message}" if date else message

        booking = Booking(
            name    = name,
            email   = email,
            phone   = phone,
            service = service,
            message = full_message,
            date    = date or None,
            status  = 'pending',
        )
        db.session.add(booking)
        db.session.commit()

        try:
            send_booking_notification({
                'name'   : name,
                'email'  : email,
                'phone'  : phone,
                # Show the human label in the email, not the slug
                'service': CATEGORY_LABELS.get(service, service.replace('-', ' ').title()),
                'date'   : date or 'Not specified',
                'message': message,
            })
        except Exception as mail_err:
            current_app.logger.error(f'Email notification error: {mail_err}')

        return jsonify({'success': True, 'id': booking.id}), 201

    except Exception as e:
        current_app.logger.error(f"Booking error: {e}")
        return jsonify({'error': 'Failed to submit booking. Please try again later.'}), 500


# ── API: Contact form ─────────────────────────────────────────────────────────
# Route first, then csrf.exempt, then limiter — this order is required.
@public_bp.route('/api/contact', methods=['POST'])
@csrf.exempt
@limiter.limit("5 per minute; 20 per hour")
def api_contact():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Invalid or missing JSON body'}), 400

        name    = _clean(data.get('name'),    MAX_NAME_LEN)
        email   = _clean(data.get('email'),   MAX_EMAIL_LEN)
        phone   = _clean(data.get('phone'),   MAX_PHONE_LEN)
        service = _clean(data.get('service'), MAX_SERVICE_LEN)
        content = _clean(data.get('message'), MAX_MSG_LEN)

        errors = []
        if not name:
            errors.append('Name is required.')
        if not email:
            errors.append('Email is required.')
        elif not _valid_email(email):
            errors.append('Please enter a valid email address.')
        if service and service not in ALLOWED_SERVICES:
            errors.append('Invalid service selected.')
        if not content or len(content) < 10:
            errors.append('Please enter a message (at least 10 characters).')

        if errors:
            return jsonify({'error': ' '.join(errors)}), 400

        full_message = content
        if service:
            # Use the human label in the stored message
            service_label = CATEGORY_LABELS.get(service, service.replace('-', ' ').title())
            full_message  = f"[Service: {service_label}]\n\n{content}"
        if phone:
            full_message += f"\n\nPhone: {phone}"

        msg = Message(
            sender_name  = name,
            sender_email = email,
            content      = full_message,
            is_read      = False,
        )
        db.session.add(msg)
        db.session.commit()

        try:
            send_contact_notification({
                'name'   : name,
                'email'  : email,
                'phone'  : phone,
                'service': CATEGORY_LABELS.get(service, service.replace('-', ' ').title()) if service else 'General Inquiry',
                'message': content,
            })
        except Exception as mail_err:
            current_app.logger.error(f'Contact email error: {mail_err}')

        return jsonify({'success': True, 'message': 'Message sent successfully.'}), 201

    except Exception as e:
        current_app.logger.error(f"Contact form error: {e}")
        return jsonify({'error': 'Failed to send message. Please try again later.'}), 500


# ── API: Reviews ──────────────────────────────────────────────────────────────
@public_bp.route('/api/reviews')
def get_reviews():
    return send_from_directory('static/data', 'reviews.json')