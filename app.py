from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from models import db, User
import cloudinary

# ── App factory ──────────────────────────────────────────────────────────────

def create_app():
    app = Flask(__name__)

    # ── Config ───────────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this-in-production')

    # Database — SQLite locally, PostgreSQL in production via DATABASE_URL env var
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///denspark.db')
    # Hostpinnacle sometimes gives postgres:// — SQLAlchemy needs postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI']        = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Uploads (local fallback when Cloudinary isn't set)
    app.config['UPLOAD_FOLDER']     = os.path.join(app.root_path, 'static', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024   # 10 MB max upload
    app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Cloudinary ────────────────────────────────────────────────────────────
    # Set these three env vars — everything else is automatic
    # CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
    cloudinary.config(
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key    = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
        secure     = True,   # always use https URLs
    )

    # ── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})   # only API routes are CORS-open

    # ── Flask-Login ───────────────────────────────────────────────────────────
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view     = 'auth.login'
    login_manager.login_message  = 'Please log in to access the admin panel.'
    login_manager.login_message_category = 'warning'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.public import public_bp
    from routes.admin  import admin_bp
    from routes.auth   import auth_bp

    app.register_blueprint(public_bp)              # / and /api/*
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp,  url_prefix='/auth')

    # ── Create tables if they don't exist ────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


# ── Entry point ───────────────────────────────────────────────────────────────
app = create_app()

if __name__ == '__main__':
    # Debug mode only in local dev — never on production
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=5000)