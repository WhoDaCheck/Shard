// Galéria oldalhoz tartozó logika: lightbox, mozaik fade, progress bar

let galleryCleanup = null;
const GALLERY_MIN_SCROLL_SCALE = 0.8;

function initGalleryPage() {
  if (!document.body.classList.contains('gallery-page')) return;
  if (galleryCleanup) galleryCleanup();
  // Fade effektek a mozaik képekre
  const images = document.querySelectorAll('.mosaic-grid img');
  images.forEach(img => {
    img.style.opacity = '1';
    img.style.setProperty('--scroll-scale', '1');
  });
  let fadeObserver = null;
  let fadeScrollHandler = null;
  let fadeResizeHandler = null;
  function updateFadeFallback() {
    const vh = window.innerHeight;
    const start = vh * 0.8;
    const end = vh * 0.2;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const rect = img.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) {
        const minScale = GALLERY_MIN_SCROLL_SCALE.toFixed(2);
        if (img.style.getPropertyValue('--scroll-scale') !== minScale) {
          img.style.setProperty('--scroll-scale', minScale);
        }
        continue;
      }

      let visibility = 0;
      if (rect.top < start && rect.bottom > end) {
        const visibleTop = Math.min(start, rect.bottom);
        const visibleBottom = Math.max(end, rect.top);
        const visibleHeight = visibleTop - visibleBottom;
        const maxHeight = Math.min(rect.height, start - end);
        visibility = Math.max(0, Math.min(1, visibleHeight / maxHeight));
      }
      const nextScale = (
        GALLERY_MIN_SCROLL_SCALE + visibility * (1 - GALLERY_MIN_SCROLL_SCALE)
      ).toFixed(3);
      if (img.style.getPropertyValue('--scroll-scale') !== nextScale) {
        img.style.setProperty('--scroll-scale', nextScale);
      }
    }
  }

  function setupFadeObserver() {
    if (!('IntersectionObserver' in window)) {
      return false;
    }

    const thresholds = [];
    for (let i = 0; i <= 10; i++) thresholds.push(i / 10);

    fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio;
        const nextScale = (
          GALLERY_MIN_SCROLL_SCALE + ratio * (1 - GALLERY_MIN_SCROLL_SCALE)
        ).toFixed(3);
        if (entry.target.style.getPropertyValue('--scroll-scale') !== nextScale) {
          entry.target.style.setProperty('--scroll-scale', nextScale);
        }
      });
    }, { threshold: thresholds });

    images.forEach(img => fadeObserver.observe(img));
    return true;
  }

  if (!setupFadeObserver()) {
    let fadeScheduled = false;
    function scheduleFade() {
      if (fadeScheduled) return;
      fadeScheduled = true;
      requestAnimationFrame(() => {
        fadeScheduled = false;
        updateFadeFallback();
      });
    }

    fadeScrollHandler = scheduleFade;
    fadeResizeHandler = updateFadeFallback;
    window.addEventListener('scroll', fadeScrollHandler, { passive: true });
    window.addEventListener('resize', fadeResizeHandler);
    updateFadeFallback();
  }

  // Lightbox logika
  // --- Lightbox zoom animáció ---
  let lastRect = null;
  let lastImg = null;

  let stickyScrollHandler = null;
  let stickyResizeHandler = null;
  let keydownHandler = null;
  let swipeHintTimeoutId = 0;
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    const swipeHint = lightbox.querySelector('.lightbox-swipe-hint');
    const images = Array.from(document.querySelectorAll('.mosaic-grid img'));
    let orderedImages = [];
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const progressTrack = lightbox.querySelector('.lightbox-progress');
    const progressBar = lightbox.querySelector('.lightbox-progress span');
    const sectionLabel = lightbox.querySelector('.lightbox-section');
    let currentIndex = 0;
    let isSwapping = false;
    let sectionEnds = [];
    let sectionInfo = [];
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let touchDeltaY = 0;
    let trackingTouch = false;
    let suppressImageTapClose = false;

    function hasSeenSwipeHint() {
      try {
        return window.sessionStorage.getItem('lightboxSwipeHintSeen') === '1';
      } catch (error) {
        return false;
      }
    }

    function setSeenSwipeHint() {
      try {
        window.sessionStorage.setItem('lightboxSwipeHintSeen', '1');
      } catch (error) {
        // Storage can be unavailable in private mode; ignore silently.
      }
    }

    function hideSwipeHint(markSeen = false) {
      if (!swipeHint) return;
      swipeHint.classList.remove('is-visible');
      if (swipeHintTimeoutId) {
        window.clearTimeout(swipeHintTimeoutId);
        swipeHintTimeoutId = 0;
      }
      if (markSeen) setSeenSwipeHint();
    }

    function maybeShowSwipeHint() {
      if (!swipeHint) return;
      if (window.innerWidth > 700) return;
      if (hasSeenSwipeHint()) return;

      swipeHint.classList.add('is-visible');
      if (swipeHintTimeoutId) window.clearTimeout(swipeHintTimeoutId);
      swipeHintTimeoutId = window.setTimeout(() => {
        hideSwipeHint(true);
      }, 2400);
    }

    function updateOrderedImages() {
      orderedImages = images
        .map(img => ({ img, rect: img.getBoundingClientRect() }))
        .sort((a, b) => {
          if (a.rect.top === b.rect.top) return a.rect.left - b.rect.left;
          return a.rect.top - b.rect.top;
        })
        .map(item => item.img);
    }

    function getFitSize(aspect) {
      const maxW = window.innerWidth * 0.8;
      const maxH = window.innerHeight * 0.8;
      let finalW = maxW;
      let finalH = finalW / aspect;
      if (finalH > maxH) {
        finalH = maxH;
        finalW = finalH * aspect;
      }
      return { width: finalW, height: finalH };
    }

    function updateProgress() {
      if (!progressBar) return;
      const total = images.length || 1;
      const percent = ((currentIndex + 1) / total) * 100;
      progressBar.style.width = `${percent.toFixed(2)}%`;

      if (sectionLabel && sectionInfo.length) {
        const section = sectionInfo.find(s => currentIndex >= s.start && currentIndex <= s.end);
        if (section) {
          sectionLabel.textContent = section.title || '';
        }
      }
    }

    function buildProgressMarkers() {
      if (!progressTrack) return;
      progressTrack.querySelectorAll('.progress-marker').forEach(m => m.remove());

      const sections = Array.from(document.querySelectorAll('.gallery-section'));
      const counts = sections.map(section =>
        section.querySelectorAll('.mosaic-grid img').length
      );
      const titles = sections.map(section => {
        const title = section.querySelector('.gallery-title');
        return title ? title.textContent.trim() : '';
      });
      const total = images.length || 1;
      sectionEnds = [];
      sectionInfo = [];

      let running = 0;
      counts.forEach((count, idx) => {
        const start = running;
        running += count;
        const end = Math.max(start, running - 1);
        sectionInfo.push({
          title: titles[idx] || '',
          start,
          end
        });
        if (idx < counts.length - 1) {
          const percent = (running / total) * 100;
          sectionEnds.push(percent);
          const marker = document.createElement('span');
          marker.className = 'progress-marker';
          marker.style.left = `${percent.toFixed(2)}%`;
          const label = document.createElement('span');
          label.className = 'progress-label';
          label.textContent = titles[idx + 1] || '';
          marker.appendChild(label);
          progressTrack.appendChild(marker);
        }
      });
    }

    function openZoom(index) {
      lastImg = orderedImages[index];
      // Kattintás pillanatában olvasd ki a pozíciót és scrollt!
      const rect = lastImg.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      lastRect = rect; // csak a méret miatt
      lightboxImg.src = lastImg.src;
      lightboxImg.style.position = 'fixed';
      lightboxImg.style.transition = 'none';
      lightboxImg.style.opacity = '0';
      // fixed pozíciónál viewporthoz viszonyítunk, nem a dokumentumhoz
      lightboxImg.style.left = rect.left + 'px';
      lightboxImg.style.top = rect.top + 'px';
      lightboxImg.style.width = rect.width + 'px';
      lightboxImg.style.height = rect.height + 'px';
      lightboxImg.style.transform = 'none';
      lightbox.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      // Két frame után indítjuk, hogy biztosan érvényesüljön a kezdeti állapot
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lightboxImg.style.transition = 'left 0.5s, top 0.5s, width 0.5s, height 0.5s, transform 0.5s, opacity 0.5s';
          lightboxImg.style.opacity = '1';
          const { width: finalW, height: finalH } = getFitSize(aspect);
          lightboxImg.style.left = '50%';
          lightboxImg.style.top = '50%';
          lightboxImg.style.width = finalW + 'px';
          lightboxImg.style.height = finalH + 'px';
          lightboxImg.style.transform = 'translate(-50%, -50%)';
        });
      });
      maybeShowSwipeHint();
      updateProgress();
      preload(index + 1);
      preload(index - 1);
    }

    function closeZoom() {
      if (!lastImg) return;
      const rect = lastImg.getBoundingClientRect();
      lightboxImg.style.transition = 'left 0.5s, top 0.5s, width 0.5s, height 0.5s, transform 0.5s';
      // fixed pozíciónál viewport koordinátát használunk
      lightboxImg.style.left = rect.left + 'px';
      lightboxImg.style.top = rect.top + 'px';
      lightboxImg.style.width = rect.width + 'px';
      lightboxImg.style.height = rect.height + 'px';
      lightboxImg.style.transform = 'none';
      // A háttér fade-out induljon azonnal, szinkronban a kicsinyítéssel
      lightbox.classList.remove('is-visible');
      hideSwipeHint();
      setTimeout(() => {
        document.body.style.overflow = '';
        lastRect = null;
        lastImg = null;
      }, 500);
    }

    function swapImage(index, direction = 0) {
      if (!orderedImages[index] || isSwapping) return;
      isSwapping = true;
      const previousIndex = currentIndex;
      currentIndex = index;
      updateProgress();

      if (direction === 0) {
        if (index === (previousIndex + 1) % images.length) direction = 1;
        else if (index === (previousIndex - 1 + images.length) % images.length) direction = -1;
        else direction = index >= previousIndex ? 1 : -1;
      }

      const useMobileSlide = window.innerWidth <= 900;
      lightboxImg.classList.add('is-swapping');
      lightboxImg.style.opacity = '0';
      if (useMobileSlide) {
        const travel = Math.min(window.innerWidth * 0.22, 170);
        const outOffset = direction >= 0 ? -travel : travel;
        lightboxImg.style.transform = `translate(calc(-50% + ${outOffset}px), -50%)`;
      } else {
        lightboxImg.style.transform = 'translate(-50%, -50%) scale(1.02)';
      }

      const onFadeOut = () => {
        lightboxImg.removeEventListener('transitionend', onFadeOut);
        lastImg = orderedImages[index];
        lightboxImg.src = lastImg.src;

        const onLoad = () => {
          lightboxImg.removeEventListener('load', onLoad);
          const aspect = lightboxImg.naturalWidth / lightboxImg.naturalHeight;
          const { width: finalW, height: finalH } = getFitSize(aspect);
          lightboxImg.style.width = finalW + 'px';
          lightboxImg.style.height = finalH + 'px';

          requestAnimationFrame(() => {
            if (useMobileSlide) {
              const travel = Math.min(window.innerWidth * 0.22, 170);
              const inOffset = direction >= 0 ? travel : -travel;
              lightboxImg.style.transition = 'none';
              lightboxImg.style.opacity = '0';
              lightboxImg.style.transform = `translate(calc(-50% + ${inOffset}px), -50%)`;

              requestAnimationFrame(() => {
                lightboxImg.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                lightboxImg.style.opacity = '1';
                lightboxImg.style.transform = 'translate(-50%, -50%)';
              });
            } else {
              lightboxImg.style.opacity = '1';
              lightboxImg.style.transform = 'translate(-50%, -50%) scale(1)';
            }
            const onFadeIn = () => {
              lightboxImg.removeEventListener('transitionend', onFadeIn);
              lightboxImg.classList.remove('is-swapping');
              isSwapping = false;
            };
            lightboxImg.addEventListener('transitionend', onFadeIn, { once: true });
          });
        };

        lightboxImg.addEventListener('load', onLoad, { once: true });
      };

      lightboxImg.addEventListener('transitionend', onFadeOut, { once: true });
      preload(index + 1);
      preload(index - 1);
    }

    images.forEach((img, i) => {
      img.addEventListener('click', () => {
        const idx = orderedImages.indexOf(img);
        currentIndex = idx === -1 ? i : idx;
        openZoom(currentIndex);
      });
    });

    // Lapozás: showImage függvény
    function showImage(index, direction = 0) {
      if (!orderedImages[index]) return;
      if (lightbox.classList.contains('is-visible')) {
        swapImage(index, direction);
      } else {
        currentIndex = index;
        openZoom(index);
      }
    }

    // Nyilak kattintásra lapozás
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hideSwipeHint(true);
      showImage((currentIndex - 1 + images.length) % images.length, -1);
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hideSwipeHint(true);
      showImage((currentIndex + 1) % images.length, 1);
    });

    // Lightbox overlay kattintás: csak overlay vagy kép zárja be
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightboxImg && suppressImageTapClose) {
        suppressImageTapClose = false;
        return;
      }
      if (e.target === lightbox || e.target === lightboxImg) {
        closeZoom();
      }
    });

    keydownHandler = e => {
      if (!lightbox.classList.contains('is-visible')) return;
      if (e.key === 'Escape') closeZoom();
      if (e.key === 'ArrowRight') showImage((currentIndex + 1) % images.length, 1);
      if (e.key === 'ArrowLeft') showImage((currentIndex - 1 + images.length) % images.length, -1);
    };
    document.addEventListener('keydown', keydownHandler);

    function onTouchStart(e) {
      if (!lightbox.classList.contains('is-visible')) return;
      if (!e.touches || e.touches.length !== 1) return;
      hideSwipeHint(true);
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchDeltaX = 0;
      touchDeltaY = 0;
      trackingTouch = true;
    }

    function onTouchMove(e) {
      if (!trackingTouch || !e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchDeltaX = touch.clientX - touchStartX;
      touchDeltaY = touch.clientY - touchStartY;
    }

    function onTouchEnd() {
      if (!trackingTouch) return;
      trackingTouch = false;
      const absX = Math.abs(touchDeltaX);
      const absY = Math.abs(touchDeltaY);
      if (absX < 48 || absX <= absY) return;

      suppressImageTapClose = true;
      if (touchDeltaX < 0) {
        showImage((currentIndex + 1) % images.length, 1);
      } else {
        showImage((currentIndex - 1 + images.length) % images.length, -1);
      }
    }

    lightboxImg.addEventListener('touchstart', onTouchStart, { passive: true });
    lightboxImg.addEventListener('touchmove', onTouchMove, { passive: true });
    lightboxImg.addEventListener('touchend', onTouchEnd, { passive: true });
    lightboxImg.addEventListener(
      'touchcancel',
      () => {
        trackingTouch = false;
      },
      { passive: true }
    );

    // --- Eredeti lightbox navigáció, progress, preload ---
    function preload(index) {
      if (orderedImages[index]) {
        const img = new Image();
        img.src = orderedImages[index].src;
      }
    }

    updateOrderedImages();
    buildProgressMarkers();
    updateProgress();
    function updateStickyStates() {
      const titles = document.querySelectorAll('.gallery-title');
      titles.forEach(title => {
        const rect = title.getBoundingClientRect();
        const headerHeight = parseFloat(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--header-height')
        );
        const stuck = rect.top <= headerHeight + 0.5;
        title.classList.toggle('is-stuck', stuck);
      });
    }

    stickyScrollHandler = () => requestAnimationFrame(updateStickyStates);
    stickyResizeHandler = () => {
      updateOrderedImages();
      buildProgressMarkers();
      updateStickyStates();
    };
    window.addEventListener('scroll', stickyScrollHandler, { passive: true });
    window.addEventListener('resize', stickyResizeHandler);
    updateStickyStates();
  }
  galleryCleanup = () => {
    if (fadeObserver) fadeObserver.disconnect();
    if (fadeScrollHandler) window.removeEventListener('scroll', fadeScrollHandler);
    if (fadeResizeHandler) window.removeEventListener('resize', fadeResizeHandler);
    if (stickyScrollHandler) window.removeEventListener('scroll', stickyScrollHandler);
    if (stickyResizeHandler) window.removeEventListener('resize', stickyResizeHandler);
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
    if (swipeHintTimeoutId) window.clearTimeout(swipeHintTimeoutId);
  };
}

document.addEventListener('DOMContentLoaded', initGalleryPage);
window.initGalleryPage = initGalleryPage;
