/* ============================================================
   DENSPARK STUDIO — services.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Preloader ─────────────────────────────────────────────── */
  const preloader = document.getElementById('preloader');

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('hide');
    preloader.addEventListener('transitionend', function handler() {
      preloader.removeEventListener('transitionend', handler);
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    });
  }

  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 800);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hidePreloader, 800);
    });
  }

  /* ── Navbar ────────────────────────────────────────────────── */
  (function () {
    const navbar      = document.getElementById('navbar');
    const menuToggle  = document.getElementById('menuToggle');
    const mobileMenu  = document.getElementById('mobileMenu');

    // ── FIXED: desktop uses desktopServicesMenu / desktopServicesToggle
    const desktopServicesMenu   = document.getElementById('desktopServicesMenu');
    const desktopServicesToggle = document.getElementById('desktopServicesToggle');

    // ── FIXED: mobile accordion uses mobileServicesItem / mobileServicesToggle
    const mobileServicesItem   = document.getElementById('mobileServicesItem');
    const mobileServicesToggle = document.getElementById('mobileServicesToggle');

    /* Scroll: add .scrolled to navbar */
    function onScroll() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Hamburger toggle */
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        menuToggle.classList.toggle('open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        if (navbar) navbar.classList.toggle('menu-open', isOpen);
      });

      // Close when a mobile nav link is tapped
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    function closeMobileMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      if (navbar) navbar.classList.remove('menu-open');
    }

    /* Desktop services mega menu — click to open/close */
    if (desktopServicesToggle && desktopServicesMenu) {
      desktopServicesToggle.addEventListener('click', function (e) {
        if (window.innerWidth > 768) {
          e.preventDefault();
          desktopServicesMenu.classList.toggle('open');
        }
      });
    }

    /* Mobile services accordion — tap to expand/collapse */
    if (mobileServicesToggle && mobileServicesItem) {
      mobileServicesToggle.addEventListener('click', function () {
        const isOpen = mobileServicesItem.classList.toggle('open');
        mobileServicesToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    /* Close everything on outside click */
    document.addEventListener('click', function (e) {
      if (desktopServicesMenu && !desktopServicesMenu.contains(e.target)) {
        desktopServicesMenu.classList.remove('open');
      }
      if (!e.target.closest('#navbar')) {
        closeMobileMenu();
      }
    });

    /* Close desktop dropdown on scroll */
    window.addEventListener('scroll', function () {
      if (desktopServicesMenu) desktopServicesMenu.classList.remove('open');
    }, { passive: true });

    /* Escape key closes mobile menu */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMobileMenu();
        if (desktopServicesMenu) desktopServicesMenu.classList.remove('open');
      }
    });
  })();

  /* ── Scroll Reveal ─────────────────────────────────────────── */
  function initReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  initReveal();

  /* ── Service strip: smooth scroll to section ──────────────── */
  const navbar    = document.getElementById('navbar');
  const stripItems = document.querySelectorAll('.strip-item[data-target]');

  stripItems.forEach(function (item) {
    item.addEventListener('click', function () {
      const target = document.getElementById(item.getAttribute('data-target'));
      if (target) {
        const navH = navbar ? navbar.offsetHeight : 72;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - navH - 16, behavior: 'smooth' });
      }
    });
  });

  /* ── Parallax: page hero ───────────────────────────────────── */
  const heroBg = document.querySelector('.page-hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', function () {
      if (window.pageYOffset < window.innerHeight) {
        heroBg.style.transform = 'translateY(' + (window.pageYOffset * 0.3) + 'px)';
      }
    }, { passive: true });
  }

  /* ── Chat Widget ───────────────────────────────────────────── */
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatClose    = document.getElementById('chatClose');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge    = document.querySelector('.chat-badge');

  var chatOpen = false;

  var autoReplies = [
    "Thanks for reaching out! We'll get back to you shortly. 📸",
    "Great question! Feel free to book a session via our contact page.",
    "We'd love to work with you! Check out our pricing above for details.",
    "Our team typically responds within a few hours. Stay tuned!",
    "You can also reach us on Instagram @densparkstudio 😊"
  ];
  var replyIndex = 0;

  function toggleChat() {
    chatOpen = !chatOpen;
    if (chatOpen) {
      if (chatWindow) { chatWindow.classList.add('open'); chatWindow.style.display = 'flex'; }
      if (chatBadge)  chatBadge.style.display = 'none';
      setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
    } else {
      if (chatWindow) { chatWindow.classList.remove('open'); chatWindow.style.display = 'none'; }
    }
  }

  function addMessage(text, type) {
    if (!chatMessages) return;
    var msg = document.createElement('div');
    msg.className = 'chat-msg ' + type;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage() {
    if (!chatInput) return;
    var text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'sent');
    chatInput.value = '';
    setTimeout(function () {
      addMessage(autoReplies[replyIndex % autoReplies.length], 'received');
      replyIndex++;
    }, 900 + Math.random() * 600);
  }

  if (chatToggle) chatToggle.addEventListener('click', toggleChat);
  if (chatClose)  chatClose.addEventListener('click', toggleChat);
  if (chatSend)   chatSend.addEventListener('click', sendMessage);
  if (chatInput)  chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

  setTimeout(function () {
    if (!chatOpen && chatBadge) chatBadge.style.display = 'flex';
  }, 4000);

  /* ── Marquee: pause on hover ──────────────────────────────── */
  var marqueeContent = document.querySelector('.marquee-content');
  if (marqueeContent) {
    marqueeContent.addEventListener('mouseenter', function () { marqueeContent.style.animationPlayState = 'paused'; });
    marqueeContent.addEventListener('mouseleave', function () { marqueeContent.style.animationPlayState = 'running'; });
  }

  /* ── Desktop: subtle tilt on service image frames ─────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.img-frame').forEach(function (frame) {
      frame.addEventListener('mousemove', function (e) {
        var rect = frame.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        frame.style.transform = 'perspective(800px) rotateY(' + (x * 3) + 'deg) rotateX(' + (-y * 3) + 'deg)';
      });
      frame.addEventListener('mouseleave', function () {
        frame.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
      });
    });
  }

})();