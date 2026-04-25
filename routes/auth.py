from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import check_password_hash, generate_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'
        
        # We store username as email in DB
        user = User.query.filter_by(username=email).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            return redirect(url_for('admin.dashboard'))
        
        flash('Invalid email or password', 'error')
    
    return render_template('admin/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('public.index'))

# TEMP ROUTE - DELETE AFTER USE
@auth_bp.route('/create-admin-now')
def create_admin_now():
    try:
        # Delete all existing users to start clean
        User.query.delete()
        
        # Create admin - only using columns that exist: username, password_hash
        admin = User(
            username='admin@denspark.com',
            password_hash=generate_password_hash('Admin123')
        )
        db.session.add(admin)
        db.session.commit()
        return """
        <h2>SUCCESS: Admin created</h2>
        <p><strong>Email:</strong> admin@denspark.com</p>
        <p><strong>Password:</strong> Admin123</p>
        <p style="color:red;"><strong>NOW DELETE THIS ROUTE FROM auth.py AND PUSH AGAIN</strong></p>
        <a href="/auth/login">Go to Login</a>
        """
    except Exception as e:
        return f"<h2>ERROR:</h2><p>{str(e)}</p>"