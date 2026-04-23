/* ============================================================
   DENSPARK STUDIO — Services JS
   Matches portfolio.js patterns exactly
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     PRELOADER
  ────────────────────────────────────────── */
  const preloader = document.getElementById('preloader');
  document.body.style.overflow = 'hidden';

  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 1600);
  });

  

  /* ──────────────────────────────────────────
     NAVBAR — SCROLL cursor
  ────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ──────────────────────────────────────────
     MOBILE MENU
  ────────────────────────────────────────── */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  /* ──────────────────────────────────────────
     SCROLL REVEAL
  ────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ──────────────────────────────────────────
     SERVICE BLOCKS — STAGGERED ENTRY
  ────────────────────────────────────────── */
  const blockObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        blockObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.service-block').forEach(block => blockObserver.observe(block));

  /* ──────────────────────────────────────────
     PRICING CARDS — TILT ON MOUSE
  ────────────────────────────────────────── */
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -4;
      const tiltY = dx *  4;
      card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      const isFeatured = card.classList.contains('pricing-card--featured');
      card.style.transform = isFeatured ? 'scale(1.04)' : '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, box-shadow 0.35s, border-color 0.35s, background 0.35s';
    });
  });

  /* ──────────────────────────────────────────
     SERVICES STRIP — SCROLL INDICATOR
  ────────────────────────────────────────── */
  // Highlight the strip item matching the currently visible service
  const serviceIds = ['portraits', 'weddings', 'events', 'video'];
  const stripItems = document.querySelectorAll('.strip-item');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const idx = serviceIds.indexOf(id);
        if (idx !== -1) {
          stripItems.forEach((item, i) => {
            item.style.color = i === idx ? 'var(--blue)' : '';
          });
        }
      }
    });
  }, { threshold: 0.4, rootMargin: '-80px 0px 0px 0px' });

  serviceIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  // Click strip item → smooth scroll to section
  stripItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      const target = document.getElementById(serviceIds[i]);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ──────────────────────────────────────────
     MARQUEE — REDUCED MOTION
  ────────────────────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const mc = document.querySelector('.marquee-content');
    if (mc) mc.style.animation = 'none';
  }

  /* ──────────────────────────────────────────
     CHAT WIDGET
  ────────────────────────────────────────── */
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatClose    = document.getElementById('chatClose');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge    = chatToggle.querySelector('.chat-badge');

  let chatOpen = false;

  function toggleChat() {
    chatOpen = !chatOpen;
    chatWindow.classList.toggle('open', chatOpen);
    if (chatOpen && chatBadge) chatBadge.style.display = 'none';
    if (chatOpen) chatInput.focus();
  }

  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', (e) => { e.stopPropagation(); toggleChat(); });

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${type}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'sent');
    chatInput.value = '';
    setTimeout(() => {
      const replies = [
        "Thanks! We'll get back to you shortly. 📸",
        "Great question! Our team will respond within the hour.",
        "We'd love to capture your special moments. Check our packages above!",
        "Feel free to book a session at your convenience!"
      ];
      addMessage(replies[Math.floor(Math.random() * replies.length)], 'received');
    }, 900 + Math.random() * 500);
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

  /* ──────────────────────────────────────────
     SERVICE BLOCK PARALLAX (subtle)
  ────────────────────────────────────────── */
  const imgFrames = document.querySelectorAll('.img-frame img');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    imgFrames.forEach(img => {
      const rect = img.closest('.service-block-image').getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (window.innerHeight / 2 - center) * 0.04;
      img.style.transform = `scale(1.06) translateY(${offset}px)`;
    });
  }, { passive: true });

})();