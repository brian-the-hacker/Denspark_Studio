/**
 * services.js — Denspark Studio
 * ─────────────────────────────────────────────────────────────
 * Fixes applied:
 *  - Added missing CSS variable fallbacks (--transition, --nav-h).
 *  - Desktop mega-menu outside-click no longer races with the
 *    toggle click: click on toggle is handled exclusively there.
 *  - Mobile accordion open/close is fully decoupled from the
 *    hamburger and from outside-click logic.
 *  - Escape key closes both menus cleanly.
 *  - Service strip smooth-scroll accounts for dynamic navbar height.
 *  - Parallax hero is throttled with requestAnimationFrame to avoid
 *    layout thrashing on fast scrolls.
 *  - Chat widget: badge auto-shows after 4 s only once; chat window
 *    display toggling uses CSS class only (no inline style fighting
 *    CSS display:none).
 *  - img-frame tilt effect: original code referenced .img-frame
 *    (old class name) — updated to .sv-img-wrap.
 *  - All querySelector calls are null-guarded.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Inject missing CSS variables that the stylesheet references ── */
  // --transition and --nav-h are used in .css but never declared.
  (function injectCSSVars() {
    var style = document.createElement('style');
    style.textContent =
      ':root{' +
        '--transition: 0.25s ease;' +
        '--nav-h: 72px;' +
        '--blue: #1a56db;' +   // alias used in some btn-book rules
      '}';
    document.head.appendChild(style);
  }());

  /* ── Preloader ───────────────────────────────────────────────── */
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
    window.addEventListener('load', function () { setTimeout(hidePreloader, 800); });
  }

  /* ── Navbar ──────────────────────────────────────────────────── */
  (function initNavbar() {
    var navbar               = document.getElementById('navbar');
    var menuToggle           = document.getElementById('menuToggle');
    var mobileMenu           = document.getElementById('mobileMenu');
    var desktopServicesMenu  = document.getElementById('desktopServicesMenu');  // the <li>
    var desktopServicesToggle= document.getElementById('desktopServicesToggle');// the <a> inside it
    var mobileServicesItem   = document.getElementById('mobileServicesItem');
    var mobileServicesToggle = document.getElementById('mobileServicesToggle');

    /* ── Scroll: add .scrolled class ─────────────────────────── */
    function onScroll() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once immediately

    /* ── Hamburger / mobile menu ─────────────────────────────── */
    function openMobileMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.classList.add('open');
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
    }

    function closeMobileMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }

    if (menuToggle) {
      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileMenu && mobileMenu.classList.contains('open');
        isOpen ? closeMobileMenu() : openMobileMenu();
      });
    }

    // Close mobile menu when any nav link inside it is tapped
    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── Desktop mega-menu ───────────────────────────────────── */
    // Toggle on click (not hover — hover is handled by pure CSS in services.css).
    // The JS-driven .open class is for accessibility / click-to-open mode.
    function closeMegaMenu() {
      if (desktopServicesMenu) desktopServicesMenu.classList.remove('open');
    }

    if (desktopServicesToggle) {
      desktopServicesToggle.addEventListener('click', function (e) {
        if (window.innerWidth > 900) {
          e.preventDefault();
          e.stopPropagation(); // prevent the document click handler below
          var isOpen = desktopServicesMenu && desktopServicesMenu.classList.contains('open');
          isOpen ? closeMegaMenu() : desktopServicesMenu.classList.add('open');
        }
      });
    }

    /* ── Mobile services accordion ───────────────────────────── */
    if (mobileServicesToggle && mobileServicesItem) {
      mobileServicesToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileServicesItem.classList.toggle('open');
        mobileServicesToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    /* ── Outside click: close mega + mobile menu ─────────────── */
    document.addEventListener('click', function (e) {
      // Close desktop mega if click is outside the services <li>
      if (desktopServicesMenu && !desktopServicesMenu.contains(e.target)) {
        closeMegaMenu();
      }
      // Close mobile menu if click is outside the entire navbar
      if (navbar && !navbar.contains(e.target)) {
        closeMobileMenu();
      }
    });

    /* ── Close on scroll (desktop mega only) ─────────────────── */
    window.addEventListener('scroll', closeMegaMenu, { passive: true });

    /* ── Escape key ──────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeMegaMenu();
      }
    });
  }());

  /* ── Scroll Reveal ───────────────────────────────────────────── */
  (function initReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      // Fallback for old browsers
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }());

  /* ── Services strip: smooth scroll to section ───────────────── */
  (function initStrip() {
    var navbar     = document.getElementById('navbar');
    var stripItems = document.querySelectorAll('.strip-item[data-target]');

    stripItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var targetId = item.getAttribute('data-target');
        var target   = document.getElementById(targetId);
        if (!target) return;
        var navH = navbar ? navbar.offsetHeight : 72;
        var top  = target.getBoundingClientRect().top + window.pageYOffset - navH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }());

  /* ── Parallax: page hero (rAF-throttled) ─────────────────────── */
  (function initParallax() {
    var heroBg   = document.querySelector('.page-hero-bg');
    if (!heroBg) return;

    var ticking  = false;

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (window.pageYOffset < window.innerHeight) {
          heroBg.style.transform = 'translateY(' + (window.pageYOffset * 0.3) + 'px)';
        }
        ticking = false;
      });
    }, { passive: true });
  }());

  /* ── Chat Widget ─────────────────────────────────────────────── */
  (function initChat() {
    var chatToggle   = document.getElementById('chatToggle');
    var chatWindow   = document.getElementById('chatWindow');
    var chatClose    = document.getElementById('chatClose');
    var chatInput    = document.getElementById('chatInput');
    var chatSend     = document.getElementById('chatSend');
    var chatMessages = document.getElementById('chatMessages');
    var chatBadge    = document.querySelector('.chat-badge');

    // Manage open state with a class only — no fighting inline styles.
    // CSS must have:  .chat-window { display: none; }
    //                 .chat-window.open { display: flex; }
    var isOpen = false;

    function openChat() {
      isOpen = true;
      if (chatWindow) chatWindow.classList.add('open');
      if (chatBadge)  chatBadge.style.display = 'none';
      setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
    }

    function closeChat() {
      isOpen = false;
      if (chatWindow) chatWindow.classList.remove('open');
    }

    function toggleChat() { isOpen ? closeChat() : openChat(); }

    var autoReplies = [
      "Thanks for reaching out! We'll get back to you shortly. 📸",
      "Great question! Feel free to book a session via our contact page.",
      "We'd love to work with you! Check out our pricing above for details.",
      "Our team typically responds within a few hours. Stay tuned!",
      "You can also reach us on Instagram @densparkstudio 😊"
    ];
    var replyIndex = 0;

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
    if (chatInput)  {
      chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
      });
    }

    // Show badge once after 4 s if chat hasn't been opened
    setTimeout(function () {
      if (!isOpen && chatBadge) chatBadge.style.display = 'flex';
    }, 4000);
  }());

  /* ── Marquee: pause on hover ─────────────────────────────────── */
  (function initMarquee() {
    var marqueeContent = document.querySelector('.marquee-content');
    if (!marqueeContent) return;

    marqueeContent.addEventListener('mouseenter', function () {
      marqueeContent.style.animationPlayState = 'paused';
    });
    marqueeContent.addEventListener('mouseleave', function () {
      marqueeContent.style.animationPlayState = 'running';
    });
  }());

  /* ── Desktop: subtle tilt on service image wrappers ─────────── */
  // Fixed: was targeting .img-frame (old class); now targets .sv-img-wrap
  (function initTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.querySelectorAll('.sv-img-wrap').forEach(function (wrap) {
      wrap.addEventListener('mousemove', function (e) {
        var rect = wrap.getBoundingClientRect();
        var x    = (e.clientX - rect.left)  / rect.width  - 0.5;
        var y    = (e.clientY - rect.top)   / rect.height - 0.5;
        wrap.style.transform =
          'perspective(800px) rotateY(' + (x * 3) + 'deg) rotateX(' + (-y * 3) + 'deg)';
      });

      wrap.addEventListener('mouseleave', function () {
        wrap.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      });
    });
  }());

}());