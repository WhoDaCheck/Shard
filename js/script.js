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

const navSections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

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

  if (heroMotto) {
    const rect = heroMotto.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    heroMotto.style.transform = `scale(${1 - progress * 0.14})`;
    heroMotto.style.opacity = 1 - progress * 0.65;
  }

  indexImages.forEach(img => {
    const rect = img.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    img.style.opacity = 0.25 + (1 - progress) * 0.75;
  });

  indexTexts.forEach(text => {
    const rect = text.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);

    text.style.opacity = 0.25 + (1 - progress) * 0.75;
  });

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
   LIGHTBOX – NAV + PRELOAD + FADE + PROGRESS
   ================================================= */

const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lightboxImg = lightbox.querySelector('img');
  const images = Array.from(document.querySelectorAll('.mosaic-grid img'));
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const progressBar = lightbox.querySelector('.lightbox-progress span');

  let currentIndex = 0;

  function preload(index) {
    if (images[index]) {
      const img = new Image();
      img.src = images[index].src;
    }
  }

  function updateProgress() {
    const percent = ((currentIndex + 1) / images.length) * 100;
    progressBar.style.width = `${percent}%`;
  }

  function showImage(index) {
    if (!images[index]) return;

    lightboxImg.style.opacity = 0;

    setTimeout(() => {
      currentIndex = index;
      lightboxImg.src = images[index].src;
      lightboxImg.style.opacity = 1;

      updateProgress();
      preload(index + 1);
      preload(index - 1);
    }, 220);
  }

  images.forEach((img, i) => {
    img.addEventListener('click', () => {
      currentIndex = i;
      lightboxImg.src = img.src;
      lightbox.classList.add('is-visible');
      document.body.style.overflow = 'hidden';

      updateProgress();
      preload(i + 1);
      preload(i - 1);
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    showImage((currentIndex - 1 + images.length) % images.length);
  });

  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    showImage((currentIndex + 1) % images.length);
  });

  lightbox.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-visible')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight')
      showImage((currentIndex + 1) % images.length);
    if (e.key === 'ArrowLeft')
      showImage((currentIndex - 1 + images.length) % images.length);
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
