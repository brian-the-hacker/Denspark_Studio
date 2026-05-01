from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import db, User
from extensions import limiter

auth_bp = Blueprint('auth', __name__)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _sanitize_str(value, max_len=254):
    """Strip whitespace and enforce a max length."""
    return (value or '').strip()[:max_len]


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute; 30 per hour")   # brute-force protection
def login():
    # Already logged in — send straight to dashboard
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        email    = _sanitize_str(request.form.get('email', ''))
        password = _sanitize_str(request.form.get('password', ''), max_len=128)
        remember = request.form.get('remember') == 'on'

        # Basic presence check — never reveal which field is wrong
        if not email or not password:
            flash('Please enter your email and password.', 'error')
            return render_template('admin/login.html'), 400

        user = User.query.filter_by(username=email).first()

        # Constant-time comparison via check_password_hash
        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            # Safe redirect — only allow internal pages
            next_page = request.args.get('next', '')
            if next_page and next_page.startswith('/') and not next_page.startswith('//'):
                return redirect(next_page)
            return redirect(url_for('admin.dashboard'))

        # Generic message — don't say "wrong password" or "user not found"
        flash('Invalid credentials. Please try again.', 'error')
        return render_template('admin/login.html'), 401

    return render_template('admin/login.html')


# ── Logout ────────────────────────────────────────────────────────────────────

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('public.index'))

# ── IMPORTANT ─────────────────────────────────────────────────────────────────
# The /create-admin-now route has been permanently removed.
# To create or reset an admin account use the CLI command below — run it
# once locally or via Railway's shell, then never expose it via HTTP again.
#
#   flask shell
#   >>> from models import db, User
#   >>> from werkzeug.security import generate_password_hash
#   >>> u = User(username='admin@denspark.com', password_hash=generate_password_hash('YourStrongPassword!'))
#   >>> db.session.add(u); db.session.commit()
# ─────────────────────────────────────────────────────────────────────────────