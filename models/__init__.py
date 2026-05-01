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
    role          = db.Column(db.String(20), default='admin')
    avatar        = db.Column(db.String(200), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<User {self.username}>'


# ── Portfolio ─────────────────────────────────────────────────────────────────

class Portfolio(db.Model):
    __tablename__ = 'portfolio'

    id             = db.Column(db.Integer, primary_key=True)
    title          = db.Column(db.String(100), nullable=False)
    description    = db.Column(db.Text)
    file_path      = db.Column(db.String(200), nullable=False, default='')
    # index=True — filtered on every public portfolio page load
    category       = db.Column(db.String(50), default='general', index=True)
    # index=True — homepage queries filter_by(featured=True)
    featured       = db.Column(db.Boolean, default=False, index=True)
    cloudinary_url = db.Column(db.String(500), nullable=True)
    cloudinary_id  = db.Column(db.String(200), nullable=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow, index=True)

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
    # index=True — dashboard and bookings page filter by status constantly
    status     = db.Column(db.String(20), default='pending', index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Admin-fillable fields
    date       = db.Column(db.String(20))
    time       = db.Column(db.String(20))
    location   = db.Column(db.String(200))
    # FIX: was Integer — silently truncated decimals (e.g. 1500.50 → 1500)
    # Numeric(10, 2) stores exact decimal values, safe for KES amounts
    amount     = db.Column(db.Numeric(10, 2), nullable=True)
    notes      = db.Column(db.Text)

    payments   = db.relationship('Payment', backref='booking', lazy=True)

    def __repr__(self):
        return f'<Booking {self.id}: {self.name} — {self.service}>'


# ── Contact Message ───────────────────────────────────────────────────────────

class Message(db.Model):
    __tablename__ = 'messages'

    id           = db.Column(db.Integer, primary_key=True)
    sender_name  = db.Column(db.String(100), nullable=False)
    sender_email = db.Column(db.String(100), nullable=False)
    content      = db.Column(db.Text, nullable=False)
    # index=True — dashboard queries filter_by(is_read=False) on every load
    is_read      = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<Message {self.id}: {self.sender_name} — read={self.is_read}>'

    def mark_read(self):
        self.is_read = True
        db.session.commit()


# ── Live Chat ─────────────────────────────────────────────────────────────────

class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'

    id             = db.Column(db.Integer, primary_key=True)
    client_name    = db.Column(db.String(100), nullable=False, default='Guest')
    client_contact = db.Column(db.String(100), default='')
    user_session   = db.Column(db.String(100), nullable=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow, index=True)
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
    sender          = db.Column(db.String(50), nullable=False)
    message         = db.Column(db.Text, nullable=False)
    timestamp       = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    # index=True — admin chat panel queries unread messages
    is_read         = db.Column(db.Boolean, default=False, nullable=False, index=True)

    def __repr__(self):
        return f'<ChatMessage {self.id}: {self.sender} — {self.message[:50]}>'


# ── Payment ───────────────────────────────────────────────────────────────────

class Payment(db.Model):
    __tablename__ = 'payments'

    id             = db.Column(db.Integer, primary_key=True)
    booking_id     = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True)
    # FIX: was Float — floats are imprecise for money (e.g. 1500.1 + 1500.2 ≠ 3000.3)
    # Numeric(10, 2) is exact
    amount         = db.Column(db.Numeric(10, 2), nullable=False)
    currency       = db.Column(db.String(10), default='KES')
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100), unique=True, nullable=True)
    # index=True — dashboard SUM query and filter_by(status='completed')
    status         = db.Column(db.String(20), default='pending', index=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<Payment {self.id}: {self.amount} {self.currency} — {self.status}>'


# ── Video ─────────────────────────────────────────────────────────────────────

class Video(db.Model):
    __tablename__ = 'videos'

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    url         = db.Column(db.String(500), nullable=False)
    youtube_id  = db.Column(db.String(20), nullable=False)
    # index=True — public video page filters by category
    category    = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.Text, default='')
    duration    = db.Column(db.String(20), default='')
    # index=True — featured videos are ordered/filtered on every page load
    featured    = db.Column(db.Boolean, default=False, index=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<Video {self.id}: {self.title}>'