"""
utils/email.py — Email notifications for Denspark Studio
Uses Resend (https://resend.com) — works on Railway (no SMTP ports needed).

Required env vars:
    RESEND_API_KEY   — from resend.com dashboard
    ADMIN_EMAIL      — where notifications are delivered

IMPORTANT: Resend's free tier requires you to verify a domain OR
use their test address as the FROM address until your domain is verified.
Until you verify denspark.com (or whatever your domain is), set:
    RESEND_FROM = "onboarding@resend.dev"
Once your domain is verified, set:
    RESEND_FROM = "notifications@yourdomain.com"
"""

import os
import threading
import resend
from flask import current_app


def _get_config():
    return {
        'api_key':    os.environ.get('RESEND_API_KEY', ''),
        'admin_email': os.environ.get('ADMIN_EMAIL', 'brianmasila24@gmail.com'),
        # Use onboarding@resend.dev until your domain is verified on Resend
        'from_email': os.environ.get('RESEND_FROM', 'onboarding@resend.dev'),
    }


def _send(subject: str, plain: str, html: str, app) -> None:
    """Send email via Resend HTTP API. Runs in a background thread."""
    cfg = _get_config()

    if not cfg['api_key']:
        with app.app_context():
            app.logger.warning('RESEND_API_KEY not set — skipping email.')
        return

    resend.api_key = cfg['api_key']

    try:
        resend.Emails.send({
            'from':    cfg['from_email'],
            'to':      [cfg['admin_email']],
            'subject': subject,
            'html':    html,
            'text':    plain,
        })
        with app.app_context():
            app.logger.info(f'Email sent via Resend: {subject}')
    except Exception as e:
        with app.app_context():
            app.logger.error(f'Resend email failed: {e}')


def _send_async(subject: str, plain: str, html: str) -> None:
    """Fire-and-forget: spawn a daemon thread so the request returns instantly."""
    app = current_app._get_current_object()
    t = threading.Thread(target=_send, args=(subject, plain, html, app), daemon=True)
    t.start()


# ── Public API ────────────────────────────────────────────────────────────────

def send_booking_notification(booking_data: dict) -> bool:
    """Send admin email when a new booking is submitted."""
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

        subject = f"New Booking: {name} — {service_label}"

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
      <h1>New Booking Request</h1>
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
        <a href="{wa_link}" class="btn btn-whatsapp">WhatsApp {name.split()[0]}</a>
        <a href="mailto:{email}" class="btn btn-email">Email {name.split()[0]}</a>
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
    """Send admin email when a contact form message is submitted."""
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

        subject = f"New Message from {name}"

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
      <h1>New Contact Message</h1>
      <p>Denspark Studio — someone sent you a message</p>
    </div>
    <div class="body">
      <div class="field"><div class="field-label">Name</div><div class="field-value">{name}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">{email}</div></div>
      <div class="field"><div class="field-label">Phone</div><div class="field-value">{phone}</div></div>
      <div class="field"><div class="field-label">Service Interest</div><div class="field-value">{service}</div></div>
      <div class="field"><div class="field-label">Message</div><div class="message-box">{message}</div></div>
      <div class="actions">
        <a href="{wa_link}" class="btn btn-whatsapp">WhatsApp {name.split()[0]}</a>
        <a href="mailto:{email}" class="btn btn-email">Email {name.split()[0]}</a>
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