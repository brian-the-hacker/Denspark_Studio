from flask import Blueprint, render_template, request, jsonify, current_app, redirect, url_for
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, Portfolio, Booking, Message, Payment
import os
import uuid

# ── Cloudinary ──────────────────────────────────────────────────────────────
# pip install cloudinary
import cloudinary
import cloudinary.uploader

def init_cloudinary():
    """Call this once in your app factory / create_app()."""
    cloudinary.config(
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key    = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
        secure     = True
    )
# ────────────────────────────────────────────────────────────────────────────

admin_bp = Blueprint('admin', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Dashboard ────────────────────────────────────────────────────────────────
@admin_bp.route('/dashboard')
@login_required
def dashboard():
    total_bookings   = Booking.query.count()
    pending_bookings = Booking.query.filter_by(status='pending').count()
    total_uploads    = Portfolio.query.count()

    try:
        recent_messages = Message.query.order_by(Message.created_at.desc()).limit(5).all()
        total_messages  = Message.query.count()
    except Exception:
        recent_messages = []
        total_messages  = 0

    unread_messages = Message.query.filter_by(is_read=False).count()

    try:
        completed_payments = Payment.query.filter_by(status='completed').all()
        total_revenue = sum(p.amount for p in completed_payments)
    except Exception:
        total_revenue = 0

    try:
        recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(5).all()
    except Exception:
        recent_bookings = []

    try:
        recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(5).all()
    except Exception:
        recent_payments = []

    return render_template('admin/dashboard.html',
        total_bookings   = total_bookings,
        total_messages   = total_messages,
        total_uploads    = total_uploads,
        recent_bookings  = recent_bookings,
        pending_bookings = pending_bookings,
        unread_messages  = unread_messages,
        messages         = recent_messages,
        recent_payments  = recent_payments,
        current_user     = current_user,
        total_revenue    = total_revenue,
    )


# ── Portfolio list ────────────────────────────────────────────────────────────
@admin_bp.route('/portfolio')
@login_required
def portfolio():
    items = Portfolio.query.order_by(Portfolio.created_at.desc()).all()
    return render_template('admin/portfolio.html', items=items, current_user=current_user)


# ── Upload (Cloudinary-first, local fallback) ─────────────────────────────────
@login_required
def upload_portfolio():
    current_app.logger.error(f"Hit upload route. Content-Length: {request.content_length}")
    current_app.logger.error(f"CLOUDINARY_CLOUD_NAME exists: {bool(os.environ.get('CLOUDINARY_CLOUD_NAME'))}")
    
    if 'file' not in request.files:
        current_app.logger.error(f"Keys in request.files: {list(request.files.keys())}")
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    title    = request.form.get('title', '').strip()
    category = request.form.get('category', 'general').strip()
    desc     = request.form.get('description', '').strip()
    featured = request.form.get('featured', '0') in ('1', 'true', 'on')

    if not title or not category:
        return jsonify({'error': 'Title and category are required'}), 400

    cloudinary_url  = None
    cloudinary_id   = None
    local_filename  = None

    # ── Try Cloudinary first ──────────────────────────────────────────────
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    if cloud_name:
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder        = 'denspark/portfolio',
                transformation = [
                    {'width': 1600, 'crop': 'limit'},   # never larger than 1600px
                    {'quality': 'auto'},                  # auto compress
                    {'fetch_format': 'auto'},             # serve WebP where supported
                ],
                resource_type = 'image',
            )
            cloudinary_url = upload_result.get('secure_url')
            cloudinary_id  = upload_result.get('public_id')
        except Exception as e:
            current_app.logger.warning(f'Cloudinary upload failed, falling back to disk: {e}')

    # ── Fallback: save to disk ────────────────────────────────────────────
    if not cloudinary_url:
        local_filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        upload_folder  = current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file.seek(0)  # rewind in case Cloudinary attempted a partial read
        file.save(os.path.join(upload_folder, local_filename))

    # ── Save to DB ────────────────────────────────────────────────────────
    item = Portfolio(
        title         = title,
        description   = desc,
        category      = category,
        featured      = featured,
        # Cloudinary fields (add these columns to your model — see note below)
        cloudinary_url= cloudinary_url,
        cloudinary_id = cloudinary_id,
        # Local fallback path (existing column)
        file_path     = local_filename or '',
    )
    db.session.add(item)
    db.session.commit()

    return jsonify({
        'success'       : True,
        'id'            : item.id,
        'cloudinary_url': cloudinary_url,
        'file_path'     : local_filename,
    }), 201


# ── Edit (title / description / category / featured) ─────────────────────────
@admin_bp.route('/portfolio/edit/<int:id>', methods=['POST'])
@login_required
def edit_portfolio(id):
    item = Portfolio.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    title    = data.get('title', '').strip()
    category = data.get('category', '').strip()
    desc     = data.get('description', '').strip()
    featured = bool(data.get('featured', False))

    if not title or not category:
        return jsonify({'error': 'Title and category are required'}), 400

    item.title       = title
    item.category    = category
    item.description = desc
    item.featured    = featured
    db.session.commit()

    return jsonify({'success': True})


# ── Delete ────────────────────────────────────────────────────────────────────
@admin_bp.route('/portfolio/delete/<int:id>', methods=['DELETE'])
@login_required
def delete_portfolio(id):
    item = Portfolio.query.get_or_404(id)

    # Delete from Cloudinary if we have a public_id
    if getattr(item, 'cloudinary_id', None):
        try:
            cloudinary.uploader.destroy(item.cloudinary_id)
        except Exception as e:
            current_app.logger.warning(f'Cloudinary delete failed: {e}')
            # Don't abort — still remove from DB

    # Delete local file if it exists
    if item.file_path:
        local_path = os.path.join(
            current_app.config.get('UPLOAD_FOLDER', 'static/uploads'),
            item.file_path
        )
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError as e:
                current_app.logger.warning(f'Could not remove local file: {e}')

    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})


# ── Bookings ──────────────────────────────────────────────────────────────────
@admin_bp.route('/bookings')
@login_required
def bookings():
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    return render_template('admin/bookings.html', bookings=bookings, current_user=current_user)

@admin_bp.route('/bookings/update', methods=['POST'])
@login_required
def update_booking():
    data    = request.get_json(silent=True) or {}
    booking = Booking.query.get_or_404(data.get('id'))
    booking.status = data.get('status', booking.status)
    db.session.commit()
    return jsonify({'success': True})


# ── Messages ──────────────────────────────────────────────────────────────────
@admin_bp.route('/messages')
@login_required
def messages():
    msgs = Message.query.order_by(Message.created_at.desc()).all()
    return render_template('admin/chat.html', messages=msgs, current_user=current_user)


# ── Payments ──────────────────────────────────────────────────────────────────
@admin_bp.route('/payments')
@login_required
def payments():
    pmts = Payment.query.order_by(Payment.created_at.desc()).all()
    return render_template('admin/payments.html', payments=pmts, current_user=current_user)


# ── Analytics / Settings ──────────────────────────────────────────────────────
@admin_bp.route('/analytics')
@login_required
def analytics():
    return render_template('admin/analytics.html', current_user=current_user)

@admin_bp.route('/settings')
@login_required
def settings():
    return render_template('admin/settings.html', current_user=current_user)