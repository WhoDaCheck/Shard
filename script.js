/* =================================================
   SCROLL-BASED VISUAL HIERARCHY + NAV SCROLL-SPY
   (INDEX OLDAL)
   ================================================= */

const heroMotto = document.querySelector('.hero-motto');

const indexImages = document.querySelectorAll(
  'body:not(.gallery-page) .image-wrapper img'
);

const indexTexts = document.querySelectorAll(
  'body:not(.gallery-page) .scroll-text'
);

/* ================================
   SECTION DEFINITIONS
   ================================ */

/* NAV csak az ID-val rendelkező szekciókat látja */
const navSections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

/* SCROLL-logika: ID + data-scroll-section */
const scrollSections = document.querySelectorAll(
  'main section[id], main section[data-scroll-section]'
);

/* =================================================
   CORE SCROLL LOGIC
   ================================================= */

function updateIndexScrollEffects() {
  if (document.body.classList.contains('gallery-page')) return;

  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')
  );

  const viewportCenter =
    window.innerHeight * 0.45 + headerHeight / 2;

  const maxDistance = window.innerHeight * 0.45;

  /* ===== HERO ===== */
  if (heroMotto) {
    const rect = heroMotto.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    heroMotto.style.transform = `scale(${1 - progress * 0.14})`;
    heroMotto.style.opacity = 1 - progress * 0.65;
  }

  /* ===== IMAGES (index) ===== */
  indexImages.forEach(img => {
    const rect = img.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    img.style.opacity = 0.25 + (1 - progress) * 0.75;
  });

  /* ===== TEXT BLOCKS (index + intro) ===== */
  indexTexts.forEach(text => {
    const rect = text.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    text.style.opacity = 0.25 + (1 - progress) * 0.75;
  });

  /* ===== NAV SCROLL-SPY (CSAK ID-S SZEKCIÓK) ===== */
  if (navLinks.length && navSections.length) {
    let closestSection = null;
    let closestDistance = Infinity;

    navSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSection = section;
      }
    });

    if (closestSection) {
      const activeId = closestSection.getAttribute('id');

      navLinks.forEach(link => {
        link.classList.toggle(
          'is-active',
          link.getAttribute('href') === `#${activeId}`
        );
      });
    }
  }
}

/* =================================================
   LIGHTBOX (gallery.html)
   ================================================= */

const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lightboxImg = lightbox.querySelector('img');

  document
    .querySelectorAll('.mosaic-grid img')
    .forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    });

  lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  });
}

/* =================================================
   GLOBAL LISTENERS
   ================================================= */

window.addEventListener(
  'scroll',
  () => requestAnimationFrame(updateIndexScrollEffects),
  { passive: true }
);

window.addEventListener('resize', updateIndexScrollEffects);

/* INIT */
updateIndexScrollEffects();
