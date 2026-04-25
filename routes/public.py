from flask import Blueprint, render_template, jsonify, request, current_app
from models import db, Portfolio, Booking, Message
from datetime import datetime

public_bp = Blueprint('public', __name__)

# ── Public pages ─────────────────────────────────────────────────────────────

@public_bp.route('/')
def index():
    featured = Portfolio.query.filter_by(featured=True).order_by(Portfolio.created_at.desc()).limit(6).all()
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


# ── API: Portfolio items ──────────────────────────────────────────────────────

@public_bp.route('/api/portfolio')
def api_portfolio():
    try:
        category  = request.args.get('category', '').strip().lower()
        featured  = request.args.get('featured', '').strip().lower()
        page      = int(request.args.get('page', 1))
        per_page  = int(request.args.get('per_page', 0))

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
                # Thumbnail: 800px wide, auto quality, auto format (WebP where supported)
                # Used in the grid — fast loading
                image_url = item.cloudinary_url.replace(
                    '/upload/',
                    '/upload/w_800,q_auto,f_auto/'
                )
                # Full size: original Cloudinary URL for the lightbox
                full_url = item.cloudinary_url
            elif item.file_path:
                # Local fallback — same URL for both thumbnail and full
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
                "image_url"     : image_url,   # compressed thumbnail for grid
                "full_url"      : full_url,    # original full resolution for lightbox
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

    except Exception as e:
        current_app.logger.error(f"API portfolio error: {e}")
        return jsonify({"error": "Failed to load portfolio", "items": []}), 500


# ── API: Contact form submission ──────────────────────────────────────────────

@public_bp.route('/api/contact', methods=['POST'])
def api_contact():
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        name    = (data.get('name') or '').strip()
        email   = (data.get('email') or '').strip()
        content = (data.get('message') or '').strip()
        phone   = (data.get('phone') or '').strip()
        service = (data.get('service') or '').strip()

        if not name or not email or not content:
            return jsonify({'error': 'Name, email and message are required'}), 400

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

        return jsonify({'success': True, 'message': 'Message sent successfully'}), 201

    except Exception as e:
        current_app.logger.error(f"Contact form error: {e}")
        return jsonify({'error': 'Failed to send message'}), 500


# ── API: Booking submission ───────────────────────────────────────────────────

@public_bp.route('/api/booking', methods=['POST'])
def api_booking():
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        name    = (data.get('name') or '').strip()
        email   = (data.get('email') or '').strip()
        service = (data.get('service') or '').strip()
        phone   = (data.get('phone') or '').strip()
        message = (data.get('message') or '').strip()

        if not name or not email or not service:
            return jsonify({'error': 'Name, email and service are required'}), 400

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
        return jsonify({'error': 'Failed to submit booking'}), 500