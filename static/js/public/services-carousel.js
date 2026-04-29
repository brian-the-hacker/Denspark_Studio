/**
 * services-carousel.js
 * ─────────────────────────────────────────────────────────
 * Smooth crossfade carousel for each .sv-block.
 * Safe to load anywhere — waits for DOM to be ready.
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  var INTERVAL = 4000; // ms between slides

  function initCarousels() {
    document.querySelectorAll('.sv-block').forEach(function (block) {
      var slides  = block.querySelectorAll('.sv-slide');
      var dots    = block.querySelectorAll('.sv-dot-btn');
      var imgWrap = block.querySelector('.sv-img-wrap');
      var current = 0;
      var timer   = null;

      if (!slides.length) return; // nothing to carousel

      function goTo(index) {
        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
      }

      function next() { goTo(current + 1); }

      function startTimer() {
        clearInterval(timer);
        timer = setInterval(next, INTERVAL);
      }

      // Dot click → jump to slide
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          goTo(parseInt(dot.dataset.index, 10));
          startTimer();
        });
      });

      // Image click → next slide
      if (imgWrap) {
        imgWrap.addEventListener('click', function () {
          next();
          startTimer();
        });
      }

      // Hover → pause / resume
      block.addEventListener('mouseenter', function () { clearInterval(timer); });
      block.addEventListener('mouseleave', startTimer);

      startTimer();
    });
  }

  // Wait for DOM — works whether script is in <head> or before </body>
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }

})();