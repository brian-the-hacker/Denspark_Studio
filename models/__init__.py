"""
models/__init__.py — single source of truth for Denspark Studio.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(20), default='admin')
    avatar        = db.Column(db.String(200), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'


class Portfolio(db.Model):
    __tablename__ = 'portfolio'

    id             = db.Column(db.Integer, primary_key=True)
    title          = db.Column(db.String(200), nullable=False)
    description    = db.Column(db.Text)
    file_path      = db.Column(db.String(300), nullable=False, default='')
    category       = db.Column(db.String(50), nullable=False, default='general')
    featured       = db.Column(db.Boolean, default=False)
    cloudinary_url = db.Column(db.String(500), nullable=True)
    cloudinary_id  = db.Column(db.String(200), nullable=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Portfolio {self.id}: {self.title}>'


class Booking(db.Model):
    __tablename__ = 'bookings'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    phone      = db.Column(db.String(20), nullable=False)
    email      = db.Column(db.String(120), nullable=False)
    service    = db.Column(db.String(100), nullable=False)
    message    = db.Column(db.Text)
    status     = db.Column(db.String(20), default='pending')  # pending|approved|rejected|completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    payments   = db.relationship('Payment', backref='booking', lazy=True)

    def __repr__(self):
        return f'<Booking {self.id}: {self.name}>'


class Conversation(db.Model):
    """Live chat conversations (widget on the site)."""
    __tablename__ = 'conversations'

    id             = db.Column(db.Integer, primary_key=True)
    client_name    = db.Column(db.String(100), default='Guest')
    client_contact = db.Column(db.String(120), default='')
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow,
                               onupdate=datetime.utcnow)

    messages = db.relationship(
        'Message', backref='conversation', lazy=True, cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<Conversation {self.id}: {self.client_name}>'


class Message(db.Model):
    """
    Live chat messages AND contact-form submissions share this table.
    - Live chat:    conversation_id is set, sender = 'admin'|'client'
    - Contact form: conversation_id is NULL, sender_name/sender_email are set
    """
    __tablename__ = 'messages'

    id              = db.Column(db.Integer, primary_key=True)

    # ── live-chat fields ──────────────────────────────────────
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'),
                                nullable=True)          # NULL for contact-form messages
    sender          = db.Column(db.String(20), nullable=True)   # 'admin' | 'client'
    message         = db.Column(db.Text, nullable=True)
    timestamp       = db.Column(db.DateTime, default=datetime.utcnow)

    # ── contact-form fields ───────────────────────────────────
    sender_name     = db.Column(db.String(100), nullable=True)
    sender_email    = db.Column(db.String(100), nullable=True)
    content         = db.Column(db.Text, nullable=True)

    # ── shared ────────────────────────────────────────────────
    is_read         = db.Column(db.Boolean, default=False, nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Message {self.id} read={self.is_read}>'

    def mark_read(self):
        self.is_read = True
        db.session.commit()


class Payment(db.Model):
    __tablename__ = 'payments'

    id                  = db.Column(db.Integer, primary_key=True)
    phone               = db.Column(db.String(20), nullable=False)
    amount              = db.Column(db.Float, nullable=False)
    transaction_id      = db.Column(db.String(100), unique=True)
    checkout_request_id = db.Column(db.String(100))
    status              = db.Column(db.String(20), default='pending')  # pending|success|failed
    booking_id          = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.id}: {self.amount} KES — {self.status}>'
    

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

    def __repr__(self):
        return f'<Video {self.id}: {self.title}>'