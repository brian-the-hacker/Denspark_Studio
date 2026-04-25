import os
from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from models import db, User
import cloudinary

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

    # Railway injects DATABASE_URL from MySQL service
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise RuntimeError('DATABASE_URL not set. Add MySQL service in Railway')

    # Railway gives mysql:// but SQLAlchemy needs mysql+pymysql://
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

    cloudinary.config(
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
        secure = True,
    )

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access the admin panel.'
    login_manager.login_message_category = 'warning'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # REMOVED db.create_all() - don't run on Railway
    return app

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=5000)