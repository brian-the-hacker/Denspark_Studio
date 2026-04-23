/* ============================================================
   DENSPARK STUDIO — About JS
   Consistent with portfolio.js & services.js patterns
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
     CUSTOM CURSOR
  ────────────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateCursor() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateCursor);
  })();

  const hoverTargets = 'a, button, .team-card, .value-card, input, [role="button"]';
  document.addEventListener('mouseover', (e) => { if (e.target.closest(hoverTargets)) document.body.classList.add('cursor-hover'); });
  document.addEventListener('mouseout',  (e) => { if (e.target.closest(hoverTargets)) document.body.classList.remove('cursor-hover'); });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; follower.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; follower.style.opacity = '1'; });

  /* ──────────────────────────────────────────
     NAVBAR SCROLL
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
  mobileMenu.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuToggle.classList.remove('open');
  }));

  /* ──────────────────────────────────────────
     SCROLL REVEAL (shared .reveal pattern)
  ────────────────────────────────────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ──────────────────────────────────────────
     COUNTER ANIMATION
  ────────────────────────────────────────── */
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

  /* ──────────────────────────────────────────
     STAT ITEMS — top line reveal via class
  ────────────────────────────────────────── */
  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        statObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stat-item').forEach(el => statObs.observe(el));

  /* ──────────────────────────────────────────
     TEAM CARDS — social links slide up stagger
  ────────────────────────────────────────── */
  document.querySelectorAll('.team-card').forEach(card => {
    const links = card.querySelectorAll('.team-social a');
    card.addEventListener('mouseenter', () => {
      links.forEach((link, i) => {
        link.style.transitionDelay = `${i * 0.06}s`;
      });
    });
    card.addEventListener('mouseleave', () => {
      links.forEach(link => { link.style.transitionDelay = '0s'; });
    });
  });

  /* ──────────────────────────────────────────
     VALUE CARDS — subtle parallax on hover
  ────────────────────────────────────────── */
  document.querySelectorAll('.value-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateX(${dy * -3}deg) rotateY(${dx * 3}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), background 0.35s';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.12s ease, background 0.35s';
    });
  });

  /* ──────────────────────────────────────────
     STORY IMAGE PARALLAX
  ────────────────────────────────────────── */
  const storyImg = document.querySelector('.story-img-frame img');
  if (storyImg) {
    window.addEventListener('scroll', () => {
      const rect   = storyImg.closest('.story-image-wrap').getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (window.innerHeight / 2 - center) * 0.05;
      storyImg.style.transform = `scale(1.08) translateY(${offset}px)`;
    }, { passive: true });
  }

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
    const replies = [
      "Thanks for reaching out! We'd love to work with you. 📸",
      "Great to hear from you! Our team will respond shortly.",
      "We're passionate about capturing your moments — let's connect!",
      "Feel free to book a session or check out our portfolio!"
    ];
    setTimeout(() => addMessage(replies[Math.floor(Math.random() * replies.length)], 'received'), 850 + Math.random() * 500);
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

})();