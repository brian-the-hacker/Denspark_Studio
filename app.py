from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
import cloudinary

from models import User
from extensions import db, login_manager, csrf, limiter


def create_app():
    app = Flask(__name__)

    # ── SECURITY ─────────────────────────────
    secret = os.environ.get("SECRET_KEY")
    if not secret:
        raise RuntimeError("SECRET_KEY missing")

    app.config["SECRET_KEY"] = secret

    # ── DATABASE ─────────────────────────────
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL missing")

    if db_url.startswith("mysql://"):
        db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # ── FILE UPLOADS ─────────────────────────
    app.config["UPLOAD_FOLDER"] = "/tmp"
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

    # ── COOKIE SECURITY ──────────────────────
    is_dev = os.environ.get("FLASK_ENV") == "development"

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=not is_dev,
        REMEMBER_COOKIE_HTTPONLY=True,
        REMEMBER_COOKIE_SECURE=not is_dev,
    )

    # ── CLOUDINARY ───────────────────────────
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
        secure=True,
    )

    # ── INIT EXTENSIONS ──────────────────────
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
    Migrate(app, db)

    # ── LOGIN MANAGER ────────────────────────
    login_manager.login_view = "auth.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── CORS ─────────────────────────────────
    allowed_origin = os.environ.get("ALLOWED_ORIGIN", "https://denspark.studio")

    CORS(app, resources={
        r"/api/*": {"origins": allowed_origin},
        r"/admin/api/*": {"origins": allowed_origin},
    })

    # ── ERROR HANDLERS ───────────────────────
    @app.errorhandler(429)
    def rate_limit(e):
        return jsonify(error="Too many requests"), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(str(e))
        return jsonify(error="Server error"), 500

    # ── BLUEPRINTS (IMPORT INSIDE FUNCTION = FIX CIRCULAR IMPORT) ──
    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)