document.addEventListener('DOMContentLoaded', function () {
  const yearTarget = document.getElementById('year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('#menu a, .marca');
  let isFullpageActive = false;

  function toggleNavSolid(isSolid) {
    if (!nav) {
      return;
    }
    nav.classList[isSolid ? 'add' : 'remove']('nav-solid');
  }

  function fallbackNavWatcher() {
    if (isFullpageActive) {
      return;
    }
    toggleNavSolid(window.scrollY > 80);
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var href = this.getAttribute('href');
      if (!href || href.charAt(0) !== '#') {
        return;
      }
      var anchor = href.replace('#', '');
      if (anchor && typeof fullpage_api !== 'undefined' && isFullpageActive) {
        event.preventDefault();
        fullpage_api.moveTo(anchor);
      }
    });
  });

  const fullpageContainer = document.querySelector('#fullpage');
  if (!fullpageContainer || typeof fullpage === 'undefined') {
    window.addEventListener('scroll', fallbackNavWatcher, { passive: true });
    fallbackNavWatcher();
    return;
  }

  const fullpageOptions = {
    licenseKey: 'gplv3-license',
    autoScrolling: true,
    fitToSection: true,
    scrollingSpeed: 700,
    easingcss3: 'cubic-bezier(0.83, 0, 0.17, 1)',
    css3: true,
    menu: '#menu',
    anchors: ['home', 'about', 'papers', 'insights', 'tutorials', 'contact'],
    navigation: true,
    navigationPosition: 'right',
    navigationTooltips: ['Home', 'About', 'Papers', 'Blogs', 'Tutorials', 'Contact'],
    showActiveTooltip: true,
    sectionSelector: '.section',
    scrollOverflow: false,
    credits: { enabled: false },
    responsiveWidth: 940,
    responsiveHeight: 680,
    lazyLoading: true,
    keyboardScrolling: true,
    controlArrows: false,
    afterLoad: function (origin, destination) {
      toggleNavSolid(destination.anchor !== 'home');
    }
  };

  function shouldEnableFullpage() {
    return window.innerWidth >= 940 && window.innerHeight >= 680;
  }

  function enableFullpage() {
    if (isFullpageActive) {
      return;
    }
    new fullpage('#fullpage', fullpageOptions);
    isFullpageActive = true;
    toggleNavSolid(false);
  }

  function disableFullpage() {
    if (!isFullpageActive || typeof fullpage_api === 'undefined') {
      return;
    }
    fullpage_api.destroy('all');
    isFullpageActive = false;
    fallbackNavWatcher();
  }

  function handleResponsive() {
    if (shouldEnableFullpage()) {
      enableFullpage();
    } else {
      disableFullpage();
    }
  }

  handleResponsive();

  let resizeTimer;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResponsive, 150);
    },
    { passive: true }
  );

  window.addEventListener(
    'orientationchange',
    function () {
      setTimeout(handleResponsive, 150);
    },
    { passive: true }
  );

  window.addEventListener('scroll', fallbackNavWatcher, { passive: true });
});
