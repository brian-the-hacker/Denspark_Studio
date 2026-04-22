// ========================================
// ADMIN MESSAGES DASHBOARD - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initializeChat();
});

// ========================================
// INITIALIZATION
// ========================================

function initializeChat() {
    setupEventListeners();
    autoScrollMessages();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    const sendBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    const conversationItems = document.querySelectorAll('.conversation-item');
    const searchInput = document.getElementById('conversationSearch');

    // Send message on button click
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Send message on Enter key
    if (messageInput) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }

    // Conversation selection
    conversationItems.forEach((item) => {
        item.addEventListener('click', function () {
            selectConversation(this);
        });
    });

    // Search conversations
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchConversations(this.value);
        });
    }
}

// ========================================
// MESSAGE HANDLING
// ========================================

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message === '') return;

    // Create message element
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = createMessageElement(message, 'sent');

    messagesContainer.appendChild(messageDiv);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Auto-scroll to bottom
    autoScrollMessages();

    // Here you would send to Flask backend
    // Example: sendMessageToBackend(message);
}

function createMessageElement(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
            <span class="message-time">${time}</span>
        </div>
    `;

    return messageDiv;
}

function autoScrollMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 0);
    }
}

// ========================================
// CONVERSATION MANAGEMENT
// ========================================

function selectConversation(element) {
    // Remove active class from all items
    document.querySelectorAll('.conversation-item').forEach((item) => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    element.classList.add('active');

    // Remove unread badge
    const badge = element.querySelector('.unread-badge');
    if (badge) {
        badge.remove();
    }

    // Remove unread class
    element.classList.remove('unread');

    // Update chat header with selected contact info
    const name = element.querySelector('.conversation-name').textContent;
    const chatName = document.querySelector('.chat-name');
    const profileName = document.querySelector('.user-profile h3');
    const avatar = element.querySelector('.conversation-avatar').textContent;

    if (chatName) chatName.textContent = name;
    if (profileName) profileName.textContent = name;

    // Update avatars
    updateAvatars(avatar);

    // Scroll conversation into view
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateAvatars(initial) {
    const chatAvatar = document.querySelector('.chat-avatar');
    const profileAvatar = document.querySelector('.profile-avatar');

    if (chatAvatar) chatAvatar.textContent = initial;
    if (profileAvatar) profileAvatar.textContent = initial;
}

function searchConversations(query) {
    const items = document.querySelectorAll('.conversation-item');
    query = query.toLowerCase();

    items.forEach((item) => {
        const name = item
            .querySelector('.conversation-name')
            .textContent.toLowerCase();
        const preview = item
            .querySelector('.conversation-preview')
            .textContent.toLowerCase();

        if (name.includes(query) || preview.includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Flask Backend Integration Example
// Uncomment and modify based on your Flask endpoints

/*
async function sendMessageToBackend(message) {
    try {
        const conversationId = document.querySelector('.conversation-item.active')?.dataset.id;
        
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                message: message,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        console.log('Message sent:', data);
    } catch (error) {
        console.error('Error:', error);
        // Show error notification to user
    }
}

async function loadConversations() {
    try {
        const response = await fetch('/api/conversations');
        const conversations = await response.json();
        // Update UI with conversations
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function loadMessages(conversationId) {
    try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        const messages = await response.json();
        // Update UI with messages
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}
*/