from flask import Blueprint, request, jsonify
from models import db, Conversation, Message

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    conv_id = data.get('conversation_id')

    # Create new conversation if none exists
    if not conv_id:
        conv = Conversation(
            client_name=data.get('client_name', 'Guest'),
            client_contact=data.get('client_contact', '')
        )
        db.session.add(conv)
        db.session.flush()
        conv_id = conv.id
    else:
        conv = Conversation.query.get_or_404(conv_id)

    msg = Message(
        conversation_id=conv_id,
        sender=data['sender'],
        message=data['message']
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'success': True, 'conversation_id': conv_id, 'message_id': msg.id})

@chat_bp.route('/messages')
def get_messages():
    conv_id = request.args.get('conversation_id', type=int)
    since_id = request.args.get('since', 0, type=int)

    if not conv_id:
        return jsonify({'messages': []})

    msgs = Message.query.filter(
        Message.conversation_id == conv_id,
        Message.id > since_id
    ).order_by(Message.timestamp.asc()).all()

    return jsonify({'messages': [{
        'id': m.id,
        'sender': m.sender,
        'message': m.message,
        'timestamp': m.timestamp.isoformat()
    } for m in msgs]})

@chat_bp.route('/conversations')
def get_conversations():
    convs = Conversation.query.order_by(Conversation.created_at.desc()).all()
    return jsonify([{
        'id': c.id,
        'client_name': c.client_name,
        'client_contact': c.client_contact,
        'last_message': c.messages[-1].message if c.messages else ''
    } for c in convs])