from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import db, User
from extensions import limiter

auth_bp = Blueprint('auth', __name__)


def _sanitize_str(value, max_len=254):
    """Strip whitespace and enforce a max length."""
    return (value or '').strip()[:max_len]


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute; 30 per hour")
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        identifier = _sanitize_str(request.form.get('email', ''))
        password   = _sanitize_str(request.form.get('password', ''), max_len=128)
        remember   = request.form.get('remember') == 'on'

        if not identifier or not password:
            flash('Please enter your username/email and password.', 'error')
            return render_template('admin/login.html'), 400

        # Accept either username OR email
        user = (
            User.query.filter_by(username=identifier).first() or
            User.query.filter_by(email=identifier).first()
        )

        if user and check_password_hash(user.password_hash, password):
            # ── Guard: only admins can access the panel ──────────────────────
            if not user.is_admin:
                flash('Access denied. Admin privileges required.', 'error')
                return render_template('admin/login.html'), 403

            # Track last login
            user.last_login = datetime.utcnow()
            db.session.commit()

            login_user(user, remember=remember)

            next_page = request.args.get('next', '')
            if next_page and next_page.startswith('/') and not next_page.startswith('//'):
                return redirect(next_page)
            return redirect(url_for('admin.dashboard'))

        flash('Invalid credentials. Please try again.', 'error')
        return render_template('admin/login.html'), 401

    return render_template('admin/login.html')


# ── Logout ────────────────────────────────────────────────────────────────────

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))