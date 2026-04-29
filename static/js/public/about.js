/* ============================================================
   DENSPARK STUDIO — about.js  (performance-optimised)
   ============================================================ */

(function () {
  'use strict';

  /* ── Preloader ─────────────────────────────────────────────── */
  var preloader = document.getElementById('preloader');

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('hide');
    preloader.addEventListener('transitionend', function handler() {
      preloader.removeEventListener('transitionend', handler);
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    });
  }

  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 600);
  } else {
    window.addEventListener('load', function () { setTimeout(hidePreloader, 600); });
  }

  /* ── Lazy-load team images + shimmer ───────────────────────── */
  function initLazyImages() {
    document.querySelectorAll('.team-img-wrap img').forEach(function (img) {
      var wrap = img.closest('.team-img-wrap');

      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');

      function markLoaded() {
        if (wrap) wrap.classList.add('loaded');
      }

      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener('load', markLoaded);
        img.addEventListener('error', function () {
          if (wrap) {
            wrap.classList.add('loaded');
            wrap.style.background = '#c8c8c8';
          }
        });
      }
    });

    // Lazy load story image too
    var storyImg = document.querySelector('.story-img-frame img');
    if (storyImg) {
      storyImg.setAttribute('loading', 'lazy');
      storyImg.setAttribute('decoding', 'async');
    }
  }

  initLazyImages();

  /* ── Custom Cursor (desktop only) ──────────────────────────── */
  var cursor         = document.getElementById('cursor');
  var cursorFollower = document.getElementById('cursorFollower');

  if (cursor && cursorFollower && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;
    var cursorVisible = false;

    function moveCursor() {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      cursor.style.left = mouseX + 'px';
      cursor.style.top  = mouseY + 'px';
      cursorFollower.style.left = Math.round(followerX) + 'px';
      cursorFollower.style.top  = Math.round(followerY) + 'px';
      requestAnimationFrame(moveCursor);
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!cursorVisible) {
        cursor.style.opacity = '1';
        cursorFollower.style.opacity = '1';
        cursorVisible = true;
      }
    });

    cursor.style.opacity = '0';
    cursorFollower.style.opacity = '0';
    requestAnimationFrame(moveCursor);

    document.querySelectorAll('a, button, .team-card, .mvv-card, .value-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.style.transform = 'translate(-50%, -50%) scale(2.2)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(0.5)';
        cursorFollower.style.opacity = '0.4';
      });
      el.addEventListener('mouseleave', function () {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorFollower.style.opacity = '1';
      });
    });
  } else {
    if (cursor) cursor.style.display = 'none';
    if (cursorFollower) cursorFollower.style.display = 'none';
  }

  /* ── Navbar ────────────────────────────────────────────────── */
  var navbar     = document.getElementById('navbar');
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var chatIsOpen = false;

  function onScroll() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('open');
    if (navbar)    navbar.classList.remove('menu-open');
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        mobileMenu.classList.add('open');
        menuToggle.classList.add('open');
        navbar.classList.add('menu-open');
      }
    });
    mobileMenu.querySelectorAll('a').forEach(function (l) { l.addEventListener('click', closeMenu); });
  }

  document.addEventListener('click', function (e) {
    if (navbar && !navbar.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu();
    if (chatIsOpen) toggleChat();
  });
const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── Desktop Services mega menu (click to open/close) ─── */
  const desktopServicesMenu   = document.getElementById('desktopServicesMenu');
  const desktopServicesToggle = document.getElementById('desktopServicesToggle');
  if (desktopServicesMenu && desktopServicesToggle) {
    desktopServicesToggle.addEventListener('click', (e) => {
      // Only intercept on desktop; on mobile the element is hidden anyway
      if (window.innerWidth > 768) {
        e.preventDefault();
        desktopServicesMenu.classList.toggle('open');
      }
    });
    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!desktopServicesMenu.contains(e.target)) {
        desktopServicesMenu.classList.remove('open');
      }
    });
    // Close on scroll
    window.addEventListener('scroll', () => desktopServicesMenu.classList.remove('open'), { passive: true });
  }

  /* ── Mobile Services accordion ────────────────────────── */
  const mobileServicesItem   = document.getElementById('mobileServicesItem');
  const mobileServicesToggle = document.getElementById('mobileServicesToggle');
  if (mobileServicesItem && mobileServicesToggle) {
    mobileServicesToggle.addEventListener('click', () => {
      const open = mobileServicesItem.classList.toggle('open');
      mobileServicesToggle.setAttribute('aria-expanded', String(open));
    });
  }
  /* ── Scroll Reveal ─────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── Animated Number Counters ──────────────────────────────── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var start  = null;
    var dur    = 1800;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); cntObs.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.counter').forEach(function (c) { cntObs.observe(c); });
  } else {
    document.querySelectorAll('.counter').forEach(function (c) {
      c.textContent = c.getAttribute('data-target');
    });
  }

  /* ── Hero Parallax (throttled via rAF) ─────────────────────── */
  var heroBg  = document.querySelector('.page-hero-bg');
  var ticking = false;

  if (heroBg) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var s = window.pageYOffset;
          if (s < window.innerHeight) heroBg.style.transform = 'translateY(' + (s * 0.28) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── Marquee pause on hover ────────────────────────────────── */
  var mq = document.querySelector('.marquee-content');
  if (mq) {
    mq.addEventListener('mouseenter', function () { mq.style.animationPlayState = 'paused'; });
    mq.addEventListener('mouseleave', function () { mq.style.animationPlayState = 'running'; });
  }

  /* ── Chat Widget ───────────────────────────────────────────── */
  var chatToggle   = document.getElementById('chatToggle');
  var chatWindow   = document.getElementById('chatWindow');
  var chatClose    = document.getElementById('chatClose');
  var chatInput    = document.getElementById('chatInput');
  var chatSend     = document.getElementById('chatSend');
  var chatMessages = document.getElementById('chatMessages');
  var chatBadge    = document.querySelector('.chat-badge');

  var replies = [
    "Great question! Our team is always happy to help 😊",
    "Feel free to book a session via our contact page!",
    "Dennis leads the team with 10+ years of experience.",
    "We'd love to work with you — check out our services!",
    "Find us on Instagram @densparkstudio 📸"
  ];
  var rIdx = 0;

  function toggleChat() {
    chatIsOpen = !chatIsOpen;
    if (chatIsOpen) {
      if (chatWindow) { chatWindow.classList.add('open'); chatWindow.style.display = 'flex'; }
      if (chatBadge) chatBadge.style.display = 'none';
      setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
    } else {
      if (chatWindow) { chatWindow.classList.remove('open'); chatWindow.style.display = 'none'; }
    }
  }

  function addMsg(text, type) {
    if (!chatMessages) return;
    var m = document.createElement('div');
    m.className = 'chat-msg ' + type;
    m.textContent = text;
    chatMessages.appendChild(m);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMsg() {
    if (!chatInput) return;
    var t = chatInput.value.trim();
    if (!t) return;
    addMsg(t, 'sent');
    chatInput.value = '';
    setTimeout(function () { addMsg(replies[rIdx++ % replies.length], 'received'); }, 850 + Math.random() * 400);
  }

  if (chatToggle) chatToggle.addEventListener('click', toggleChat);
  if (chatClose)  chatClose.addEventListener('click', toggleChat);
  if (chatSend)   chatSend.addEventListener('click', sendMsg);
  if (chatInput)  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendMsg(); }
  });

  setTimeout(function () {
    if (!chatIsOpen && chatBadge) chatBadge.style.display = 'flex';
  }, 4000);

  /* ── Team cards 3D tilt (desktop) ──────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.team-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width  - 0.5;
        var y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          'translateY(-8px) perspective(600px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

})();