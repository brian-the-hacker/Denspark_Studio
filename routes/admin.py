"""
admin.py — Denspark Studio admin blueprint.
All admin routes are protected by both @login_required and @admin_required.
Public API routes (/api/*) are unprotected by design.
"""

from datetime import datetime
from functools import wraps
from flask import (Blueprint, render_template, request, jsonify,
                   current_app, redirect, url_for, abort)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, Portfolio, Booking, Message, Payment, Video
import os
import uuid
import re

import cloudinary
import cloudinary.uploader

admin_bp = Blueprint('admin', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}


# ── Decorators ────────────────────────────────────────────────────────────────

def admin_required(f):
    """Enforce is_admin=True. Always stack BELOW @login_required."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated


# ── Helpers ───────────────────────────────────────────────────────────────────

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_youtube_id(url):
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:shorts\/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — /api/*  (no auth — served to public pages)
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/api/portfolio')
def api_portfolio():
    query    = Portfolio.query
    category = request.args.get('category', '').strip().lower()
    featured = request.args.get('featured', '').strip().lower()

    if category and category != 'all':
        query = query.filter(Portfolio.category.ilike(category))
    if featured == 'true':
        query = query.filter(Portfolio.featured == True)

    items = query.order_by(Portfolio.created_at.desc()).all()

    return jsonify({
        'success': True,
        'total':   len(items),
        'items': [
            {
                'id':             item.id,
                'title':          item.title,
                'description':    item.description or '',
                'category':       item.category,
                'category_label': item.category.replace('-', ' ').title(),
                'featured':       item.featured,
                'image_url':      item.cloudinary_url or (
                    f'/static/uploads/{item.file_path}' if item.file_path else ''
                ),
                'full_url':       item.cloudinary_url or (
                    f'/static/uploads/{item.file_path}' if item.file_path else ''
                ),
                'created_at':     item.created_at.strftime('%Y-%m-%d'),
            }
            for item in items
        ]
    })


@admin_bp.route('/api/videos')
def api_videos():
    query    = Video.query
    category = request.args.get('category', '').strip().lower()
    featured = request.args.get('featured', '').strip().lower()

    if category and category != 'all':
        query = query.filter(Video.category.ilike(category))
    if featured == 'true':
        query = query.filter(Video.featured == True)

    videos = query.order_by(Video.featured.desc(), Video.created_at.desc()).all()

    return jsonify({
        'success': True,
        'total':   len(videos),
        'videos': [
            {
                'id':             v.id,
                'title':          v.title,
                'url':            v.url,
                'youtube_id':     v.youtube_id,
                'category':       v.category,
                'category_label': v.category.replace('-', ' ').title(),
                'description':    v.description or '',
                'duration':       v.duration or '',
                'featured':       v.featured,
                'thumbnail':      f'https://img.youtube.com/vi/{v.youtube_id}/maxresdefault.jpg',
                'created_at':     v.created_at.strftime('%Y-%m-%d'),
            }
            for v in videos
        ]
    })


@admin_bp.route('/api/videos/<int:video_id>')
def api_video_single(video_id):
    v = db.session.get(Video, video_id)
    if not v:
        abort(404)
    return jsonify({
        'success':     True,
        'id':          v.id,
        'title':       v.title,
        'url':         v.url,
        'youtube_id':  v.youtube_id,
        'category':    v.category,
        'description': v.description or '',
        'duration':    v.duration or '',
        'featured':    v.featured,
        'thumbnail':   f'https://img.youtube.com/vi/{v.youtube_id}/maxresdefault.jpg',
        'created_at':  v.created_at.strftime('%Y-%m-%d'),
    })


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC PAGES (no auth)
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/video-production')
def video_production():
    return render_template('public/video_production.html')


@admin_bp.route('/packages')
def packages():
    return render_template('public/packages.html')


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    total_bookings   = Booking.query.count()
    pending_bookings = Booking.query.filter_by(status='pending').count()
    total_uploads    = Portfolio.query.count()
    total_messages   = Message.query.count()
    unread_messages  = Message.query.filter_by(is_read=False).count()
    total_videos     = Video.query.count()

    recent_messages = Message.query.order_by(Message.created_at.desc()).limit(5).all()
    recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(5).all()
    recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(5).all()

    completed_payments = Payment.query.filter_by(status='completed').all()
    total_revenue = sum(p.amount for p in completed_payments)

    return render_template('admin/dashboard.html',
        total_bookings   = total_bookings,
        total_messages   = total_messages,
        total_uploads    = total_uploads,
        total_videos     = total_videos,
        recent_bookings  = recent_bookings,
        pending_bookings = pending_bookings,
        unread_messages  = unread_messages,
        messages         = recent_messages,
        recent_payments  = recent_payments,
        current_user     = current_user,
        total_revenue    = total_revenue,
    )


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — PORTFOLIO
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/portfolio')
@login_required
@admin_required
def portfolio():
    items = Portfolio.query.order_by(Portfolio.created_at.desc()).all()
    return render_template('admin/portfolio.html', items=items, current_user=current_user)


@admin_bp.route('/portfolio/upload', methods=['POST'])
@login_required
@admin_required
def upload_portfolio():
    current_app.logger.info(f"Upload hit. Content-Length: {request.content_length}")

    if 'file' not in request.files:
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

    cloudinary_url = None
    cloudinary_id  = None
    local_filename = None

    if os.environ.get('CLOUDINARY_CLOUD_NAME'):
        try:
            result = cloudinary.uploader.upload(
                file,
                folder         = 'denspark/portfolio',
                transformation = [
                    {'width': 1600, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'fetch_format': 'auto'},
                ],
                resource_type  = 'image',
            )
            cloudinary_url = result.get('secure_url')
            cloudinary_id  = result.get('public_id')
        except Exception as e:
            current_app.logger.warning(f'Cloudinary upload failed, falling back: {e}')

    if not cloudinary_url:
        local_filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        upload_folder  = current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file.seek(0)
        file.save(os.path.join(upload_folder, local_filename))

    item = Portfolio(
        title          = title,
        description    = desc,
        category       = category,
        featured       = featured,
        cloudinary_url = cloudinary_url,
        cloudinary_id  = cloudinary_id,
        file_path      = local_filename or '',
    )
    db.session.add(item)
    db.session.commit()

    return jsonify({
        'success':        True,
        'id':             item.id,
        'cloudinary_url': cloudinary_url,
        'file_path':      local_filename,
    }), 201


@admin_bp.route('/portfolio/edit/<int:id>', methods=['POST'])
@login_required
@admin_required
def edit_portfolio(id):
    item = db.session.get(Portfolio, id)
    if not item:
        abort(404)
    data = request.get_json(silent=True) or {}

    title    = data.get('title', '').strip()
    category = data.get('category', '').strip()

    if not title or not category:
        return jsonify({'error': 'Title and category are required'}), 400

    item.title       = title
    item.category    = category
    item.description = data.get('description', '').strip()
    item.featured    = bool(data.get('featured', False))
    db.session.commit()

    return jsonify({'success': True})


@admin_bp.route('/portfolio/delete/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def delete_portfolio(id):
    item = db.session.get(Portfolio, id)
    if not item:
        abort(404)

    if getattr(item, 'cloudinary_id', None):
        try:
            cloudinary.uploader.destroy(item.cloudinary_id)
        except Exception as e:
            current_app.logger.warning(f'Cloudinary delete failed: {e}')

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


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — VIDEOS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/videos')
@login_required
@admin_required
def videos():
    all_videos = Video.query.order_by(Video.created_at.desc()).all()
    return render_template('admin/admin_videos.html',
                           videos=all_videos, current_user=current_user)


@admin_bp.route('/videos/add', methods=['POST'])
@login_required
@admin_required
def add_video():
    data = request.get_json(silent=True) or {}

    url = data.get('url', '').strip()
    if not url:
        return jsonify({'success': False, 'error': 'YouTube URL is required'}), 400

    youtube_id = extract_youtube_id(url)
    if not youtube_id:
        return jsonify({'success': False, 'error': 'Could not detect a valid YouTube video ID'}), 400

    title    = data.get('title', '').strip()
    category = data.get('category', '').strip()
    if not title or not category:
        return jsonify({'success': False, 'error': 'Title and category are required'}), 400

    video = Video(
        title       = title,
        url         = url,
        youtube_id  = youtube_id,
        category    = category,
        description = data.get('description', '').strip(),
        duration    = data.get('duration', '').strip(),
        featured    = bool(data.get('featured', False)),
    )
    db.session.add(video)
    db.session.commit()

    return jsonify({
        'success':     True,
        'id':          video.id,
        'youtube_id':  youtube_id,
        'thumbnail':   f'https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg',
        'title':       video.title,
        'category':    video.category,
        'description': video.description,
        'duration':    video.duration,
        'featured':    video.featured,
        'url':         video.url,
    }), 201


@admin_bp.route('/videos/edit/<int:video_id>', methods=['POST', 'PUT'])
@login_required
@admin_required
def edit_video(video_id):
    video = db.session.get(Video, video_id)
    if not video:
        abort(404)
    data = request.get_json(silent=True) or {}

    url = data.get('url', '').strip()
    if not url:
        return jsonify({'success': False, 'error': 'YouTube URL is required'}), 400

    youtube_id = extract_youtube_id(url)
    if not youtube_id:
        return jsonify({'success': False, 'error': 'Invalid YouTube URL'}), 400

    title    = data.get('title', '').strip()
    category = data.get('category', '').strip()
    if not title or not category:
        return jsonify({'success': False, 'error': 'Title and category are required'}), 400

    video.title       = title
    video.url         = url
    video.youtube_id  = youtube_id
    video.category    = category
    video.description = data.get('description', '').strip()
    video.duration    = data.get('duration', '').strip()
    video.featured    = bool(data.get('featured', False))
    db.session.commit()

    return jsonify({
        'success':     True,
        'id':          video.id,
        'youtube_id':  youtube_id,
        'thumbnail':   f'https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg',
        'title':       video.title,
        'category':    video.category,
        'description': video.description,
        'duration':    video.duration,
        'featured':    video.featured,
        'url':         video.url,
    })


@admin_bp.route('/videos/delete/<int:video_id>', methods=['DELETE', 'POST'])
@login_required
@admin_required
def delete_video(video_id):
    video = db.session.get(Video, video_id)
    if not video:
        abort(404)
    title = video.title
    db.session.delete(video)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Video "{title}" deleted.'})


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — BOOKINGS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/bookings')
@login_required
@admin_required
def bookings():
    all_bookings = Booking.query.order_by(Booking.id.desc()).all()
    stats = {
        'total':     Booking.query.count(),
        'pending':   Booking.query.filter_by(status='pending').count(),
        'confirmed': Booking.query.filter_by(status='confirmed').count(),
        'completed': Booking.query.filter_by(status='completed').count(),
    }
    return render_template('admin/bookings.html',
                           bookings=all_bookings,
                           stats=stats,
                           total_bookings=stats['total'])


@admin_bp.route('/bookings/create', methods=['POST'])
@login_required
@admin_required
def create_booking():
    data = request.form
    booking = Booking(
        name     = data.get('name'),
        email    = data.get('email'),
        phone    = data.get('phone'),
        service  = data.get('service'),
        date     = data.get('date'),
        time     = data.get('time'),
        location = data.get('location'),
        amount   = data.get('amount') or None,
        notes    = data.get('notes'),
        status   = data.get('status', 'pending'),
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify({
        'success': True,
        'booking': {
            'id':       booking.id,
            'name':     booking.name,
            'email':    booking.email,
            'phone':    booking.phone or '',
            'service':  booking.service,
            'date':     booking.date or '',
            'time':     booking.time or '',
            'location': booking.location or '',
            'amount':   float(booking.amount) if booking.amount else None,
            'notes':    booking.notes or '',
            'status':   booking.status,
        }
    })


@admin_bp.route('/bookings/<int:booking_id>/update', methods=['POST'])
@login_required
@admin_required
def update_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        abort(404)
    f = request.form

    booking.name     = f.get('name',     booking.name)
    booking.email    = f.get('email',    booking.email)
    booking.phone    = f.get('phone',    booking.phone)
    booking.service  = f.get('service',  booking.service)
    booking.date     = f.get('date',     booking.date)
    booking.time     = f.get('time',     booking.time)
    booking.location = f.get('location', booking.location)
    booking.notes    = f.get('notes',    booking.notes)
    booking.status   = f.get('status',   booking.status)

    raw_amount = f.get('amount', '')
    booking.amount = float(raw_amount) if raw_amount else None

    db.session.commit()
    return jsonify({'success': True})


@admin_bp.route('/bookings/<int:booking_id>/confirm', methods=['POST'])
@login_required
@admin_required
def confirm_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        abort(404)
    booking.status = 'confirmed'
    db.session.commit()
    return jsonify({'success': True, 'status': 'confirmed'})


@admin_bp.route('/bookings/<int:booking_id>/cancel', methods=['POST'])
@login_required
@admin_required
def cancel_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        abort(404)
    booking.status = 'cancelled'
    db.session.commit()
    return jsonify({'success': True, 'status': 'cancelled'})


@admin_bp.route('/bookings/<int:booking_id>/delete', methods=['POST'])
@login_required
@admin_required
def delete_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        abort(404)
    db.session.delete(booking)
    db.session.commit()
    return jsonify({'success': True})


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — MESSAGES
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/messages')
@login_required
@admin_required
def messages():
    msgs = Message.query.filter(
        Message.sender_name  != None,
        Message.sender_email != None,
    ).order_by(Message.created_at.desc()).all()
    return render_template('admin/chat.html', messages=msgs, current_user=current_user)


@admin_bp.route('/messages/<int:id>/read', methods=['POST'])
@login_required
@admin_required
def mark_message_read(id):
    msg = db.session.get(Message, id)
    if not msg:
        abort(404)
    msg.is_read = True
    db.session.commit()
    return jsonify({'success': True})


@admin_bp.route('/messages/<int:id>/delete', methods=['DELETE'])
@login_required
@admin_required
def delete_message(id):
    msg = db.session.get(Message, id)
    if not msg:
        abort(404)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'success': True})


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — PAYMENTS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/payments')
@login_required
@admin_required
def payments():
    pmts = Payment.query.order_by(Payment.created_at.desc()).all()
    return render_template('admin/payments.html', payments=pmts, current_user=current_user)


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — OTHER
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/analytics')
@login_required
@admin_required
def analytics():
    return render_template('admin/analytics.html', current_user=current_user)


@admin_bp.route('/settings')
@login_required
@admin_required
def settings():
    return render_template('admin/settings.html', current_user=current_user)