import os
from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from models import db, User
import cloudinary
from routes.admin import init_cloudinary  # ADD THIS IMPORT

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')

    # Get Railway DATABASE_URL
    db_url = os.environ.get('DATABASE_URL')
    print(f"[DEBUG] Raw DATABASE_URL from env: {db_url}") # Add this line

    if not db_url:
        raise RuntimeError('DATABASE_URL not set in Railway Variables')

    # CRITICAL: Convert mysql:// to mysql+pymysql:// or you get MySQLdb error
    if db_url.startswith('mysql://'):
        db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)
        print("[DEBUG] Converted to PyMySQL driver")

    print(f"[DEBUG] Final DB URI: {db_url}") # Shows full URL after conversion

    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }

    app.config['UPLOAD_FOLDER'] = '/tmp'
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

    cloudinary.config(
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
        secure = True,
    )
    init_cloudinary()  # ADD THIS LINE

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

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)