from dotenv import load_dotenv
load_dotenv()

import os
import click
from datetime import datetime
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
        return db.session.get(User, int(user_id))  # SA 2.x compatible

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

    # ── BLUEPRINTS ────────────────────────────
    from routes.public import public_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # ── CREATE TABLES ─────────────────────────
    # Safe to run on every deploy — skips tables that already exist.
    # Ensures Railway's empty DB gets all tables created automatically.
    with app.app_context():
        db.create_all()

    return app


app = create_app()


# ── CLI: create-admin ─────────────────────────────────────────────────────────
@app.cli.command("create-admin")
@click.option("--username", prompt="Username")
@click.option("--email",    prompt="Email")
@click.option(
    "--password",
    prompt="Password",
    hide_input=True,
    confirmation_prompt=True,
)
def create_admin(username, email, password):
    """Create a new admin user. Run: flask create-admin"""
    from werkzeug.security import generate_password_hash

    if len(password) < 10:
        click.echo("[!] Password must be at least 10 characters.")
        return

    if User.query.filter_by(username=username).first():
        click.echo(f"[!] Username '{username}' already exists.")
        return

    if User.query.filter_by(email=email).first():
        click.echo(f"[!] Email '{email}' is already registered.")
        return

    user = User(
        username      = username,
        email         = email,
        password_hash = generate_password_hash(password),
        is_admin      = True,
        role          = "admin",
    )
    db.session.add(user)
    db.session.commit()

    click.echo(f"[✓] Admin '{username}' created successfully.")
    click.echo(f"    Login at: /auth/login")


# ── CLI: change-password ──────────────────────────────────────────────────────
@app.cli.command("change-password")
@click.option("--username", prompt="Username")
@click.option(
    "--password",
    prompt="New password",
    hide_input=True,
    confirmation_prompt=True,
)
def change_password(username, password):
    """Change an admin user's password. Run: flask change-password"""
    from werkzeug.security import generate_password_hash

    if len(password) < 10:
        click.echo("[!] Password must be at least 10 characters.")
        return

    user = User.query.filter_by(username=username).first()
    if not user:
        click.echo(f"[!] User '{username}' not found.")
        return

    user.password_hash = generate_password_hash(password)
    db.session.commit()
    click.echo(f"[✓] Password updated for '{username}'.")


# ── CLI: list-admins ──────────────────────────────────────────────────────────
@app.cli.command("list-admins")
def list_admins():
    """List all admin users. Run: flask list-admins"""
    users = User.query.all()
    if not users:
        click.echo("No users found.")
        return
    click.echo(f"\n{'ID':<6} {'Username':<20} {'Email':<30} {'Role':<10} {'Last Login'}")
    click.echo("-" * 80)
    for u in users:
        last = u.last_login.strftime("%Y-%m-%d %H:%M") if u.last_login else "Never"
        click.echo(f"{u.id:<6} {u.username:<20} {u.email:<30} {u.role:<10} {last}")
    click.echo()



if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)