// what-we-do.js
document.addEventListener('DOMContentLoaded', function() {
  // Helper function - assumes you have this defined elsewhere
  // If you don't have $('id') defined, use this instead:
  const $ = (id) => document.getElementById(id);
  
  /* Mobile What We Do accordion */
  var mobileWhatWeDoItem   = $('mobileWhatWeDoItem');
  var mobileWhatWeDoToggle = $('mobileWhatWeDoToggle');
  if (mobileWhatWeDoToggle && mobileWhatWeDoItem) {
    mobileWhatWeDoToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = mobileWhatWeDoItem.classList.toggle('open');
      mobileWhatWeDoToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* Desktop What We Do dropdown */
  (function initWhatWeDo() {
    var dropWrap  = $('navDropdown');
    var dropBtn   = dropWrap && dropWrap.querySelector('.nav-drop-btn');
    var dropPanel = dropWrap && dropWrap.querySelector('.nav-drop-panel');
    if (!dropBtn || !dropPanel) return;
  
    function openDrop() {
      dropPanel.classList.add('open');
      dropBtn.setAttribute('aria-expanded', 'true');
    }
    function closeDrop() {
      dropPanel.classList.remove('open');
      dropBtn.setAttribute('aria-expanded', 'false');
    }
  
    /* Click toggles - works on touch devices where hover doesn't fire */
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropBtn.getAttribute('aria-expanded') === 'true' ? closeDrop() : openDrop();
    });
  
    /* Close when clicking anywhere outside */
    document.addEventListener('click', function (e) {
      if (dropWrap && !dropWrap.contains(e.target)) closeDrop();
    });
  
    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrop(); dropBtn.focus(); }
    });
  }());
});