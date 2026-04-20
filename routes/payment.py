from flask import Blueprint, request, jsonify, current_app
from models import db, Payment
import requests
import base64
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

def get_mpesa_token():
    auth = base64.b64encode(
        f"{current_app.config['MPESA_CONSUMER_KEY']}:{current_app.config['MPESA_CONSUMER_SECRET']}".encode()
    ).decode()

    res = requests.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        headers={'Authorization': f'Basic {auth}'}
    )
    return res.json()['access_token']

@payment_bp.route('/stkpush', methods=['POST'])
def stk_push():
    data = request.get_json()
    phone = data['phone'] # Format: 254712345678
    amount = data['amount']

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(
        f"{current_app.config['MPESA_SHORTCODE']}{current_app.config['MPESA_PASSKEY']}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": current_app.config['MPESA_SHORTCODE'],
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": current_app.config['MPESA_SHORTCODE'],
        "PhoneNumber": phone,
        "CallBackURL": current_app.config['MPESA_CALLBACK_URL'],
        "AccountReference": "DenSpark",
        "TransactionDesc": "Photography Booking"
    }

    token = get_mpesa_token()
    res = requests.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    result = res.json()
    if result.get('ResponseCode') == '0':
        payment = Payment(
            phone=phone,
            amount=amount,
            checkout_request_id=result['CheckoutRequestID'],
            status='pending'
        )
        db.session.add(payment)
        db.session.commit()

    return jsonify(result)

@payment_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    result = data['Body']['stkCallback']
    checkout_id = result['CheckoutRequestID']

    payment = Payment.query.filter_by(checkout_request_id=checkout_id).first()
    if not payment:
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'})

    if result['ResultCode'] == 0:
        payment.status = 'success'
        metadata = result['CallbackMetadata']['Item']
        for item in metadata:
            if item['Name'] == 'MpesaReceiptNumber':
                payment.transaction_id = item['Value']
    else:
        payment.status = 'failed'

    db.session.commit()
    return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'})