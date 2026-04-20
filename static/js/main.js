/* ============================================
   DENSPARK STUDIO - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initMarquee();
  initPortfolioFilters();
  initLightbox();
  initTestimonials();
  initChatWidget();
  initFormValidation();
  initParallax();
  initCounters();
  initBusinessHours();
});

/* ============================================
   NAVBAR
   ============================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  
  if (!navbar) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add/remove scrolled class
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
}

/* ============================================
   MOBILE MENU
   ============================================ */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!menuToggle || !navLinks) return;
  
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (!animatedElements.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  animatedElements.forEach(el => observer.observe(el));
}

/* ============================================
   MARQUEE
   ============================================ */
function initMarquee() {
  const marquee = document.querySelector('.marquee-content');
  
  if (!marquee) return;
  
  // Clone content for seamless loop
  marquee.innerHTML += marquee.innerHTML;
}

/* ============================================
   PORTFOLIO FILTERS
   ============================================ */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (!filterBtns.length || !portfolioItems.length) return;
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      
      // Filter items with animation
      portfolioItems.forEach((item, index) => {
        const category = item.dataset.category;
        
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
          item.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* ============================================
   LIGHTBOX
   ============================================ */
function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (!lightbox || !portfolioItems.length) return;
  
  let currentIndex = 0;
  const images = Array.from(portfolioItems).map(item => item.querySelector('img')?.src);
  
  // Open lightbox
  portfolioItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      currentIndex = index;
      lightboxImg.src = images[currentIndex];
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  
  // Close lightbox
  lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  
  // Navigation
  lightbox.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightboxImage();
  });
  
  lightbox.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    updateLightboxImage();
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateLightboxImage();
    }
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % images.length;
      updateLightboxImage();
    }
  });
  
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  function updateLightboxImage() {
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = images[currentIndex];
      lightboxImg.style.opacity = '1';
    }, 200);
  }
}

/* ============================================
   TESTIMONIALS SLIDER
   ============================================ */
function initTestimonials() {
  const track = document.querySelector('.testimonials-track');
  const cards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.querySelector('.testimonials-nav .prev');
  const nextBtn = document.querySelector('.testimonials-nav .next');
  
  if (!track || !cards.length) return;
  
  let currentSlide = 0;
  const totalSlides = cards.length;
  
  function updateSlider() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
  
  prevBtn?.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  });
  
  nextBtn?.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  });
  
  // Auto-play
  let autoPlay = setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  }, 5000);
  
  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoPlay));
  track.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    }, 5000);
  });
}

/* ============================================
   CHAT WIDGET
   ============================================ */
function initChatWidget() {
  const chatWidget = document.querySelector('.chat-widget');
  const chatToggle = document.querySelector('.chat-toggle');
  const chatWindow = document.querySelector('.chat-window');
  const chatClose = document.querySelector('.chat-close');
  const chatInput = document.querySelector('.chat-input input');
  const chatSend = document.querySelector('.chat-input button');
  const chatMessages = document.querySelector('.chat-messages');
  
  if (!chatWidget) return;
  
  chatToggle?.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
  });
  
  chatClose?.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });
  
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add sent message
    const sentMsg = document.createElement('div');
    sentMsg.className = 'chat-message sent';
    sentMsg.textContent = message;
    chatMessages.appendChild(sentMsg);
    
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate response
    setTimeout(() => {
      const receivedMsg = document.createElement('div');
      receivedMsg.className = 'chat-message received';
      receivedMsg.textContent = "Thank you for your message! We'll get back to you shortly.";
      chatMessages.appendChild(receivedMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
  }
  
  chatSend?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

/* ============================================
   FORM VALIDATION
   ============================================ */
function initFormValidation() {
  const forms = document.querySelectorAll('.contact-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Basic validation
      let isValid = true;
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      
      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#ef4444';
          shake(input);
        } else {
          input.style.borderColor = '';
        }
      });
      
      // Email validation
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && !isValidEmail(emailInput.value)) {
        isValid = false;
        emailInput.style.borderColor = '#ef4444';
        shake(emailInput);
      }
      
      if (isValid) {
        // Show success message
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
          btn.textContent = 'Message Sent!';
          btn.style.background = '#22c55e';
          form.reset();
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
          }, 3000);
        }, 1500);
      }
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shake(element) {
  element.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

/* ============================================
   PARALLAX EFFECT
   ============================================ */
function initParallax() {
  const parallaxElements = document.querySelectorAll('.hero-bg img');
  
  if (!parallaxElements.length) return;
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(el => {
      const speed = 0.5;
      el.style.transform = `scale(1.1) translateY(${scrolled * speed}px)`;
    });
  });
}

/* ============================================
   COUNTERS
   ============================================ */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  
  if (!counters.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        animateCounter(counter, target);
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const duration = 2000;
  const stepTime = duration / 50;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
}

/* ============================================
   BUSINESS HOURS
   ============================================ */
function initBusinessHours() {
  const hoursItems = document.querySelectorAll('.hours-item');
  const statusElement = document.querySelector('.hours-status');
  
  if (!hoursItems.length) return;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const currentDay = days[today.getDay()];
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  
  // Highlight current day
  hoursItems.forEach(item => {
    const dayElement = item.querySelector('.day');
    if (dayElement && dayElement.textContent === currentDay) {
      item.classList.add('today');
    }
  });
  
  // Update status
  if (statusElement) {
    const hours = {
      'Sunday': { open: 8, close: 20 },
      'Monday': { open: 8.5, close: 20 },
      'Tuesday': { open: 8.5, close: 20 },
      'Wednesday': { open: 8.5, close: 20 },
      'Thursday': { open: 8.5, close: 20 },
      'Friday': { open: 9, close: 20 },
      'Saturday': { open: 8.5, close: 20 }
    };
    
    const todayHours = hours[currentDay];
    const currentTime = currentHour + currentMinute / 60;
    
    if (currentTime >= todayHours.open && currentTime < todayHours.close) {
      statusElement.textContent = 'Open Now';
      statusElement.classList.remove('closed');
    } else {
      statusElement.textContent = 'Closed';
      statusElement.classList.add('closed');
    }
  }
}

/* ============================================
   SMOOTH SCROLL
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

/* ============================================
   CURSOR EFFECTS (Optional)
   ============================================ */
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);
  
  const cursorDot = document.createElement('div');
  cursorDot.className = 'custom-cursor-dot';
  document.body.appendChild(cursorDot);
  
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  });
  
  // Hover effects
  const hoverElements = document.querySelectorAll('a, button, .portfolio-item');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// Uncomment to enable custom cursor
// initCustomCursor();

/* ============================================
   PRELOADER
   ============================================ */
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('loaded');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
});
