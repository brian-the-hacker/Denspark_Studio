from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db, User
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate = Migrate(app, db)
    CORS(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Register blueprints
    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp
    from routes.chat import chat_bp
    from routes.payment import payment_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')

    with app.app_context():
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)