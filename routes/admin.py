from flask import Blueprint, render_template, request, jsonify, current_app, redirect, url_for
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, Portfolio, Booking, Message, Payment, Conversation
import os
import uuid

admin_bp = Blueprint('admin', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    # Get all necessary data
    total_bookings = Booking.query.count()
    pending_bookings = Booking.query.filter_by(status='pending').count()
    total_uploads = Portfolio.query.count()
    
    # Handle messages
    try:
        if hasattr(Message, 'created_at'):
            recent_messages = Message.query.order_by(Message.created_at.desc()).limit(5).all()
            total_messages = Message.query.count()
        else:
            recent_messages = Message.query.limit(5).all()
            total_messages = Message.query.count()
    except:
        recent_messages = []
        total_messages = 0
    
    unread_messages = total_messages  # Simplified for now
    
    # Calculate revenue
    try:
        completed_payments = Payment.query.filter_by(status='completed').all()
        total_revenue = sum(payment.amount for payment in completed_payments)
    except:
        total_revenue = 0
    
    # Get recent bookings
    try:
        if hasattr(Booking, 'created_at'):
            recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(5).all()
        else:
            recent_bookings = Booking.query.limit(5).all()
    except:
        recent_bookings = []
    
    # Get recent payments
    try:
        if hasattr(Payment, 'created_at'):
            recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(5).all()
        else:
            recent_payments = Payment.query.limit(5).all()
    except:
        recent_payments = []

    return render_template('admin/dashboard.html',
        total_bookings=total_bookings,
        total_messages=total_messages,
        total_uploads=total_uploads,
        recent_bookings=recent_bookings,
        pending_bookings=pending_bookings,
        unread_messages=unread_messages,
        messages=recent_messages,
        recent_payments=recent_payments,
        current_user=current_user,
        total_revenue=total_revenue
    )

@admin_bp.route('/portfolio')
@login_required
def portfolio():
    items = Portfolio.query.order_by(Portfolio.created_at.desc()).all()
    return render_template('admin/portfolio.html', items=items, current_user=current_user)

@admin_bp.route('/bookings')
@login_required
def bookings():
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    return render_template('admin/bookings.html', bookings=bookings, current_user=current_user)

@admin_bp.route('/messages')
@login_required
def messages():  # Changed from get_messages to messages
    messages = Message.query.order_by(Message.created_at.desc()).all()
    return render_template('admin/messages.html', messages=messages, current_user=current_user)

@admin_bp.route('/payments')
@login_required
def payments():
    payments = Payment.query.order_by(Payment.created_at.desc()).all()
    return render_template('admin/payments.html', payments=payments, current_user=current_user)

@admin_bp.route('/analytics')
@login_required
def analytics():
    return render_template('admin/analytics.html', current_user=current_user)

@admin_bp.route('/settings')
@login_required
def settings():
    return render_template('admin/settings.html', current_user=current_user)

@admin_bp.route('/portfolio/upload', methods=['POST'])
@login_required
def upload_portfolio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400

    filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    item = Portfolio(
        title=request.form['title'],
        description=request.form.get('description', ''),
        category=request.form['category'],
        file_path=filename
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'success': True, 'id': item.id}), 201

@admin_bp.route('/portfolio/delete/<int:id>', methods=['DELETE'])
@login_required
def delete_portfolio(id):
    item = Portfolio.query.get_or_404(id)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], item.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})

@admin_bp.route('/bookings/update', methods=['POST'])
@login_required
def update_booking():
    data = request.get_json()
    booking = Booking.query.get_or_404(data['id'])
    booking.status = data['status']
    db.session.commit()
    return jsonify({'success': True})