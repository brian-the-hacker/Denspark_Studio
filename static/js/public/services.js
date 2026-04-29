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
    // Remove from DOM after transition
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

  /* ── Navbar: scroll + mobile toggle ───────────────────────── */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  // Scroll
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Mobile toggle
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.contains('open');

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

    // Close on mobile link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        navbar.classList.remove('menu-open');
      });
    });
  }



  /**
 * services-carousel.js
 * Auto-sliding crossfade carousel for each .sv-block
 * Each carousel advances independently every 4 seconds.
 * Clicking a dot jumps to that slide and resets the timer.
 */

  (function () {
    const INTERVAL = 4000; // ms between slides

    document.querySelectorAll('.sv-block').forEach(function (block) {
      const slides = block.querySelectorAll('.sv-slide');
      const dots   = block.querySelectorAll('.sv-dot-btn');
      let current  = 0;
      let timer    = null;

      function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
      }

      function next() {
        goTo(current + 1);
      }

      function startTimer() {
        clearInterval(timer);
        timer = setInterval(next, INTERVAL);
      }

      // Dot click — jump to slide and reset timer
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          goTo(parseInt(dot.dataset.index, 10));
          startTimer();
        });
      });

      // Pause on hover, resume on leave
      block.addEventListener('mouseenter', function () {
        clearInterval(timer);
      });
      block.addEventListener('mouseleave', function () {
        startTimer();
      });

      startTimer();
    });
  })();
  
  const servicesMenu = document.getElementById("servicesMenu");
  const servicesToggle = document.getElementById("servicesToggle");

  // open/close on click
  servicesToggle.addEventListener("click", function (e) {
    e.preventDefault(); // prevents page jump
    servicesMenu.classList.toggle("open");
  });

  // close when clicking outside
  document.addEventListener("click", function (e) {
    if (!servicesMenu.contains(e.target)) {
      servicesMenu.classList.remove("open");
    }
  });

  // optional: close on scroll
  window.addEventListener("scroll", () => {
    servicesMenu.classList.remove("open");
  });
  // Close mobile menu on outside click
  document.addEventListener('click', function (e) {
    if (!navbar) return;
    if (!navbar.contains(e.target)) {
      if (mobileMenu) mobileMenu.classList.remove('open');
      if (menuToggle) menuToggle.classList.remove('open');
      if (navbar)    navbar.classList.remove('menu-open');
    }
  });

  /* ── Scroll Reveal ─────────────────────────────────────────── */
  function initReveal() {
    const revealEls = document.querySelectorAll('.reveal');

    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              // Respect CSS transition-delay set via --delay custom property
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show all immediately
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  initReveal();

  /* ── Service Strip: smooth scroll to section ─────────────── */
  const stripItems = document.querySelectorAll('.strip-item[data-target]');

  stripItems.forEach(function (item) {
    item.addEventListener('click', function () {
      const targetId = item.getAttribute('data-target');
      const target   = document.getElementById(targetId);

      if (target) {
        const navH   = navbar ? navbar.offsetHeight : 72;
        const top    = target.getBoundingClientRect().top + window.pageYOffset - navH - 16;

        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ── Parallax: Page Hero background ──────────────────────── */
  const heroBg = document.querySelector('.page-hero-bg');

  function onScrollParallax() {
    if (!heroBg) return;
    const scrolled = window.pageYOffset;
    if (scrolled < window.innerHeight) {
      heroBg.style.transform = 'translateY(' + (scrolled * 0.3) + 'px)';
    }
  }

  if (heroBg) {
    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  /* ── Chat Widget ───────────────────────────────────────────── */
  const chatToggle  = document.getElementById('chatToggle');
  const chatWindow  = document.getElementById('chatWindow');
  const chatClose   = document.getElementById('chatClose');
  const chatInput   = document.getElementById('chatInput');
  const chatSend    = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge   = document.querySelector('.chat-badge');

  var chatOpen = false;

  // Auto responses pool
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

    // Auto reply after short delay
    setTimeout(function () {
      var reply = autoReplies[replyIndex % autoReplies.length];
      replyIndex++;
      addMessage(reply, 'received');
    }, 900 + Math.random() * 600);
  }

  if (chatToggle)  chatToggle.addEventListener('click', toggleChat);
  if (chatClose)   chatClose.addEventListener('click', toggleChat);

  if (chatSend) {
    chatSend.addEventListener('click', sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Show badge after 4 seconds if not opened
  setTimeout(function () {
    if (!chatOpen && chatBadge) {
      chatBadge.style.display = 'flex';
    }
  }, 4000);

  /* ── Marquee: pause on hover ──────────────────────────────── */
  var marqueeContent = document.querySelector('.marquee-content');

  if (marqueeContent) {
    marqueeContent.addEventListener('mouseenter', function () {
      marqueeContent.style.animationPlayState = 'paused';
    });
    marqueeContent.addEventListener('mouseleave', function () {
      marqueeContent.style.animationPlayState = 'running';
    });
  }

  /* ── Service blocks: stagger image reveal on scroll ─────── */
  function initServiceBlocks() {
    var blocks = document.querySelectorAll('.service-block');

    if (!blocks.length || !('IntersectionObserver' in window)) return;

    var blockObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          blockObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    blocks.forEach(function (block) {
      blockObserver.observe(block);
    });
  }

  initServiceBlocks();

  /* ── Pricing cards: stagger on scroll ────────────────────── */
  function initPricingStagger() {
    var cards = document.querySelectorAll('.pricing-card.reveal');

    if (!cards.length) return;

    // CSS --delay is already set on individual cards via inline style
    // IntersectionObserver handles the .visible class via initReveal()
    // Nothing extra needed; this is handled by the shared reveal system
  }

  initPricingStagger();

  /* ── Keyboard nav: close mobile menu on Escape ───────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        if (menuToggle) menuToggle.classList.remove('open');
        if (navbar)     navbar.classList.remove('menu-open');
      }
      if (chatOpen) {
        toggleChat();
      }
    }
  });

  /* ── Smooth hover tilt on service images (desktop only) ─── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var imgFrames = document.querySelectorAll('.img-frame');

    imgFrames.forEach(function (frame) {
      frame.addEventListener('mousemove', function (e) {
        var rect = frame.getBoundingClientRect();
        var x    = (e.clientX - rect.left) / rect.width  - 0.5;
        var y    = (e.clientY - rect.top)  / rect.height - 0.5;

        frame.style.transform = 'perspective(800px) rotateY(' + (x * 3) + 'deg) rotateX(' + (-y * 3) + 'deg)';
      });

      frame.addEventListener('mouseleave', function () {
        frame.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
      });
    });
  }

})();