// Global logic: navigation, scroll effects, mobile menu

const MOBILE_MENU_BREAKPOINT = 900;
const THEME_STORAGE_KEY = 'flashback-theme';

function resolveInitialTheme() {
  let storedTheme = null;
  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    storedTheme = null;
  }
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    const isDark = normalizedTheme === 'dark';
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('aria-label', isDark ? 'Vilagos mod bekapcsolasa' : 'Sotet mod bekapcsolasa');
    const lightOption = toggle.querySelector('.theme-option-light');
    const darkOption = toggle.querySelector('.theme-option-dark');
    if (lightOption) lightOption.classList.toggle('is-active', !isDark);
    if (darkOption) darkOption.classList.toggle('is-active', isDark);
  }
}

function setupThemeToggle() {
  const initialTheme = resolveInitialTheme();
  applyTheme(initialTheme);

  const contacts = document.querySelector('.header-contacts');
  if (!contacts || contacts.dataset.themeToggleReady === 'true') return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  button.innerHTML = '<span class="theme-option theme-option-light" aria-hidden="true">☀</span><span class="theme-option theme-option-dark" aria-hidden="true">☾</span>';
  contacts.prepend(button);

  button.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      // Ignore storage errors in restricted environments.
    }
    applyTheme(nextTheme);
  });

  contacts.dataset.themeToggleReady = 'true';
}

function getScrollableSections() {
  return Array.from(
    document.querySelectorAll('main > section, section.pricing-section, section.gallery-embed')
  );
}

function getLockedSections() {
  return Array.from(document.querySelectorAll('main > section, section.pricing-section'));
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

function setupHeroWordReveal() {
  if (document.body.classList.contains('gallery-page')) return;

  const heroMotto = document.querySelector('.hero-motto');
  if (!heroMotto || heroMotto.dataset.wordRevealReady === 'true') return;

  const initialDelayMs = 700;
  const lineCadenceMs = [150, 210];
  const linePauseMs = 380;
  const logoPauseMs = 120;
  const fragment = document.createDocumentFragment();
  const heroLogo = document.querySelector('.hero-logo');
  const lines = heroMotto.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let timelineCursor = initialDelayMs;

  lines.forEach((line, lineIndex) => {
    const lineEl = document.createElement('span');
    lineEl.className = `hero-line hero-line-${lineIndex + 1}`;
    const words = line.split(' ').filter(Boolean);
    const cadence = lineCadenceMs[lineIndex] ?? lineCadenceMs[lineCadenceMs.length - 1];

    words.forEach((rawWord, wordIndex) => {
      const word = document.createElement('span');
      word.className = 'hero-word';
      word.style.setProperty('--word-delay', `${timelineCursor + wordIndex * cadence}ms`);
      word.style.setProperty('--word-duration', `${lineIndex === 0 ? 900 : 1020}ms`);
      word.textContent = rawWord;
      lineEl.appendChild(word);
      if (wordIndex < words.length - 1) {
        lineEl.appendChild(document.createTextNode(' '));
      }
    });

    fragment.appendChild(lineEl);
    timelineCursor += words.length * cadence;
    if (lineIndex < lines.length - 1) {
      timelineCursor += linePauseMs;
    }
  });

  heroMotto.replaceChildren(fragment);
  heroMotto.dataset.wordRevealReady = 'true';
  heroMotto.classList.add('is-word-reveal-ready');

  // Wait for an initial paint before enabling animation classes.
  // This makes the reveal reliable on fast desktop renders too.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroMotto.classList.add('is-word-reveal-active');
      if (heroLogo) {
        heroLogo.style.setProperty('--logo-delay', `${timelineCursor + logoPauseMs}ms`);
        heroLogo.classList.add('is-reveal-active');
      }
    });
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
  const pricingSection = document.querySelector('.pricing-section');
  const indexImages = document.querySelectorAll('body:not(.gallery-page) .image-wrapper img');
  const indexTexts = document.querySelectorAll('body:not(.gallery-page) .scroll-text:not(.hero-motto)');
  const navSections = getScrollableSections();
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  const pricingTop = pricingSection ? window.scrollY + pricingSection.getBoundingClientRect().top : Infinity;
  const disableFade = window.scrollY >= pricingTop - headerHeight;

  if (heroMotto && !disableFade) {
    const rect = heroMotto.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);
    heroMotto.style.transform = 'none';
    heroMotto.style.opacity = 1 - progress * 0.65;
  } else if (heroMotto) {
    heroMotto.style.transform = 'none';
    heroMotto.style.opacity = '1';
  }

  indexImages.forEach(img => {
    if (disableFade) {
      img.style.opacity = '1';
      img.style.transform = 'none';
      return;
    }
    const rect = img.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);
    const opacity = 0.28 + (1 - progress) * 0.72;
    img.style.opacity = opacity.toFixed(3);
    img.style.transform = 'none';
  });

  indexTexts.forEach(text => {
    if (disableFade) {
      text.style.opacity = '1';
      if (!text.classList.contains('pricing-card')) {
        text.style.transform = 'none';
      }
      return;
    }
    const rect = text.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    const progress = Math.min(distance / maxDistance, 1);
    const opacity = 0.2 + (1 - progress) * 0.8;
    const isPricingCard = text.classList.contains('pricing-card');
    text.style.opacity = opacity.toFixed(3);
    if (!isPricingCard) {
      text.style.transform = 'none';
    }
  });

  if (navLinks.length && navSections.length) {
    const galleryIntro = document.getElementById('gallery-intro');
    if (galleryIntro) {
      const galleryIntroTop = window.scrollY + galleryIntro.getBoundingClientRect().top;
      const galleryActivationLine = window.scrollY + headerHeight + 8;
      if (galleryActivationLine >= galleryIntroTop) {
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#gallery-intro');
        });
        return;
      }
    }

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
      const activeHash = activeId === 'gallery' ? '#gallery-intro' : (activeId ? `#${activeId}` : '#home');
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
  let desiredTop = sectionCenter - visibleViewportCenterOffset;
  if (section.classList.contains('pricing-section')) {
    desiredTop += 120;
  }
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

    if (url.hash === '#gallery-intro') {
      e.preventDefault();
      closeMobileMenu();
      const top = window.scrollY + target.getBoundingClientRect().top;
      const offset = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0) + 12;
      animateScrollToTop(Math.max(0, top - offset));
      history.pushState(null, '', url.hash);
      return;
    }

    const lockedSections = getLockedSections();
    if (!lockedSections.includes(target)) return;
    e.preventDefault();
    closeMobileMenu();
    animateScrollToTop(getCenteredSectionScrollTop(target, lockedSections));
    history.pushState(null, '', url.hash);
  });
}

function setupPageFadeTransitions() {
  const body = document.body;
  if (!body) return;

  requestAnimationFrame(() => {
    body.classList.add('page-is-visible');
  });

  const isTransitionPath = pathname => {
    const normalized = pathname.toLowerCase();
    return (
      normalized.endsWith('/index.html') ||
      normalized.endsWith('/adatkezeles.html') ||
      normalized.endsWith('/impresszum.html') ||
      normalized === '/' ||
      normalized === ''
    );
  };

  document.addEventListener(
    'click',
    e => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      if (link.hasAttribute('download')) return;
      if ((link.getAttribute('target') || '').toLowerCase() === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!isTransitionPath(url.pathname)) return;
      if (url.href === window.location.href) return;

      e.preventDefault();
      body.classList.add('page-is-leaving');
      body.classList.remove('page-is-visible');
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 220);
    },
    true
  );
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

function setupMobileSectionCarousels() {
  if (document.body.classList.contains('gallery-page')) return;

  const carousels = Array.from(document.querySelectorAll('.mobile-carousel'));
  if (!carousels.length) return;

  const lightbox = document.getElementById('index-lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  const lightboxPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
  const lightboxNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;
  const lightboxProgress = lightbox ? lightbox.querySelector('.lightbox-progress span') : null;
  const lightboxSection = lightbox ? lightbox.querySelector('.lightbox-section') : null;
  const swipeHint = lightbox ? lightbox.querySelector('.lightbox-swipe-hint') : null;
  let activeCarouselState = null;
  let lightboxIndex = 0;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeDeltaX = 0;
  let swipeDeltaY = 0;
  let trackingSwipe = false;

  const hideSwipeHint = () => {
    if (!swipeHint) return;
    swipeHint.classList.remove('is-visible');
  };

  const maybeShowSwipeHint = () => {
    if (!swipeHint) return;
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    swipeHint.classList.add('is-visible');
    window.setTimeout(() => swipeHint.classList.remove('is-visible'), 2200);
  };

  const updateLightbox = () => {
    if (!activeCarouselState || !lightboxImg || !lightboxProgress) return;

    const total = activeCarouselState.sources.length;
    const src = activeCarouselState.sources[lightboxIndex];
    lightboxImg.src = src;
    lightboxImg.alt = `${activeCarouselState.altBase} ${lightboxIndex + 1}`;
    lightboxProgress.style.width = `${(((lightboxIndex + 1) / total) * 100).toFixed(2)}%`;
    if (lightboxSection) {
      lightboxSection.textContent = activeCarouselState.sectionTitle;
    }
  };

  const openLightbox = (carouselState, startIndex) => {
    if (!lightbox || !lightboxImg) return;
    activeCarouselState = carouselState;
    lightboxIndex = carouselState.wrap(startIndex);
    updateLightbox();
    lightbox.classList.add('is-visible');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    document.body.style.overflow = 'hidden';
    maybeShowSwipeHint();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-visible');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    document.body.style.overflow = '';
    hideSwipeHint();
    activeCarouselState = null;
  };

  const shiftLightbox = direction => {
    if (!activeCarouselState) return;
    lightboxIndex = activeCarouselState.wrap(lightboxIndex + direction);
    activeCarouselState.setIndex(lightboxIndex);
    updateLightbox();
    hideSwipeHint();
  };

  if (lightbox && lightbox.dataset.ready !== 'true') {
    lightboxPrev?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      shiftLightbox(-1);
    });

    lightboxNext?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      shiftLightbox(1);
    });

    lightbox.addEventListener('click', e => {
      if (!lightboxImg) return;
      if (e.target === lightbox || e.target === lightboxImg) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-visible')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') shiftLightbox(-1);
      if (e.key === 'ArrowRight') shiftLightbox(1);
    });

    lightboxImg?.addEventListener('touchstart', e => {
      if (!e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      swipeStartX = touch.clientX;
      swipeStartY = touch.clientY;
      swipeDeltaX = 0;
      swipeDeltaY = 0;
      trackingSwipe = true;
    }, { passive: true });

    lightboxImg?.addEventListener('touchmove', e => {
      if (!trackingSwipe || !e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      swipeDeltaX = touch.clientX - swipeStartX;
      swipeDeltaY = touch.clientY - swipeStartY;
    }, { passive: true });

    lightboxImg?.addEventListener('touchend', () => {
      if (!trackingSwipe) return;
      trackingSwipe = false;
      const absX = Math.abs(swipeDeltaX);
      const absY = Math.abs(swipeDeltaY);
      if (absX < 44 || absX <= absY) return;
      shiftLightbox(swipeDeltaX < 0 ? 1 : -1);
    }, { passive: true });

    lightboxImg?.addEventListener('touchcancel', () => {
      trackingSwipe = false;
    }, { passive: true });

    lightbox.dataset.ready = 'true';
  }

  carousels.forEach(carousel => {
    if (carousel.dataset.carouselReady === 'true') return;

    const folder = (carousel.getAttribute('data-gallery-folder') || '').trim();
    const prefix = (carousel.getAttribute('data-gallery-prefix') || '').trim();
    const altBase = (carousel.getAttribute('data-gallery-alt') || 'Fotó').trim();
    const count = Number.parseInt(carousel.getAttribute('data-gallery-count') || '0', 10);
    const track = carousel.querySelector('.mobile-carousel-track');
    const prevButton = carousel.querySelector('.mobile-carousel-prev');
    const nextButton = carousel.querySelector('.mobile-carousel-next');

    if (!folder || !prefix || !track || !Number.isFinite(count) || count < 2) return;

    const sources = Array.from({ length: count }, (_, index) => {
      const frame = String(index + 1).padStart(2, '0');
      return `./images/gallery/${folder}/${prefix}-${frame}.jpg`;
    });

    let currentIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerActive = false;
    let didSwipe = false;

    const wrappedIndex = index => {
      const size = sources.length;
      return ((index % size) + size) % size;
    };

    const sectionTitle = carousel
      .closest('.content-section')
      ?.querySelector('.section-label')
      ?.textContent?.trim() || '';

    const render = () => {
      const offsets = [-1, 0, 1];
      const fragment = document.createDocumentFragment();

      offsets.forEach(offset => {
        const imageIndex = wrappedIndex(currentIndex + offset);
        const slide = document.createElement('div');
        slide.className = 'mobile-carousel-slide';
        slide.classList.add(offset < 0 ? 'is-prev' : offset > 0 ? 'is-next' : 'is-active');
        slide.setAttribute('data-offset', String(offset));
        slide.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true');

        const img = document.createElement('img');
        img.src = sources[imageIndex];
        img.alt = `${altBase} ${imageIndex + 1}`;
        img.loading = offset === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';

        slide.appendChild(img);
        fragment.appendChild(slide);
      });

      track.replaceChildren(fragment);
      track.setAttribute('aria-label', `${altBase} ${currentIndex + 1}/${sources.length}`);
    };

    const shift = direction => {
      currentIndex = wrappedIndex(currentIndex + direction);
      render();
    };

    const carouselState = {
      sources,
      altBase,
      sectionTitle,
      wrap: wrappedIndex,
      setIndex: nextIndex => {
        currentIndex = wrappedIndex(nextIndex);
        render();
      }
    };

    prevButton?.addEventListener('click', e => {
      e.preventDefault();
      shift(-1);
    });

    nextButton?.addEventListener('click', e => {
      e.preventDefault();
      shift(1);
    });

    track.addEventListener('click', e => {
      if (didSwipe) {
        didSwipe = false;
        return;
      }
      const slide = e.target.closest('.mobile-carousel-slide');
      if (!slide) return;
      const offset = Number.parseInt(slide.getAttribute('data-offset') || '0', 10);
      if (offset === -1) {
        shift(-1);
        return;
      }
      if (offset === 1) {
        shift(1);
        return;
      }
      openLightbox(carouselState, currentIndex);
    });

    track.addEventListener('pointerdown', e => {
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerActive = true;
    });

    track.addEventListener('pointerup', e => {
      if (!pointerActive) return;
      pointerActive = false;
      const deltaX = e.clientX - pointerStartX;
      const deltaY = e.clientY - pointerStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < 26 || absX <= absY) return;
      didSwipe = true;
      shift(deltaX < 0 ? 1 : -1);
    });

    track.addEventListener('pointercancel', () => {
      pointerActive = false;
    });

    render();
    carousel.dataset.carouselReady = 'true';
  });
}

let sectionStepScrollInitialized = false;
function setupSectionStepScroll() {
  if (document.body.classList.contains('gallery-page')) return;
  if (sectionStepScrollInitialized) return;

  const sections = getLockedSections();
  if (sections.length < 2) return;
  sectionStepScrollInitialized = true;
  const gallerySection = document.querySelector('section.gallery-embed');
  const pricingSection = document.querySelector('section.pricing-section');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCROLL_DURATION_MS = prefersReducedMotion ? 1320 : 1320;
  const LOCK_MS = SCROLL_DURATION_MS + 80;
  const WHEEL_INTENT_THRESHOLD = 44;
  const WHEEL_INTENT_RESET_MS = 140;
  let isLocked = false;
  let animationFrameId = 0;
  let wheelIntent = 0;
  let wheelIntentSign = 0;
  let wheelIntentResetTimeout = 0;

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
  const normalizeWheelDelta = event => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
    return event.deltaY;
  };

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

      const deltaY = normalizeWheelDelta(e);
      const delta = Math.abs(deltaY);
      if (!delta) return;

      if (gallerySection) {
        const galleryTop = window.scrollY + gallerySection.getBoundingClientRect().top;
        const galleryBoundaryTolerance = 26;
        const isInsideGallery = window.scrollY >= galleryTop - 2;
        const isNearGalleryStart =
          window.scrollY >= galleryTop - 32 && window.scrollY <= galleryTop + 180;
        const projectedTop = window.scrollY + deltaY;
        const wouldCrossGalleryBoundaryUpward =
          deltaY < 0 && projectedTop <= galleryTop + galleryBoundaryTolerance;
        const shouldSnapBackToPricing = deltaY < 0 && (wouldCrossGalleryBoundaryUpward || isNearGalleryStart);

        if (isInsideGallery) {
          if (shouldSnapBackToPricing && pricingSection && !isLocked) {
            e.preventDefault();
            isLocked = true;
            scrollSectionToCenter(pricingSection);
            window.setTimeout(() => {
              isLocked = false;
            }, LOCK_MS);
          }
          return;
        }
      }

      if (isLocked) {
        e.preventDefault();
        return;
      }

      const direction = deltaY > 0 ? 1 : -1;
      if (wheelIntentSign !== direction) {
        wheelIntent = 0;
        wheelIntentSign = direction;
      }
      wheelIntent += deltaY;

      if (wheelIntentResetTimeout) {
        window.clearTimeout(wheelIntentResetTimeout);
      }
      wheelIntentResetTimeout = window.setTimeout(() => {
        wheelIntent = 0;
        wheelIntentSign = 0;
        wheelIntentResetTimeout = 0;
      }, WHEEL_INTENT_RESET_MS);

      if (Math.abs(wheelIntent) < WHEEL_INTENT_THRESHOLD) {
        e.preventDefault();
        return;
      }

      const currentIndex = getClosestSectionIndex();
      const targetIndex = Math.min(Math.max(currentIndex + direction, 0), sections.length - 1);

      if (targetIndex === currentIndex) return;

      e.preventDefault();
      isLocked = true;
      wheelIntent = 0;
      wheelIntentSign = 0;
      if (wheelIntentResetTimeout) {
        window.clearTimeout(wheelIntentResetTimeout);
        wheelIntentResetTimeout = 0;
      }
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
  updateIndexScrollEffects();
});
document.addEventListener('DOMContentLoaded', preloadGalleryImages);
document.addEventListener('DOMContentLoaded', applyAlternatingContentLayout);
document.addEventListener('DOMContentLoaded', setupSectionStepScroll);
document.addEventListener('DOMContentLoaded', setupPricingCards);
document.addEventListener('DOMContentLoaded', setupHeroWordReveal);
document.addEventListener('DOMContentLoaded', setupMobileSectionCarousels);

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  if (link.closest('.main-nav')) closeMobileMenu();
});

window.addEventListener('pageshow', () => {
  const main = document.querySelector('main');
  if (main) main.classList.remove('is-fading');
  document.body.classList.remove('page-is-leaving');
  document.body.classList.add('page-is-visible');
  updateIndexScrollEffects();
});

setupMobileMenu();
setupPageFadeTransitions();
setupThemeToggle();
if (!document.body.classList.contains('gallery-page')) {
  document.body.classList.add('lock-scroll-mode');
}
setupSmoothInPageAnchors();
applyAlternatingContentLayout();
updateIndexScrollEffects();
setupSectionStepScroll();
setupPricingCards();
setupMobileSectionCarousels();
