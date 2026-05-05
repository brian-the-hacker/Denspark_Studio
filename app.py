# =============================================================================
#  DENSPARK STUDIO — Flask Application Entry Point
#  densparkstudio.com
# =============================================================================

import os

# ── Load .env ONLY in local development ──────────────────────────────────────
# On HostPinnacle, environment variables are set directly in cPanel
# Setup Python App → Environment Variables — no .env file needed on server
if os.environ.get("FLASK_ENV") == "development":
    from dotenv import load_dotenv
    load_dotenv()

import click
import requests
from datetime import datetime
from flask import Flask, jsonify, render_template_string, Response
from flask_cors import CORS
from flask_migrate import Migrate
import cloudinary

from models import User
from extensions import db, login_manager, csrf, limiter
from config import Config


# =============================================================================
#  SEO CONSTANTS
# =============================================================================

SITE_URL     = "https://densparkstudio.com"
INDEXNOW_KEY = os.environ.get("INDEXNOW_KEY", "")


# =============================================================================
#  APPLICATION FACTORY
# =============================================================================

def create_app():
    app = Flask(__name__)

    # ── LOAD CONFIG ───────────────────────────────────────────────────────────
    # All settings (DB, security, uploads, cloudinary etc.) come from config.py
    app.config.from_object(Config)

    # ── CLOUDINARY ────────────────────────────────────────────────────────────
    cloudinary.config(
        cloud_name = app.config.get("CLOUDINARY_CLOUD_NAME"),
        api_key    = app.config.get("CLOUDINARY_API_KEY"),
        api_secret = app.config.get("CLOUDINARY_API_SECRET"),
        secure     = True,
    )

    # ── EXTENSIONS ────────────────────────────────────────────────────────────
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
    Migrate(app, db)

    # ── LOGIN MANAGER ─────────────────────────────────────────────────────────
    login_manager.login_view = "auth.login"

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origin = app.config.get("ALLOWED_ORIGIN", "https://densparkstudio.com")

    CORS(app, resources={
        r"/api/*":       {"origins": allowed_origin},
        r"/admin/api/*": {"origins": allowed_origin},
    })

    # ── ERROR HANDLERS ────────────────────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error="Bad request"), 400

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify(error="Forbidden"), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="Not found"), 404

    @app.errorhandler(429)
    def rate_limit(e):
        return jsonify(error="Too many requests — please slow down"), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(str(e))
        return jsonify(error="Internal server error"), 500

    # ── BLUEPRINTS ────────────────────────────────────────────────────────────
    from routes.public import public_bp
    from routes.admin  import admin_bp
    from routes.auth   import auth_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(auth_bp,  url_prefix="/auth")

    # ── DATABASE TABLES ───────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


# =============================================================================
#  APP INSTANCE
# =============================================================================

app = create_app()


# =============================================================================
#  SEO — SITEMAP
# =============================================================================

@app.route('/sitemap.xml')
def sitemap():
    pages = [
        {"loc": f"{SITE_URL}/",                 "priority": "1.0"},
        {"loc": f"{SITE_URL}/about",            "priority": "0.8"},
        {"loc": f"{SITE_URL}/portfolio",        "priority": "0.8"},
        {"loc": f"{SITE_URL}/services",         "priority": "0.8"},
        {"loc": f"{SITE_URL}/packages",         "priority": "0.8"},
        {"loc": f"{SITE_URL}/video-production", "priority": "0.8"},
        {"loc": f"{SITE_URL}/contact",          "priority": "0.7"},
    ]
    xml = render_template_string(
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        '{% for page in pages %}'
        '<url>'
        '<loc>{{ page.loc }}</loc>'
        '<lastmod>{{ today }}</lastmod>'
        '<priority>{{ page.priority }}</priority>'
        '</url>'
        '{% endfor %}'
        '</urlset>',
        pages=pages,
        today=datetime.today().strftime('%Y-%m-%d')
    )
    return Response(xml, mimetype='application/xml')


# =============================================================================
#  SEO — ROBOTS.TXT
# =============================================================================

@app.route('/robots.txt')
def robots():
    content = f"""User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/

Sitemap: {SITE_URL}/sitemap.xml"""
    return Response(content, mimetype='text/plain')


# =============================================================================
#  SEO — INDEXNOW KEY FILE
# =============================================================================

@app.route('/<key>.txt')
def indexnow_key_file(key):
    if INDEXNOW_KEY and key == INDEXNOW_KEY:
        return Response(INDEXNOW_KEY, mimetype='text/plain')
    return "Not found", 404


# =============================================================================
#  SEO — INDEXNOW PING HELPER
# =============================================================================

def ping_indexnow(url):
    if not INDEXNOW_KEY:
        return
    try:
        response = requests.get(
            "https://api.indexnow.org/indexnow",
            params={
                "url":         url,
                "key":         INDEXNOW_KEY,
                "keyLocation": f"{SITE_URL}/{INDEXNOW_KEY}.txt",
            },
            timeout=5
        )
        app.logger.info(f"IndexNow ping to {url} returned {response.status_code}")
    except Exception as e:
        app.logger.warning(f"IndexNow ping failed for {url}: {e}")


# =============================================================================
#  SEO — WEB MANIFEST
# =============================================================================

@app.route('/static/site.webmanifest')
def webmanifest():
    manifest = """{
  "name": "Denspark Studio",
  "short_name": "Denspark",
  "description": "Photography & Creative Media — Machakos, Kenya",
  "icons": [
    { "src": "/static/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/static/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}"""
    return Response(manifest, mimetype='application/manifest+json')


# =============================================================================
#  CLI COMMANDS
#  flask create-admin
#  flask change-password
#  flask list-admins
# =============================================================================

@app.cli.command("create-admin")
@click.option("--username", prompt="Username")
@click.option("--email",    prompt="Email")
@click.option("--password", prompt="Password", hide_input=True, confirmation_prompt=True)
def create_admin(username, email, password):
    """Create a new admin user."""
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


@app.cli.command("change-password")
@click.option("--username", prompt="Username")
@click.option("--password", prompt="New password", hide_input=True, confirmation_prompt=True)
def change_password(username, password):
    """Change an admin user's password."""
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


@app.cli.command("list-admins")
def list_admins():
    """List all admin users."""
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


# =============================================================================
#  ENTRY POINT — local development only
#  On HostPinnacle, Passenger runs the app via passenger_wsgi.py
# =============================================================================

if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)