/**
 * Denspark Studio - Chat/Messaging JavaScript
 * Handles real-time messaging functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    initChat();
});

function initChat() {
    const conversationsList = document.getElementById('conversationsList');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const conversationSearch = document.getElementById('conversationSearch');
    
    if (!conversationsList) return;
    
    // Conversation selection
    conversationsList.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            conversationsList.querySelectorAll('.conversation-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            item.classList.remove('unread');
            
            // Remove unread badge
            const badge = item.querySelector('.unread-badge');
            if (badge) badge.remove();
            
            // Load conversation (in real app, fetch from server)
            loadConversation(item.dataset.id);
        });
    });
    
    // Send message
    sendMessageBtn?.addEventListener('click', sendMessage);
    
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Search conversations
    conversationSearch?.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        conversationsList.querySelectorAll('.conversation-item').forEach(item => {
            const name = item.querySelector('.conversation-name').textContent.toLowerCase();
            const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
            
            if (name.includes(query) || preview.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }, 300));
    
    // Scroll to bottom of messages
    scrollToBottom();
}

function loadConversation(conversationId) {
    const chatMessages = document.getElementById('chatMessages');
    const chatName = document.querySelector('.chat-name');
    const chatAvatar = document.querySelector('.chat-avatar');
    const profileAvatar = document.querySelector('.profile-avatar');
    const profileName = document.querySelector('.user-profile h3');
    
    // Get conversation data
    const conversationItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
    const name = conversationItem?.querySelector('.conversation-name')?.textContent || 'User';
    const initial = name.charAt(0);
    
    // Update chat header
    if (chatName) chatName.textContent = name;
    if (chatAvatar) chatAvatar.textContent = initial;
    if (profileAvatar) profileAvatar.textContent = initial;
    if (profileName) profileName.textContent = name;
    
    // In a real app, fetch messages from server
    // For demo, just scroll to bottom
    scrollToBottom();
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message sent';
    messageEl.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageEl);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    scrollToBottom();
    
    // In a real app, send to server via WebSocket or API
    // Simulate response after delay
    setTimeout(() => {
        simulateResponse();
    }, 1500);
}

function simulateResponse() {
    const chatMessages = document.getElementById('chatMessages');
    
    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'message received typing';
    typingEl.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingEl);
    scrollToBottom();
    
    // Replace with actual message
    setTimeout(() => {
        typingEl.remove();
        
        const responses = [
            "Thank you for your message! I'll get back to you shortly.",
            "That sounds great! Let me check our availability.",
            "I appreciate your interest in our services!",
            "Perfect! I'll send you the details via email.",
            "Thanks for reaching out to Denspark Studio!"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message received';
        messageEl.innerHTML = `
            <div class="message-content">
                <p>${randomResponse}</p>
                <span class="message-time">${formatTime(new Date())}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }, 1000);
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add typing indicator styles
const chatStyles = document.createElement('style');
chatStyles.textContent = `
    .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 8px 0;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #737373;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
        30% { transform: translateY(-6px); opacity: 1; }
    }
`;
document.head.appendChild(chatStyles);
