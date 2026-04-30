"""
utils/email.py — Email notifications for Denspark Studio
Uses Gmail SMTP (free). Set GMAIL_APP_PASSWORD and ADMIN_EMAIL in your env.

Sending is done in a background thread so a blocked/slow SMTP connection
never times out the gunicorn worker handling the HTTP request.
"""

import smtplib
import os
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app


# ── Internal sender (runs in background thread) ───────────────────────────────

def _send(subject: str, plain: str, html: str, app) -> None:
    """
    Build and send an email via Gmail SMTP SSL.
    Runs in a background thread — never blocks the request.
    Timeout of 10s prevents threads hanging forever.
    """
    gmail_user     = os.environ.get('GMAIL_USER') or os.environ.get('ADMIN_EMAIL')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD', '').replace(' ', '')
    admin_email    = os.environ.get('ADMIN_EMAIL', 'brianshiru563@gmail.com')

    if not gmail_user or not gmail_password:
        with app.app_context():
            app.logger.warning('Gmail credentials not set — skipping email.')
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = gmail_user
    msg['To']      = admin_email
    msg.attach(MIMEText(plain, 'plain'))
    msg.attach(MIMEText(html,  'html'))

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, admin_email, msg.as_string())
        with app.app_context():
            app.logger.info(f'Email sent: {subject}')
    except Exception as e:
        with app.app_context():
            app.logger.error(f'Email send failed: {e}')


def _send_async(subject: str, plain: str, html: str) -> None:
    """Fire-and-forget: spawn a daemon thread so the request returns instantly."""
    app = current_app._get_current_object()
    t = threading.Thread(target=_send, args=(subject, plain, html, app), daemon=True)
    t.start()


# ── Public API ────────────────────────────────────────────────────────────────

def send_booking_notification(booking_data: dict) -> bool:
    """
    Send admin email when a new booking request is submitted.
    Returns True immediately — sending happens in background.
    """
    try:
        name          = booking_data.get('name', 'Unknown')
        email         = booking_data.get('email', 'N/A')
        phone         = booking_data.get('phone', 'N/A')
        service       = booking_data.get('service', 'N/A')
        date          = booking_data.get('date', 'Not specified')
        message       = booking_data.get('message', 'No message provided')
        service_label = service.replace('-', ' ').title()

        wa_number = phone.replace('+', '').replace(' ', '').replace('-', '')
        if wa_number.startswith('0'):
            wa_number = '254' + wa_number[1:]
        wa_link = f"https://wa.me/{wa_number}"

        subject = f"📸 New Booking: {name} — {service_label}"

        plain = f"""
New Booking Request — Denspark Studio

Name:     {name}
Email:    {email}
Phone:    {phone}
Service:  {service_label}
Date:     {date}

Message:
{message}

---
WhatsApp: {wa_link}
Email:    {email}
        """.strip()

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8">
          <style>
            body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background: #1a56db; padding: 24px 32px; }}
            .header h1 {{ color: #fff; margin: 0; font-size: 20px; font-weight: 600; }}
            .header p {{ color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }}
            .body {{ padding: 32px; }}
            .badge {{ display: inline-block; background: #eef3ff; color: #1a56db; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }}
            .field {{ margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; }}
            .field-label {{ font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 4px; }}
            .field-value {{ font-size: 15px; color: #111; font-weight: 500; }}
            .message-box {{ background: #f8f8f6; border-left: 3px solid #1a56db; padding: 16px; border-radius: 4px; font-size: 14px; color: #444; line-height: 1.6; }}
            .actions {{ margin-top: 28px; }}
            .btn {{ display: inline-block; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; margin-right: 10px; }}
            .btn-whatsapp {{ background: #25D366; color: #fff; }}
            .btn-email {{ background: #1a56db; color: #fff; }}
            .footer {{ background: #f8f8f6; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 New Booking Request</h1>
              <p>Denspark Studio — someone wants to book a session</p>
            </div>
            <div class="body">
              <span class="badge">New Request</span>
              <div class="field"><div class="field-label">Client Name</div><div class="field-value">{name}</div></div>
              <div class="field"><div class="field-label">Email</div><div class="field-value">{email}</div></div>
              <div class="field"><div class="field-label">Phone</div><div class="field-value">{phone}</div></div>
              <div class="field"><div class="field-label">Service</div><div class="field-value">{service_label}</div></div>
              <div class="field"><div class="field-label">Preferred Date</div><div class="field-value">{date}</div></div>
              <div class="field"><div class="field-label">Message</div><div class="message-box">{message}</div></div>
              <div class="actions">
                <a href="{wa_link}" class="btn btn-whatsapp">💬 WhatsApp {name.split()[0]}</a>
                <a href="mailto:{email}" class="btn btn-email">✉️ Email {name.split()[0]}</a>
              </div>
            </div>
            <div class="footer">Denspark Studio Admin · Automated notification</div>
          </div>
        </body>
        </html>
        """

        _send_async(subject, plain, html)
        return True

    except Exception as e:
        current_app.logger.error(f'send_booking_notification error: {e}')
        return False


def send_contact_notification(contact_data: dict) -> bool:
    """
    Send admin email when a contact form message is submitted.
    Returns True immediately — sending happens in background.
    """
    try:
        name    = contact_data.get('name', 'Unknown')
        email   = contact_data.get('email', 'N/A')
        phone   = contact_data.get('phone', 'N/A')
        service = contact_data.get('service', 'General Inquiry')
        message = contact_data.get('message', '')

        wa_number = phone.replace('+', '').replace(' ', '').replace('-', '')
        if wa_number.startswith('0'):
            wa_number = '254' + wa_number[1:]
        wa_link = f"https://wa.me/{wa_number}"

        subject = f"💬 New Message from {name}"

        plain = f"""
New Contact Message — Denspark Studio

Name:    {name}
Email:   {email}
Phone:   {phone}
Service: {service}

Message:
{message}

---
WhatsApp: {wa_link}
Email:    {email}
        """.strip()

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8">
          <style>
            body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background: #111827; padding: 24px 32px; }}
            .header h1 {{ color: #fff; margin: 0; font-size: 20px; }}
            .header p {{ color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px; }}
            .body {{ padding: 32px; }}
            .field {{ margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; }}
            .field-label {{ font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 4px; }}
            .field-value {{ font-size: 15px; color: #111; font-weight: 500; }}
            .message-box {{ background: #f8f8f6; border-left: 3px solid #111; padding: 16px; border-radius: 4px; font-size: 14px; color: #444; line-height: 1.6; }}
            .actions {{ margin-top: 28px; }}
            .btn {{ display: inline-block; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; margin-right: 10px; }}
            .btn-whatsapp {{ background: #25D366; color: #fff; }}
            .btn-email {{ background: #1a56db; color: #fff; }}
            .footer {{ background: #f8f8f6; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Contact Message</h1>
              <p>Denspark Studio — someone sent you a message</p>
            </div>
            <div class="body">
              <div class="field"><div class="field-label">Name</div><div class="field-value">{name}</div></div>
              <div class="field"><div class="field-label">Email</div><div class="field-value">{email}</div></div>
              <div class="field"><div class="field-label">Phone</div><div class="field-value">{phone}</div></div>
              <div class="field"><div class="field-label">Service Interest</div><div class="field-value">{service}</div></div>
              <div class="field"><div class="field-label">Message</div><div class="message-box">{message}</div></div>
              <div class="actions">
                <a href="{wa_link}" class="btn btn-whatsapp">💬 WhatsApp {name.split()[0]}</a>
                <a href="mailto:{email}" class="btn btn-email">✉️ Email {name.split()[0]}</a>
              </div>
            </div>
            <div class="footer">Denspark Studio Admin · Automated notification</div>
          </div>
        </body>
        </html>
        """

        _send_async(subject, plain, html)
        return True

    except Exception as e:
        current_app.logger.error(f'send_contact_notification error: {e}')
        return False