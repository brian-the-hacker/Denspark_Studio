/**
 * services-carousel.js
 * ─────────────────────────────────────────────────────────────
 * Smooth crossfade carousel for each .sv-block on services page.
 * Fixes applied:
 *  - Hover pause/resume uses a flag instead of repeated setInterval
 *    calls, preventing timer drift and ghost intervals.
 *  - mouseleave handler correctly restarts only when the pointer
 *    fully leaves the image side (not every child boundary).
 *  - goTo() is idempotent — clicking the already-active dot is a no-op.
 *  - startTimer() clears before setting to guarantee a single interval.
 *  - Touch swipe support added for mobile users.
 *  - Works whether script is in <head> or before </body>.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  var INTERVAL = 4000; // ms between auto-advances

  function initCarousels() {
    document.querySelectorAll('.sv-block').forEach(function (block) {
      var slides  = block.querySelectorAll('.sv-slide');
      var dots    = block.querySelectorAll('.sv-dot-btn');
      var imgWrap = block.querySelector('.sv-img-wrap');

      if (!slides.length) return;

      var current  = 0;
      var timer    = null;
      var paused   = false;
      var touchStartX = 0;

      // ── Core: jump to a specific slide index ─────────────────
      function goTo(index) {
        var next = (index + slides.length) % slides.length;
        if (next === current) return; // already there, skip

        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');

        current = next;

        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
      }

      function advance() { goTo(current + 1); }

      // ── Timer helpers ─────────────────────────────────────────
      function startTimer() {
        clearInterval(timer);
        if (!paused) {
          timer = setInterval(advance, INTERVAL);
        }
      }

      function stopTimer() {
        clearInterval(timer);
        timer = null;
      }

      // ── Dot clicks ────────────────────────────────────────────
      dots.forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation(); // don't also trigger imgWrap click
          goTo(parseInt(dot.getAttribute('data-index'), 10));
          startTimer();
        });
      });

      // ── Image area click → next slide ─────────────────────────
      if (imgWrap) {
        imgWrap.addEventListener('click', function () {
          advance();
          startTimer();
        });
      }

      // ── Hover: pause on the image side only ───────────────────
      // We attach to imgWrap so hovering the text side doesn't pause.
      if (imgWrap) {
        imgWrap.addEventListener('mouseenter', function () {
          paused = true;
          stopTimer();
        });

        imgWrap.addEventListener('mouseleave', function () {
          paused = false;
          startTimer();
        });
      }

      // ── Touch swipe support ───────────────────────────────────
      if (imgWrap) {
        imgWrap.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        imgWrap.addEventListener('touchend', function (e) {
          var dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 40) {           // 40 px swipe threshold
            goTo(dx < 0 ? current + 1 : current - 1);
            startTimer();
          }
        }, { passive: true });
      }

      // ── Keyboard: left/right arrows when block is focused ─────
      block.setAttribute('tabindex', '0');
      block.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { advance();            startTimer(); }
        if (e.key === 'ArrowLeft')  { goTo(current - 1);   startTimer(); }
      });

      // ── Pause when tab is hidden, resume when visible ─────────
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          stopTimer();
        } else if (!paused) {
          startTimer();
        }
      });

      // ── Kick off ──────────────────────────────────────────────
      startTimer();
    });
  }

  // Wait for DOM — works whether script is in <head> or before </body>
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }

}());