import os
from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db, User
import cloudinary

# ── Limiter (shared across blueprints) ───────────────────────────────────────
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "60 per hour"],
    storage_uri="memory://",
)

def create_app():
    app = Flask(__name__)

    # ── SECRET_KEY ────────────────────────────────────────────────────────────
    secret = os.environ.get('SECRET_KEY')
    if not secret or secret == 'dev-secret':
        raise RuntimeError(
            'SECRET_KEY is missing or still set to the default. '
            'Set a strong random value in your .env / Railway Variables.'
        )
    app.config['SECRET_KEY'] = secret

    # ── Database ──────────────────────────────────────────────────────────────
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise RuntimeError('DATABASE_URL not set in environment variables.')

    if db_url.startswith('mysql://'):
        db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }

    # ── Uploads ───────────────────────────────────────────────────────────────
    app.config['UPLOAD_FOLDER'] = '/tmp'
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

    # ── Session cookie hardening ──────────────────────────────────────────────
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE']   = os.environ.get('FLASK_ENV') != 'development'
    app.config['REMEMBER_COOKIE_HTTPONLY'] = True
    app.config['REMEMBER_COOKIE_SECURE']   = os.environ.get('FLASK_ENV') != 'development'

    # ── Cloudinary ────────────────────────────────────────────────────────────
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key    = os.environ.get('CLOUDINARY_API_KEY')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')

    if not all([cloud_name, api_key, api_secret]):
        raise RuntimeError(
            'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, '
            'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment.'
        )

    cloudinary.config(
        cloud_name = cloud_name,
        api_key    = api_key,
        api_secret = api_secret,
        secure     = True,
    )

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    limiter.init_app(app)

    # CORS — locked to your actual domain
    allowed_origin = os.environ.get('ALLOWED_ORIGIN', 'https://denspark.studio')
    CORS(app, resources={
        r"/api/*":        {"origins": allowed_origin},
        r"/admin/api/*":  {"origins": allowed_origin},
    })

    # ── Login manager ─────────────────────────────────────────────────────────
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access the admin panel.'
    login_manager.login_message_category = 'warning'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify(error='Too many requests. Please slow down and try again later.'), 429

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify(error='File is too large. Maximum size is 10 MB.'), 413

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f'Internal error: {e}')
        return jsonify(error='An internal error occurred. Please try again later.'), 500

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # ── Auto-create any missing tables (safe — never drops existing ones) ─────
    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    port  = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)