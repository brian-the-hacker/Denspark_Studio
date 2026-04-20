from flask import Blueprint, render_template, request, jsonify
from models import db, Portfolio, Booking

public_bp = Blueprint('public', __name__)

@public_bp.route('/')
def index():
    featured = Portfolio.query.order_by(Portfolio.created_at.desc()).limit(6).all()
    return render_template('public/index.html', featured=featured)

@public_bp.route('/portfolio')
def portfolio():
    items = Portfolio.query.order_by(Portfolio.created_at.desc()).all()
    return render_template('public/portfolio.html', portfolio_items=items)

@public_bp.route('/services')
def services():
    return render_template('public/services.html')

@public_bp.route('/about')
def about():
    return render_template('public/about.html')

@public_bp.route('/contact')
def contact():
    return render_template('public/contact.html')

@public_bp.route('/chat')
def chat():
    return render_template('public/chat.html')

# API endpoint for booking form
@public_bp.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    booking = Booking(
        name=data['name'],
        phone=data['phone'],
        email=data['email'],
        service=data['service'],
        message=data.get('message', '')
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify({'success': True, 'booking_id': booking.id}), 201

@public_bp.route('/api/portfolio')
def get_portfolio():
    items = Portfolio.query.all()
    return jsonify([{
        'id': i.id,
        'title': i.title,
        'description': i.description,
        'file_path': i.file_path,
        'category': i.category
    } for i in items])