"""
Run this once to create your admin user:
    python create_admin.py
"""

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

# ── SET YOUR CREDENTIALS HERE ─────────────────────────────────────────────────
USERNAME  = "admin"
EMAIL     = "brianshiru563@gmail.com"
PASSWORD  = "DensparkAdmin2026!"   # change this to something strong
# ─────────────────────────────────────────────────────────────────────────────

app = create_app()

with app.app_context():
    existing = User.query.filter_by(username=USERNAME).first()
    if existing:
        print(f"[!] User '{USERNAME}' already exists. Updating password...")
        existing.password_hash = generate_password_hash(PASSWORD)
        db.session.commit()
        print(f"[✓] Password updated for '{USERNAME}'")
    else:
        user = User(
            username      = USERNAME,
            email         = EMAIL,
            password_hash = generate_password_hash(PASSWORD),
        )
        db.session.add(user)
        db.session.commit()
        print(f"[✓] Admin user created!")
        print(f"    Username : {USERNAME}")
        print(f"    Email    : {EMAIL}")
        print(f"    Password : {PASSWORD}")
        print(f"\n    Login at : http://localhost:5000/auth/login")
        print(f"\n    [!] Delete this script after use.")