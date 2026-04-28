from flask import Blueprint, render_template, jsonify, request, current_app
from models import db, Portfolio, Booking, Message
from app import limiter
import re

public_bp = Blueprint('public', __name__)

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_NAME_LEN    = 100
MAX_EMAIL_LEN   = 254
MAX_PHONE_LEN   = 20
MAX_SERVICE_LEN = 100
MAX_MSG_LEN     = 2000    # cap free-text fields

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean(value, max_len):
    """Strip whitespace and hard-cap length."""
    return (value or '').strip()[:max_len]

def _valid_email(email):
    return bool(EMAIL_RE.match(email))


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


# ── API: Portfolio items ───────────────────────────────────────────────────────

@public_bp.route('/api/portfolio')
@limiter.limit("60 per minute")
def api_portfolio():
    try:
        category = _clean(request.args.get('category', ''), 50).lower()
        featured = _clean(request.args.get('featured', ''), 10).lower()
        page     = max(1, int(request.args.get('page', 1)))
        per_page = min(max(0, int(request.args.get('per_page', 0))), 100)  # cap at 100

        q = Portfolio.query.order_by(Portfolio.created_at.desc())

        if category and category != 'all':
            q = q.filter(Portfolio.category == category)

        if featured == 'true':
            q = q.filter(Portfolio.featured == True)

        if per_page > 0:
            paginated = q.paginate(page=page, per_page=per_page, error_out=False)
            items     = paginated.items
            total     = paginated.total
            pages     = paginated.pages
        else:
            items = q.all()
            total = len(items)
            pages = 1

        def serialize(item):
            if item.cloudinary_url:
                image_url = item.cloudinary_url.replace(
                    '/upload/',
                    '/upload/w_800,q_auto,f_auto/'
                )
                full_url = item.cloudinary_url
            elif item.file_path:
                image_url = f"/static/uploads/{item.file_path}"
                full_url  = image_url
            else:
                image_url = "/static/img/placeholder.jpg"
                full_url  = image_url

            return {
                "id"            : item.id,
                "title"         : item.title,
                "description"   : item.description or "",
                "category"      : item.category or "general",
                "category_label": (item.category or "general").capitalize(),
                "image_url"     : image_url,
                "full_url"      : full_url,
                "featured"      : item.featured,
                "created_at"    : item.created_at.strftime("%Y-%m-%d"),
                "size"          : "",
            }

        return jsonify({
            "items"   : [serialize(i) for i in items],
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


# ── API: Contact form ─────────────────────────────────────────────────────────

@public_bp.route('/api/contact', methods=['POST'])
@limiter.limit("5 per minute; 20 per hour")   # spam protection
def api_contact():
    try:
        data = request.get_json(silent=True) or request.form

        name    = _clean(data.get('name'),    MAX_NAME_LEN)
        email   = _clean(data.get('email'),   MAX_EMAIL_LEN)
        content = _clean(data.get('message'), MAX_MSG_LEN)
        phone   = _clean(data.get('phone'),   MAX_PHONE_LEN)
        service = _clean(data.get('service'), MAX_SERVICE_LEN)

        # ── Validation ────────────────────────────────────────────────────────
        errors = []
        if not name:
            errors.append('Name is required.')
        if not email:
            errors.append('Email is required.')
        elif not _valid_email(email):
            errors.append('Please enter a valid email address.')
        if not content:
            errors.append('Message is required.')
        if len(content) < 10:
            errors.append('Message is too short.')

        if errors:
            return jsonify({'error': ' '.join(errors)}), 400

        full_message = content
        if service:
            full_message = f"[Service: {service}]\n\n{content}"
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

        return jsonify({'success': True, 'message': 'Message sent successfully.'}), 201

    except Exception as e:
        current_app.logger.error(f"Contact form error: {e}")
        return jsonify({'error': 'Failed to send message. Please try again later.'}), 500


# ── API: Booking ──────────────────────────────────────────────────────────────

@public_bp.route('/api/booking', methods=['POST'])
@limiter.limit("5 per minute; 15 per hour")   # spam protection
def api_booking():
    try:
        data = request.get_json(silent=True) or request.form

        name    = _clean(data.get('name'),    MAX_NAME_LEN)
        email   = _clean(data.get('email'),   MAX_EMAIL_LEN)
        service = _clean(data.get('service'), MAX_SERVICE_LEN)
        phone   = _clean(data.get('phone'),   MAX_PHONE_LEN)
        message = _clean(data.get('message'), MAX_MSG_LEN)

        # ── Validation ────────────────────────────────────────────────────────
        errors = []
        if not name:
            errors.append('Name is required.')
        if not email:
            errors.append('Email is required.')
        elif not _valid_email(email):
            errors.append('Please enter a valid email address.')
        if not service:
            errors.append('Service is required.')

        if errors:
            return jsonify({'error': ' '.join(errors)}), 400

        booking = Booking(
            name    = name,
            email   = email,
            phone   = phone,
            service = service,
            message = message,
            status  = 'pending',
        )
        db.session.add(booking)
        db.session.commit()

        return jsonify({'success': True, 'id': booking.id}), 201

    except Exception as e:
        current_app.logger.error(f"Booking error: {e}")
        return jsonify({'error': 'Failed to submit booking. Please try again later.'}), 500