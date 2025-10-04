document.addEventListener('DOMContentLoaded', function () {
  const yearTarget = document.getElementById('year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  if (!document.querySelector('#fullpage') || typeof fullpage === 'undefined') {
    return;
  }

  new fullpage('#fullpage', {
    licenseKey: 'gplv3-license',
    autoScrolling: true,
    fitToSection: true,
    fitToSectionDelay: 450,
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
    scrollOverflow: true,
    credits: { enabled: false },
    responsiveWidth: 940,
    responsiveHeight: 680,
    lazyLoading: true,
    keyboardScrolling: true,
    controlArrows: false,
    afterLoad: function (origin, destination) {
      const nav = document.querySelector('.nav');
      if (!nav) {
        return;
      }
      if (destination.anchor === 'home') {
        nav.classList.remove('nav-solid');
      } else {
        nav.classList.add('nav-solid');
      }
    }
  });
});
