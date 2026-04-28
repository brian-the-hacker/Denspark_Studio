"""
models.py — single source of truth for all Denspark Studio database models.

Run after any column changes:
    flask db migrate -m "your message"
    flask db upgrade
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


# ── User (admin login) ────────────────────────────────────────────────────────

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    avatar        = db.Column(db.String(200), nullable=True)   # filename e.g. 'avatar_1.jpg'
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'


# ── Portfolio ─────────────────────────────────────────────────────────────────

class Portfolio(db.Model):
    __tablename__ = 'portfolio'

    id             = db.Column(db.Integer, primary_key=True)
    title          = db.Column(db.String(100), nullable=False)
    description    = db.Column(db.Text)
    file_path      = db.Column(db.String(200), nullable=False, default='')
    category       = db.Column(db.String(50), default='general')
    featured       = db.Column(db.Boolean, default=False)
    cloudinary_url = db.Column(db.String(500), nullable=True)  # full https URL
    cloudinary_id  = db.Column(db.String(200), nullable=True)  # public_id for deletion
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Portfolio {self.id}: {self.title}>'


# ── Booking ───────────────────────────────────────────────────────────────────

class Booking(db.Model):
    __tablename__ = 'bookings'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(120), nullable=False)
    phone      = db.Column(db.String(20))
    service    = db.Column(db.String(100), nullable=False)
    message    = db.Column(db.Text)
    status     = db.Column(db.String(20), default='pending')  # pending | approved | rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Payments linked to this booking
    payments   = db.relationship('Payment', backref='booking', lazy=True)

    def __repr__(self):
        return f'<Booking {self.id}: {self.name} — {self.service}>'


# ── Contact Message (from the website contact form) ───────────────────────────
# This is what admin.py queries with Message.query.filter_by(is_read=False)

class Message(db.Model):
    __tablename__ = 'messages'

    id           = db.Column(db.Integer, primary_key=True)
    sender_name  = db.Column(db.String(100), nullable=False)
    sender_email = db.Column(db.String(100), nullable=False)
    content      = db.Column(db.Text, nullable=False)
    is_read      = db.Column(db.Boolean, default=False, nullable=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Message {self.id}: {self.sender_name} — read={self.is_read}>'

    def mark_read(self):
        self.is_read = True
        db.session.commit()


# ── Live Chat (separate from contact-form messages) ───────────────────────────
# Renamed to ChatConversation / ChatMessage to avoid any class-name collision.

class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'

    id             = db.Column(db.Integer, primary_key=True)
    client_name    = db.Column(db.String(100), nullable=False, default='Guest')
    client_contact = db.Column(db.String(100), default='')
    user_session   = db.Column(db.String(100), nullable=True)   # anonymous session id
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow,
                               onupdate=datetime.utcnow)

    chat_messages  = db.relationship(
        'ChatMessage',
        backref='conversation',
        lazy=True,
        cascade='all, delete-orphan',
    )

    def __repr__(self):
        return f'<ChatConversation {self.id}: {self.client_name}>'


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id              = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chat_conversations.id'),
                                nullable=False)
    sender          = db.Column(db.String(50), nullable=False)  # 'admin' | 'client'
    message         = db.Column(db.Text, nullable=False)
    timestamp       = db.Column(db.DateTime, default=datetime.utcnow)
    is_read         = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return f'<ChatMessage {self.id}: {self.sender} — {self.message[:50]}>'


# ── Payment ───────────────────────────────────────────────────────────────────

class Payment(db.Model):
    __tablename__ = 'payments'

    id             = db.Column(db.Integer, primary_key=True)
    booking_id     = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True)
    amount         = db.Column(db.Float, nullable=False)
    currency       = db.Column(db.String(10), default='KES')
    payment_method = db.Column(db.String(50))   # 'stripe' | 'mpesa'
    transaction_id = db.Column(db.String(100))
    status         = db.Column(db.String(20), default='pending')  # pending | completed | failed
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.id}: {self.amount} {self.currency} — {self.status}>'

class Video(db.Model):
    __tablename__ = 'videos'

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    url         = db.Column(db.String(500), nullable=False)
    youtube_id  = db.Column(db.String(20), nullable=False)
    category    = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, default='')
    duration    = db.Column(db.String(20), default='')
    featured    = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)