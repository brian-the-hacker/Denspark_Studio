import os
from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from models import db, User
import cloudinary

def create_app():
    app = Flask(__name__)

    # ── Config ───────────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback-key-for-local-only')

    # Railway MySQL - no SQLite fallback allowed
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise RuntimeError('DATABASE_URL not set. Link MySQL service in Railway Variables')

    # Print to logs so you can see what URL Railway is using
    print(f"Using DATABASE_URL: {db_url.replace(db_url.split('@')[0], 'mysql://***:***')}")

    # Convert mysql:// to mysql+pymysql:// for SQLAlchemy
    if db_url.startswith('mysql://'):
        db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }

    app.config['UPLOAD_FOLDER'] = '/tmp'
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

    # ── Cloudinary ────────────────────────────────────────────────────────────
    cloudinary.config(
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
        secure = True,
    )

    # ── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Flask-Login ───────────────────────────────────────────────────────────
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access the admin panel.'
    login_manager.login_message_category = 'warning'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # DO NOT RUN db.create_all() HERE - Railway will crash
    return app

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=5000)