/* ========================================
   SETTINGS MANAGEMENT - JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initializeSettings();
});

// ========================================
// INITIALIZATION
// ========================================

function initializeSettings() {
    setupNavigation();
    setupFormHandlers();
    setupPhotoUpload();
    setupToggleSwitches();
    setupFieldAnimations();
}

// ========================================
// NAVIGATION
// ======================================== */

function setupNavigation() {
    const navItems = document.querySelectorAll('.settings-nav-item');

    navItems.forEach((item) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const target = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(target);

            if (!targetSection) return;

            // Update navigation
            navItems.forEach((i) => i.classList.remove('active'));
            this.classList.add('active');

            // Update sections with animation
            document.querySelectorAll('.settings-section').forEach((section) => {
                section.classList.remove('active');
            });

            // Add slight delay for better visual effect
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 50);

            // Scroll to top smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        });
    });
}

// ========================================
// FORM HANDLERS
// ======================================== */

function setupFormHandlers() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleFormSubmit);
    }

    // Business form
    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        businessForm.addEventListener('submit', handleFormSubmit);
    }

    // Notifications form
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', handleFormSubmit);
    }

    // Security form
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', handleFormSubmit);
    }

    // Add service button
    const addServiceBtn = document.querySelector('.add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', handleAddService);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Show success notification
        showNotification('Settings saved successfully!', 'success');

        // Add ripple effect
        addRippleEffect(submitBtn);
    }, 1500);
}

function handleAddService() {
    showNotification('Opening service editor...', 'info');
    // In a real app, this would open a modal
    console.log('Add service clicked');
}

// ========================================
// PHOTO UPLOAD
// ======================================== */

function setupPhotoUpload() {
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const photoInput = document.getElementById('photoInput');
    const profilePhoto = document.getElementById('profilePhoto');

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            photoInput?.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelect);
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', handleRemovePhoto);
    }
}

function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return;
    }

    // Read and display
    const reader = new FileReader();
    reader.onload = (event) => {
        const profilePhoto = document.getElementById('profilePhoto');
        if (profilePhoto) {
            profilePhoto.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                profilePhoto.src = event.target.result;
                profilePhoto.style.animation = 'scaleIn 0.4s ease';
            }, 150);
        }
        showNotification('Photo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

function handleRemovePhoto() {
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        profilePhoto.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            profilePhoto.src = 'https://via.placeholder.com/150?text=Photo';
            profilePhoto.style.animation = 'scaleIn 0.4s ease';
        }, 150);
    }
    showNotification('Photo removed', 'info');
}

// ========================================
// TOGGLE SWITCHES
// ======================================== */

function setupToggleSwitches() {
    const toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');

    toggles.forEach((toggle) => {
        toggle.addEventListener('change', function () {
            const label = this.closest('.toggle-switch');
            if (label) {
                label.style.animation = 'pulse 0.3s ease';
            }
        });
    });
}

// ========================================
// FIELD ANIMATIONS
// ======================================== */

function setupFieldAnimations() {
    const formFields = document.querySelectorAll(
        '.form-group input, .form-group textarea, .form-group select'
    );

    formFields.forEach((field, index) => {
        field.style.animation = `slideUp 0.4s ease ${index * 0.05}s both`;

        field.addEventListener('focus', function () {
            this.style.transform = 'scale(1.01)';
        });

        field.addEventListener('blur', function () {
            this.style.transform = 'scale(1)';
        });

        field.addEventListener('input', function () {
            if (this.value) {
                this.style.backgroundColor = 'var(--dark-bg-tertiary)';
            }
        });
    });
}

// ========================================
// UTILITIES
// ======================================== */

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${
            type === 'success'
                ? '#10b981'
                : type === 'error'
                  ? '#ef4444'
                  : type === 'warning'
                    ? '#f59e0b'
                    : '#3b82f6'
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
        z-index: 2000;
        font-weight: 500;
        font-family: 'Inter', sans-serif;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addRippleEffect(element) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// ========================================
// KEYBOARD SHORTCUTS
// ======================================== */

document.addEventListener('keydown', function (e) {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const activeForm = document.querySelector('.settings-section.active form');
        if (activeForm) {
            activeForm.dispatchEvent(new Event('submit'));
        }
    }

    // Tab through sections with arrow keys
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeNav = document.querySelector('.settings-nav-item.active');
        if (activeNav) {
            const allNavItems = Array.from(document.querySelectorAll('.settings-nav-item'));
            const currentIndex = allNavItems.indexOf(activeNav);
            const nextIndex =
                e.key === 'ArrowDown'
                    ? (currentIndex + 1) % allNavItems.length
                    : (currentIndex - 1 + allNavItems.length) % allNavItems.length;

            allNavItems[nextIndex].click();
        }
    }
});

// ========================================
// SESSION MANAGEMENT
// ======================================== */

document.querySelectorAll('.session-item button.btn-ghost').forEach((btn) => {
    btn.addEventListener('click', function () {
        const sessionItem = this.closest('.session-item');
        if (sessionItem) {
            sessionItem.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => {
                sessionItem.remove();
                showNotification('Session revoked', 'success');
            }, 300);
        }
    });
});

// ========================================
// LOGOUT ALL SESSIONS
// ======================================== */

document.querySelector('.btn-danger')?.addEventListener('click', function () {
    if (
        confirm('Are you sure you want to logout all other sessions? This action cannot be undone.')
    ) {
        const sessions = document.querySelectorAll('.session-item:not(.current)');
        sessions.forEach((session, index) => {
            setTimeout(() => {
                session.style.animation = 'slideDown 0.3s ease forwards';
                setTimeout(() => session.remove(), 300);
            }, index * 100);
        });

        setTimeout(() => {
            showNotification('All other sessions have been logged out', 'success');
        }, sessions.length * 100);
    }
});

// ========================================
// ANIMATIONS
// ======================================== */

const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(10px);
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }

    @keyframes ripple {
        to {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
        }
    }

    .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// SMOOTH SCROLL
// ======================================== */

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }
    });
});