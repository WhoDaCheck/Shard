// Globális logika: navigáció, scroll, header, index oldali effektek

function updateIndexScrollEffects() {
  if (document.body.classList.contains('gallery-page')) return;

  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')
  );

  const viewportCenter =
    window.innerHeight * 0.45 + headerHeight / 2;

  const maxDistance = window.innerHeight * 0.45;

  const heroMotto = document.querySelector('.hero-motto');
  const indexImages = document.querySelectorAll('body:not(.gallery-page) .image-wrapper img');
  const indexTexts = document.querySelectorAll('body:not(.gallery-page) .scroll-text');
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

let indexScrollScheduled = false;
function scheduleIndexScrollEffects() {
  if (indexScrollScheduled) return;
  indexScrollScheduled = true;
  requestAnimationFrame(() => {
    indexScrollScheduled = false;
    updateIndexScrollEffects();
  });
}

window.addEventListener(
  'scroll',
  scheduleIndexScrollEffects,
  { passive: true }
);
window.addEventListener('resize', updateIndexScrollEffects);
updateIndexScrollEffects();

// Index oldal: galéria első képeinek előtöltése a gyorsabb élményért
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

document.addEventListener('DOMContentLoaded', preloadGalleryImages);

// ===========================
// SPA-szerű navigáció (fade + fetch)
// ===========================

const PAGE_FADE_MS = 350;
let isNavigating = false;

function setNavActiveForPage(pathname) {
  const navLinks = document.querySelectorAll('.main-nav a');
  navLinks.forEach(link => link.classList.remove('is-active'));

  if (pathname.includes('gallery.html')) {
    const galleryLink = document.querySelector('.main-nav a[href*="gallery.html"]');
    if (galleryLink) galleryLink.classList.add('is-active');
  }
}

function isSpaLink(link) {
  if (!link || !link.href) return false;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  const path = url.pathname.toLowerCase();
  if (path.endsWith('/gallery.html') || path.endsWith('/index.html')) return true;
  return false;
}

function waitForFade(el) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    el.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, PAGE_FADE_MS + 50);
  });
}

function swapOptionalElement(selector, newDoc) {
  const current = document.querySelector(selector);
  const incoming = newDoc.querySelector(selector);
  if (incoming && current) {
    current.replaceWith(incoming);
  } else if (incoming && !current) {
    document.body.appendChild(incoming);
  } else if (!incoming && current) {
    current.remove();
  }
}

async function navigateTo(url, { push = true } = {}) {
  if (isNavigating) return;
  isNavigating = true;

  const main = document.querySelector('main');
  if (!main) {
    window.location.href = url;
    return;
  }

  main.classList.add('is-fading');
  const fadePromise = waitForFade(main);

  let response;
  try {
    response = await fetch(url, { credentials: 'same-origin' });
  } catch (e) {
    window.location.href = url;
    return;
  }

  if (!response || !response.ok) {
    window.location.href = url;
    return;
  }

  const html = await response.text();
  const parser = new DOMParser();
  const newDoc = parser.parseFromString(html, 'text/html');
  const newMain = newDoc.querySelector('main');
  if (!newMain) {
    window.location.href = url;
    return;
  }

  await fadePromise;

  main.innerHTML = newMain.innerHTML;
  document.title = newDoc.title;
  document.body.className = newDoc.body.className;

  swapOptionalElement('.lightbox', newDoc);
  swapOptionalElement('.scroll-fade-overlay', newDoc);

  if (push) {
    history.pushState({}, '', url);
  }

  if (document.body.classList.contains('gallery-page')) {
    if (window.initGalleryPage) window.initGalleryPage();
    setNavActiveForPage('gallery.html');
  } else {
    setNavActiveForPage('index.html');
  }

  updateIndexScrollEffects();
  preloadGalleryImages();

  const urlObj = new URL(url, window.location.href);
  if (urlObj.hash) {
    const target = document.querySelector(urlObj.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  requestAnimationFrame(() => {
    main.classList.remove('is-fading');
  });

  isNavigating = false;
}

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  if (e.defaultPrevented) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const url = new URL(link.href, window.location.href);
  if (!isSpaLink(link)) return;

  if (url.pathname === window.location.pathname && url.hash) return;

  e.preventDefault();
  navigateTo(url.href, { push: true });
});

window.addEventListener('popstate', () => {
  navigateTo(window.location.href, { push: false });
});
