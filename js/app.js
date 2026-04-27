document.addEventListener('DOMContentLoaded', function () {
  const yearTarget = document.getElementById('year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  const nav = document.querySelector('.nav');
  const menuLinks = Array.from(document.querySelectorAll('#menu a[href^="#"]'));
  const sections = menuLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  function toggleNavSolid() {
    if (!nav) {
      return;
    }
    nav.classList.toggle('nav-solid', window.scrollY > 24);
  }

  function setActiveLink(id) {
    menuLinks.forEach(function (link) {
      const item = link.closest('li');
      if (!item) {
        return;
      }
      item.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-35% 0px -50% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  window.addEventListener('scroll', toggleNavSolid, { passive: true });
  toggleNavSolid();
});
