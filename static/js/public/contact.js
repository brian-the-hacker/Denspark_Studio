/* ============================================================
   DENSPARK STUDIO — contact.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Preloader ─────────────────────────────────────── */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 500);
    });
    setTimeout(() => preloader.classList.add('hidden'), 3000);
  }

  /* ── Custom Cursor ─────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });

    const animFollower = () => {
      fx += (mx - fx) * 0.1;
      fy += (my - fy) * 0.1;
      follower.style.left = fx + 'px';
      follower.style.top  = fy + 'px';
      requestAnimationFrame(animFollower);
    };
    animFollower();

    const hoverEls = document.querySelectorAll(
      'a, button, input, select, textarea, .faq-question, .strip-item'
    );
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ── Navbar ─────────────────────────────────────────── */
  (function initNavbar() {
    var navbar                = document.getElementById('navbar');
    var menuToggle            = document.getElementById('menuToggle');
    var mobileMenu            = document.getElementById('mobileMenu');
    var desktopServicesMenu   = document.getElementById('desktopServicesMenu');
    var desktopServicesToggle = document.getElementById('desktopServicesToggle');
    var mobileServicesItem    = document.getElementById('mobileServicesItem');
    var mobileServicesToggle  = document.getElementById('mobileServicesToggle');

    function onScroll() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

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

    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    function closeMegaMenu() {
      if (desktopServicesMenu) desktopServicesMenu.classList.remove('open');
    }

    if (desktopServicesToggle) {
      desktopServicesToggle.addEventListener('click', function (e) {
        if (window.innerWidth > 900) {
          e.preventDefault();
          e.stopPropagation();
          var isOpen = desktopServicesMenu && desktopServicesMenu.classList.contains('open');
          isOpen ? closeMegaMenu() : desktopServicesMenu.classList.add('open');
        }
      });
    }

    if (mobileServicesToggle && mobileServicesItem) {
      mobileServicesToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileServicesItem.classList.toggle('open');
        mobileServicesToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    document.addEventListener('click', function (e) {
      if (desktopServicesMenu && !desktopServicesMenu.contains(e.target)) {
        closeMegaMenu();
      }
      if (navbar && !navbar.contains(e.target)) {
        closeMobileMenu();
      }
    });

    window.addEventListener('scroll', closeMegaMenu, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeMegaMenu();
      }
    });
  }());

  /* ── Scroll Reveal ─────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => ro.observe(el));
  }

  /* ── FAQ Accordion ─────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ── Contact Form ───────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn      = contactForm.querySelector('.btn-submit');
      const origHTML = btn.innerHTML;

      const prevErr = contactForm.querySelector('.form-submit-error');
      if (prevErr) prevErr.remove();

      btn.classList.add('loading');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:    contactForm.querySelector('#name').value.trim(),
            phone:   contactForm.querySelector('#phone').value.trim(),
            email:   contactForm.querySelector('#email').value.trim(),
            service: contactForm.querySelector('#service').value,
            message: contactForm.querySelector('#message').value.trim(),
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          btn.classList.remove('loading');
          btn.classList.add('success');
          btn.disabled = false;
          btn.innerHTML = '✓ Message Sent!';
          contactForm.reset();
          setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = origHTML;
          }, 4000);
        } else {
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

      } catch (err) {
        btn.classList.remove('loading');
        btn.classList.add('error');
        btn.disabled = false;
        btn.textContent = 'Failed — Try Again';

        const errEl = document.createElement('p');
        errEl.className = 'form-submit-error';
        errEl.style.cssText = 'color:#dc2626;font-size:0.83rem;margin-top:0.75rem;text-align:center;';
        errEl.textContent = err.message || 'Network error. Please check your connection.';
        btn.insertAdjacentElement('afterend', errEl);

        setTimeout(() => {
          btn.classList.remove('error');
          btn.innerHTML = origHTML;
          btn.disabled  = false;
        }, 3000);
      }
    });
  }

  /* ── Booking Form ───────────────────────────────────── */
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = bookingForm.querySelector('.btn-submit');
      const btnText = btn.querySelector('.btn-text');
      const origText = btnText.textContent;

      const prevErr = bookingForm.querySelector('.form-submit-error');
      if (prevErr) prevErr.remove();

      btn.classList.add('loading');
      btn.disabled = true;
      btnText.textContent = 'Sending…';

      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: bookingForm.querySelector('#first_name').value.trim(),
            last_name:  bookingForm.querySelector('#last_name').value.trim(),
            email:      bookingForm.querySelector('#email').value.trim(),
            phone:      bookingForm.querySelector('#phone').value.trim(),
            service:    bookingForm.querySelector('#service').value,
            date:       bookingForm.querySelector('#date').value.trim(),
            message:    bookingForm.querySelector('#message').value.trim(),
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          btn.classList.remove('loading');
          btn.classList.add('success');
          btn.disabled = false;
          btnText.textContent = '✓ Booking Sent!';
          bookingForm.reset();
          document.getElementById('formSuccess')?.classList.add('visible');
          setTimeout(() => {
            btn.classList.remove('success');
            btnText.textContent = origText;
            document.getElementById('formSuccess')?.classList.remove('visible');
          }, 4000);
        } else {
          throw new Error(data.error || 'Something went wrong.');
        }

      } catch (err) {
        btn.classList.remove('loading');
        btn.disabled = false;
        btnText.textContent = 'Failed — Try Again';

        const errEl = document.createElement('p');
        errEl.className = 'form-submit-error';
        errEl.style.cssText = 'color:#dc2626;font-size:.83rem;margin-top:.75rem;text-align:center;';
        errEl.textContent = err.message || 'Network error. Please check your connection.';
        btn.insertAdjacentElement('afterend', errEl);

        setTimeout(() => {
          btnText.textContent = origText;
          btn.disabled = false;
        }, 3000);
      }
    });
  }

  /* ── Input focus label lift ─────────────────────────── */
  document.querySelectorAll('input, select, textarea').forEach(el => {
    const update = () => el.closest('.form-group')?.classList.toggle('filled', el.value.length > 0);
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    update();
  });

  /* ── Smooth scroll for "Book Now" anchor ────────────── */
  document.querySelectorAll('a[href="#booking-form"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById('booking-form');
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Services dropdown ──────────────────────────────── */
  const servicesMenu   = document.getElementById('servicesMenu');
  const servicesToggle = document.getElementById('servicesToggle');

  if (servicesMenu && servicesToggle) {
    servicesToggle.addEventListener('click', function (e) {
      e.preventDefault();
      servicesMenu.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!servicesMenu.contains(e.target)) {
        servicesMenu.classList.remove('open');
      }
    });

    window.addEventListener('scroll', () => {
      servicesMenu.classList.remove('open');
    });
  }

  /* ── Contact strip hover ────────────────────────────── */
  document.querySelectorAll('a.strip-item').forEach(item => {
    item.addEventListener('mouseenter', function () {
      this.style.transition = 'background 0.25s ease';
    });
  });

  /* ── Marquee pause on hover ─────────────────────────── */
  const marqueeWrap = document.querySelector('.marquee-wrap');
  if (marqueeWrap) {
    marqueeWrap.addEventListener('mouseenter', () => {
      marqueeWrap.querySelectorAll('.marquee-content').forEach(el => {
        el.style.animationPlayState = 'paused';
      });
    });
    marqueeWrap.addEventListener('mouseleave', () => {
      marqueeWrap.querySelectorAll('.marquee-content').forEach(el => {
        el.style.animationPlayState = 'running';
      });
    });
  }

  /* ── Footer social hover ────────────────────────────── */
  document.querySelectorAll('.footer-social a, .social-links a').forEach(a => {
    a.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

}); // end DOMContentLoaded