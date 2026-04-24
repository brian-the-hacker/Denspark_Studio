/* ============================================================
   DENSPARK STUDIO — about.js
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
    setTimeout(hidePreloader, 800);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hidePreloader, 800);
    });
  }

  /* ── Custom Cursor ─────────────────────────────────────────── */
  var cursor         = document.getElementById('cursor');
  var cursorFollower = document.getElementById('cursorFollower');

  var mouseX = 0, mouseY = 0;
  var followerX = 0, followerY = 0;
  var cursorVisible = false;

  function updateCursor() {
    if (!cursor || !cursorFollower) return;

    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;

    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top  = followerY + 'px';

    requestAnimationFrame(updateCursor);
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!cursorVisible && cursor) {
      cursor.style.opacity = '1';
      cursorFollower.style.opacity = '1';
      cursorVisible = true;
    }
  });

  // Scale cursor on interactive elements
  document.querySelectorAll('a, button, .team-card, .mvv-card, .value-card').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      if (cursor) cursor.style.transform = 'translate(-50%, -50%) scale(2.2)';
      if (cursorFollower) {
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(0.5)';
        cursorFollower.style.opacity = '0.4';
      }
    });

    el.addEventListener('mouseleave', function () {
      if (cursor) cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      if (cursorFollower) {
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorFollower.style.opacity = '1';
      }
    });
  });

  if (cursor && cursorFollower) {
    cursor.style.opacity = '0';
    cursorFollower.style.opacity = '0';
    updateCursor();
  }

  /* ── Navbar ────────────────────────────────────────────────── */
  var navbar     = document.getElementById('navbar');
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        navbar.classList.remove('menu-open');
      } else {
        mobileMenu.classList.add('open');
        menuToggle.classList.add('open');
        navbar.classList.add('menu-open');
      }
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        navbar.classList.remove('menu-open');
      });
    });
  }

  document.addEventListener('click', function (e) {
    if (!navbar || navbar.contains(e.target)) return;
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('open');
    if (navbar)    navbar.classList.remove('menu-open');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('open');
    if (navbar)    navbar.classList.remove('menu-open');
    if (chatIsOpen) toggleChat();
  });

  /* ── Scroll Reveal ─────────────────────────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  initReveal();

  /* ── Animated Number Counters ──────────────────────────────── */
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    var target   = parseInt(el.getAttribute('data-target'), 10);
    var duration = 1800;
    var start    = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var value    = Math.floor(easeOut(progress) * target);

      el.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(function (counter) { obs.observe(counter); });
    } else {
      counters.forEach(function (counter) {
        counter.textContent = counter.getAttribute('data-target');
      });
    }
  }

  initCounters();

  /* ── Hero Parallax ─────────────────────────────────────────── */
  var heroBg = document.querySelector('.page-hero-bg');

  function onScrollParallax() {
    if (!heroBg) return;
    var scrolled = window.pageYOffset;
    if (scrolled < window.innerHeight) {
      heroBg.style.transform = 'translateY(' + (scrolled * 0.3) + 'px)';
    }
  }

  if (heroBg) {
    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  /* ── Marquee pause on hover ────────────────────────────────── */
  var marqueeContent = document.querySelector('.marquee-content');

  if (marqueeContent) {
    marqueeContent.addEventListener('mouseenter', function () {
      marqueeContent.style.animationPlayState = 'paused';
    });
    marqueeContent.addEventListener('mouseleave', function () {
      marqueeContent.style.animationPlayState = 'running';
    });
  }

  /* ── Chat Widget ───────────────────────────────────────────── */
  var chatToggle   = document.getElementById('chatToggle');
  var chatWindow   = document.getElementById('chatWindow');
  var chatClose    = document.getElementById('chatClose');
  var chatInput    = document.getElementById('chatInput');
  var chatSend     = document.getElementById('chatSend');
  var chatMessages = document.getElementById('chatMessages');
  var chatBadge    = document.querySelector('.chat-badge');
  var chatIsOpen   = false;

  var autoReplies = [
    "Great question! Our team is always happy to help 😊",
    "Feel free to book a session via our contact page!",
    "Dennis leads our team with 10+ years of experience.",
    "We'd love to work with you. Check out our services page!",
    "You can also find us on Instagram @densparkstudio"
  ];
  var replyIndex = 0;

  function toggleChat() {
    chatIsOpen = !chatIsOpen;
    if (chatIsOpen) {
      chatWindow.classList.add('open');
      chatWindow.style.display = 'flex';
      if (chatBadge) chatBadge.style.display = 'none';
      setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
    } else {
      chatWindow.classList.remove('open');
      chatWindow.style.display = 'none';
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
    }, 900 + Math.random() * 500);
  }

  if (chatToggle) chatToggle.addEventListener('click', toggleChat);
  if (chatClose)  chatClose.addEventListener('click', toggleChat);
  if (chatSend)   chatSend.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    });
  }

  setTimeout(function () {
    if (!chatIsOpen && chatBadge) chatBadge.style.display = 'flex';
  }, 4000);

  /* ── Team cards: tilt on desktop ───────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.team-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = 'translateY(-8px) perspective(600px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

})();