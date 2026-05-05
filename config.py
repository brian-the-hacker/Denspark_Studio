import os

# ── DO NOT use load_dotenv() in production ────────────────────────────────────
# On HostPinnacle, set environment variables directly in cPanel
# Setup Python App → Environment Variables section
# Only load .env in local development
if os.environ.get('FLASK_ENV') == 'development':
    from dotenv import load_dotenv
    load_dotenv()


class Config:
    # ── Core Security ─────────────────────────────────────────────
    SECRET_KEY = os.environ['SECRET_KEY']

    # ── Database (PostgreSQL for HostPinnacle) ────────────────────
    _db_url = os.environ['DATABASE_URL']

    # Fix URL prefix — both formats accepted
    if _db_url.startswith('mysql://'):
        _db_url = _db_url.replace('mysql://', 'mysql+pymysql://', 1)
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping':  True,
        'pool_recycle':   1800,  # 30 min — better for shared hosting
        'pool_size':      5,     # shared hosting has connection limits
        'max_overflow':   2,     # keep low on shared hosting
        'pool_timeout':   30,
    }

    # ── Uploads ───────────────────────────────────────────────────
    UPLOAD_FOLDER         = '/tmp'
    MAX_CONTENT_LENGTH    = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS    = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

    # ── Sessions / Security ───────────────────────────────────────
    SESSION_COOKIE_HTTPONLY  = True
    SESSION_COOKIE_SAMESITE  = 'Lax'
    SESSION_COOKIE_SECURE    = os.environ.get('FLASK_ENV') != 'development'
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE   = os.environ.get('FLASK_ENV') != 'development'
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8  # 8 hours

    # ── Rate Limiting ─────────────────────────────────────────────
    # memory:// is fine for single-process shared hosting
    REDIS_URL = os.environ.get('REDIS_URL', 'memory://')

    # ── Cloudinary ────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY    = os.environ.get('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

    # ── Email (Resend) ────────────────────────────────────────────
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
    ADMIN_EMAIL    = os.environ.get('ADMIN_EMAIL', 'brianmasila24@gmail.com')
    RESEND_FROM    = os.environ.get('RESEND_FROM', 'onboarding@resend.dev')

    # ── SEO ───────────────────────────────────────────────────────
    INDEXNOW_KEY   = os.environ.get('INDEXNOW_KEY', '')
    ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://densparkstudio.com')

    # ── M-Pesa ────────────────────────────────────────────────────
    MPESA_CONSUMER_KEY    = os.environ.get('MPESA_CONSUMER_KEY')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET')
    MPESA_SHORTCODE       = os.environ.get('MPESA_SHORTCODE')
    MPESA_PASSKEY         = os.environ.get('MPESA_PASSKEY')
    MPESA_CALLBACK_URL    = os.environ.get('MPESA_CALLBACK_URL')