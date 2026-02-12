// Global logic: navigation, scroll effects, mobile menu

const MOBILE_MENU_BREAKPOINT = 900;
const SECTION_FILM_FLASH_CLASS = 'is-section-film-flash';
const SECTION_FILM_FLASH_DURATION_MS = 300;
let sectionFilmFlashTimeout = 0;

function getScrollableSections() {
  return Array.from(document.querySelectorAll('main > section, section.pricing-section'));
}

function triggerSectionFilmFlash() {
  if (document.body.classList.contains('gallery-page')) return;

  const overlay = document.querySelector('.scroll-fade-overlay');
  if (!overlay) return;

  document.body.classList.remove(SECTION_FILM_FLASH_CLASS);
  void overlay.offsetWidth;
  document.body.classList.add(SECTION_FILM_FLASH_CLASS);

  if (sectionFilmFlashTimeout) {
    window.clearTimeout(sectionFilmFlashTimeout);
  }

  sectionFilmFlashTimeout = window.setTimeout(() => {
    document.body.classList.remove(SECTION_FILM_FLASH_CLASS);
    sectionFilmFlashTimeout = 0;
  }, SECTION_FILM_FLASH_DURATION_MS + 32);
}

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

  const isMobileViewport = window.matchMedia('(max-width: 600px)').matches;
  const viewportCenterRatio = isMobileViewport ? 0.58 : 0.45;
  const maxDistanceRatio = isMobileViewport ? 0.68 : 0.45;
  const viewportCenter = window.innerHeight * viewportCenterRatio + headerHeight / 2;
  const maxDistance = window.innerHeight * maxDistanceRatio;

  const heroMotto = document.querySelector('.hero-motto');
  const introSection = document.querySelector('.intro-section');
  const indexImages = document.querySelectorAll('body:not(.gallery-page) .image-wrapper img');
  const indexTexts = document.querySelectorAll('body:not(.gallery-page) .scroll-text:not(.hero-motto)');
  const navSections = getScrollableSections();
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
    const opacity = 0.28 + (1 - progress) * 0.72;
    img.style.opacity = opacity.toFixed(3);
    img.style.transform = 'none';
  });

  indexTexts.forEach(text => {
    const rect = text.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);
    const scale = 0.96 + (1 - progress) * 0.04;
    const opacity = 0.2 + (1 - progress) * 0.8;
    const isPricingCard = text.classList.contains('pricing-card');
    text.style.opacity = opacity.toFixed(3);
    if (isPricingCard) {
      text.style.transform = '';
    } else {
      text.style.transform = `scale(${scale.toFixed(3)})`;
    }
  });

  if (navLinks.length && navSections.length) {
    if (introSection) {
      const introRect = introSection.getBoundingClientRect();
      const introCenter = introRect.top + introRect.height / 2;
      const introDistance = Math.abs(introCenter - viewportCenter);
      const introInfluenceRadius = window.innerHeight * 0.42;

      if (introDistance <= introInfluenceRadius) {
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#home');
        });
        return;
      }
    }

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
      const activeHash = activeId ? `#${activeId}` : '#home';
      navLinks.forEach(link => {
        link.classList.toggle('is-active', activeHash && link.getAttribute('href') === activeHash);
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

  const supportsWebp = (() => {
    try {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    } catch (error) {
      return false;
    }
  })();

  const extension = supportsWebp ? 'webp' : 'jpg';
  const imagesToPreload = [];
  const addSeries = (folder, prefix, count) => {
    for (let i = 1; i <= count; i++) {
      imagesToPreload.push(
        `./images/gallery/${folder}/${prefix}-${String(i).padStart(2, '0')}.${extension}`
      );
    }
  };

  addSeries('portrait', 'portrait', 12);
  addSeries('lifestyle', 'lifestyle', 12);
  addSeries('street', 'street', 21);
  addSeries('still-life', 'still-life', 6);

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveDataEnabled = Boolean(connection && connection.saveData);
  const effectiveType = connection && connection.effectiveType ? connection.effectiveType : '';
  const onSlowNetwork = /(^|[^a-z])2g/.test(effectiveType) || effectiveType === 'slow-2g';
  const preloadLimit = saveDataEnabled ? 0 : onSlowNetwork ? 12 : imagesToPreload.length;
  if (preloadLimit === 0) return;

  const run = () => {
    const urls = imagesToPreload.slice(0, preloadLimit);
    let index = 0;
    const MAX_CONCURRENT = 2;
    let inFlight = 0;

    const pump = () => {
      while (inFlight < MAX_CONCURRENT && index < urls.length) {
        const img = new Image();
        const src = urls[index++];
        inFlight += 1;

        const done = () => {
          inFlight -= 1;
          if (index < urls.length) {
            window.setTimeout(pump, 16);
          }
        };

        img.onload = done;
        img.onerror = done;
        img.src = src;
      }
    };

    pump();
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 1800 });
  } else {
    setTimeout(run, 300);
  }
}

let anchorScrollAnimationFrame = 0;
function animateScrollToTop(targetTop, durationMs = 920, onDone = null) {
  const startTop = window.scrollY;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 1) {
    if (typeof onDone === 'function') onDone();
    return;
  }

  if (anchorScrollAnimationFrame) {
    cancelAnimationFrame(anchorScrollAnimationFrame);
    anchorScrollAnimationFrame = 0;
  }

  const startTime = performance.now();
  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const step = now => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startTop + delta * eased);

    if (progress < 1) {
      anchorScrollAnimationFrame = requestAnimationFrame(step);
      return;
    }

    anchorScrollAnimationFrame = 0;
    if (typeof onDone === 'function') onDone();
  };

  anchorScrollAnimationFrame = requestAnimationFrame(step);
}

function getCenteredSectionScrollTop(section, sections = []) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const sectionIndex = sections.indexOf(section);
  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  ) || 0;
  const footerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--footer-height')
  ) || 0;
  const usableViewportHeight = Math.max(window.innerHeight - headerHeight - footerHeight, 0);
  const visibleViewportCenterOffset = headerHeight + usableViewportHeight / 2;

  if (sectionIndex === 0) return 0;

  const rect = section.getBoundingClientRect();
  const sectionCenter = window.scrollY + rect.top + rect.height / 2;
  const desiredTop = sectionCenter - visibleViewportCenterOffset;
  return Math.min(Math.max(desiredTop, 0), maxScroll);
}

function updateIndexEndSpacer() {
  if (document.body.classList.contains('gallery-page')) return;

  const sections = getScrollableSections();
  if (!sections.length) {
    document.documentElement.style.setProperty('--index-end-spacer', '0px');
    return;
  }

  const lastSection = sections[sections.length - 1];
  const currentSpacer = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--index-end-spacer')
  ) || 0;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const baseMaxScroll = Math.max(0, maxScroll - currentSpacer);

  const headerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  ) || 0;
  const footerHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--footer-height')
  ) || 0;
  const usableViewportHeight = Math.max(window.innerHeight - headerHeight - footerHeight, 0);
  const visibleViewportCenterOffset = headerHeight + usableViewportHeight / 2;

  const rect = lastSection.getBoundingClientRect();
  const sectionCenter = window.scrollY + rect.top + rect.height / 2;
  const desiredTop = Math.max(sectionCenter - visibleViewportCenterOffset, 0);
  const neededSpacer = Math.max(desiredTop - baseMaxScroll, 0);

  document.documentElement.style.setProperty('--index-end-spacer', `${Math.round(neededSpacer)}px`);
}

function setupSmoothInPageAnchors() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const url = new URL(link.getAttribute('href'), window.location.href);
    const isSamePage = url.pathname === window.location.pathname && url.origin === window.location.origin;
    if (!isSamePage || !url.hash || url.hash.length < 2) return;

    const target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    closeMobileMenu();

    const sections = getScrollableSections();
    triggerSectionFilmFlash();
    animateScrollToTop(getCenteredSectionScrollTop(target, sections));
    history.pushState(null, '', url.hash);
  });
}

function applyAlternatingContentLayout() {
  const blocks = Array.from(document.querySelectorAll('.content-section .content-block')).filter(
    block => block.querySelector('.image-wrapper') && block.querySelector('.text-wrapper')
  );

  blocks.forEach((block, index) => {
    block.classList.toggle('reverse', index % 2 === 1);
  });
}

function setupPricingCards() {
  const cards = Array.from(document.querySelectorAll('.pricing-card[data-mailto-subject]'));
  if (!cards.length) return;

  cards.forEach(card => {
    const subject = card.getAttribute('data-mailto-subject') || '';
    const packageName = card.querySelector('h3')?.textContent?.trim() || 'Csomag';
    const body = [
      'Szia Lőrinc,',
      '',
      `A(z) "${packageName}" csomaggal kapcsolatban érdeklődnék.`,
      '',
      'Tervezett dátum:',
      'Helyszín:',
      'Rövid leírás / elképzelés:',
      '',
      'Köszönöm!'
    ].join('\n');
    const mailtoHref = `mailto:hudacsek.lorinc@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const openMail = () => {
      window.location.href = mailtoHref;
    };

    card.addEventListener('click', e => {
      if (e.target.closest('.pricing-phone-link')) return;
      openMail();
    });

    card.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openMail();
    });
  });

  document.querySelectorAll('.pricing-phone-link').forEach(link => {
    link.addEventListener('click', e => {
      e.stopPropagation();
    });
    link.addEventListener('keydown', e => {
      e.stopPropagation();
    });
  });
}

let sectionStepScrollInitialized = false;
function setupSectionStepScroll() {
  if (document.body.classList.contains('gallery-page')) return;
  if (sectionStepScrollInitialized) return;

  const sections = getScrollableSections();
  if (sections.length < 2) return;
  sectionStepScrollInitialized = true;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCROLL_DURATION_MS = prefersReducedMotion ? 1320 : 1320;
  const LOCK_MS = SCROLL_DURATION_MS + 80;
  const MIN_DELTA = 4;
  let isLocked = false;
  let animationFrameId = 0;

  const clampScrollTop = value => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(value, 0), maxScroll);
  };

  const getSectionCenter = section => {
    const rect = section.getBoundingClientRect();
    return window.scrollY + rect.top + rect.height / 2;
  };

  const getClosestSectionIndex = () => {
    const viewportCenter = getViewportCenter();
    let closestIndex = 0;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {
      const distance = Math.abs(getSectionCenter(section) - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const getViewportCenter = () => {
    const headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height')
    ) || 0;
    const footerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--footer-height')
    ) || 0;
    const usableViewportHeight = Math.max(window.innerHeight - headerHeight - footerHeight, 0);
    return window.scrollY + headerHeight + usableViewportHeight / 2;
  };

  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const animateScrollTo = targetTop => {
    const startTop = window.scrollY;
    const delta = targetTop - startTop;
    if (Math.abs(delta) < 1) return;

    const startTime = performance.now();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const step = now => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startTop + delta * eased);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        animationFrameId = 0;
      }
    };

    animationFrameId = requestAnimationFrame(step);
  };

  const scrollSectionToCenter = section => {
    const targetTop = clampScrollTop(getCenteredSectionScrollTop(section, sections));
    animateScrollTo(targetTop);
  };

  window.addEventListener(
    'wheel',
    e => {
      if (document.body.classList.contains('menu-open')) return;
      if (e.ctrlKey) return;

      const delta = Math.abs(e.deltaY);
      if (isLocked) {
        if (delta >= MIN_DELTA) e.preventDefault();
        return;
      }
      if (delta < MIN_DELTA) return;

      const currentIndex = getClosestSectionIndex();
      const direction = e.deltaY > 0 ? 1 : -1;

      const targetIndex = Math.min(Math.max(currentIndex + direction, 0), sections.length - 1);

      if (targetIndex === currentIndex) return;

      e.preventDefault();
      isLocked = true;
      triggerSectionFilmFlash();
      scrollSectionToCenter(sections[targetIndex]);

      window.setTimeout(() => {
        isLocked = false;
      }, LOCK_MS);
    },
    { passive: false }
  );
}

window.addEventListener('scroll', scheduleIndexScrollEffects, { passive: true });
window.addEventListener('resize', () => {
  updateIndexEndSpacer();
  updateIndexScrollEffects();
});
document.addEventListener('DOMContentLoaded', preloadGalleryImages);
document.addEventListener('DOMContentLoaded', applyAlternatingContentLayout);
document.addEventListener('DOMContentLoaded', setupSectionStepScroll);
document.addEventListener('DOMContentLoaded', setupPricingCards);

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  if (link.closest('.main-nav')) closeMobileMenu();
});

window.addEventListener('pageshow', () => {
  const main = document.querySelector('main');
  if (main) main.classList.remove('is-fading');
  updateIndexEndSpacer();
  updateIndexScrollEffects();
});

setupMobileMenu();
setupSmoothInPageAnchors();
applyAlternatingContentLayout();
updateIndexEndSpacer();
updateIndexScrollEffects();
setupSectionStepScroll();
setupPricingCards();
