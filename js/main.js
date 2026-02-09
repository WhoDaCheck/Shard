// Global logic: navigation, scroll effects, mobile menu

const MOBILE_MENU_BREAKPOINT = 900;

function closeMobileMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;
  header.classList.remove('is-menu-open');
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Menu megnyitasa');
}

function setupMobileMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.main-nav');
  if (!header || !toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const willOpen = !header.classList.contains('is-menu-open');
    header.classList.toggle('is-menu-open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
    toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', willOpen ? 'Menu bezarasa' : 'Menu megnyitasa');
  });

  menu.addEventListener('click', e => {
    if (e.target.closest('a')) closeMobileMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
      closeMobileMenu();
    }
  });
}

function updateIndexScrollEffects() {
  if (document.body.classList.contains('gallery-page')) return;

  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  );

  const viewportCenter = window.innerHeight * 0.45 + headerHeight / 2;
  const maxDistance = window.innerHeight * 0.45;

  const heroMotto = document.querySelector('.hero-motto');
  const indexImages = document.querySelectorAll('body:not(.gallery-page) .image-wrapper img');
  const indexTexts = document.querySelectorAll('body:not(.gallery-page) .scroll-text:not(.hero-motto)');
  const navSections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

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
    const scale = 0.94 + (1 - progress) * 0.06;
    img.style.opacity = '1';
    img.style.transform = `scale(${scale.toFixed(3)})`;
  });

  indexTexts.forEach(text => {
    const rect = text.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);
    const scale = 0.96 + (1 - progress) * 0.04;
    text.style.opacity = '1';
    text.style.transform = `scale(${scale.toFixed(3)})`;
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
        link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
      });
    }
  }
}

let indexScrollScheduled = false;
function scheduleIndexScrollEffects() {
  if (indexScrollScheduled) return;
  indexScrollScheduled = true;
  requestAnimationFrame(() => {
    indexScrollScheduled = false;
    updateIndexScrollEffects();
  });
}

function preloadGalleryImages() {
  if (document.body.classList.contains('gallery-page')) return;

  const imagesToPreload = [];
  for (let i = 1; i <= 10; i++) {
    imagesToPreload.push(`./images/gallery/swipe-portrait/sp${i}.jpg`);
  }

  const run = () => {
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}

function applyAlternatingContentLayout() {
  const blocks = Array.from(document.querySelectorAll('.content-section .content-block')).filter(
    block => block.querySelector('.image-wrapper') && block.querySelector('.text-wrapper')
  );

  blocks.forEach((block, index) => {
    block.classList.toggle('reverse', index % 2 === 1);
  });
}

window.addEventListener('scroll', scheduleIndexScrollEffects, { passive: true });
window.addEventListener('resize', updateIndexScrollEffects);
document.addEventListener('DOMContentLoaded', preloadGalleryImages);
document.addEventListener('DOMContentLoaded', applyAlternatingContentLayout);

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  if (link.closest('.main-nav')) closeMobileMenu();
});

window.addEventListener('pageshow', () => {
  const main = document.querySelector('main');
  if (main) main.classList.remove('is-fading');
});

setupMobileMenu();
applyAlternatingContentLayout();
updateIndexScrollEffects();
