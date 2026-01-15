// Galéria oldalhoz tartozó logika: lightbox, mozaik fade, progress bar

document.addEventListener('DOMContentLoaded', () => {
  // Fade effektek a mozaik képekre
  const images = document.querySelectorAll('.mosaic-grid img');
  function updateFade() {
    const vh = window.innerHeight;
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const start = vh * 0.8;
      const end   = vh * 0.2;
      let fade = 0;
      if (rect.top < start && rect.bottom > end) {
        const visibleTop = Math.min(start, rect.bottom);
        const visibleBottom = Math.max(end, rect.top);
        const visibleHeight = visibleTop - visibleBottom;
        const maxHeight = Math.min(rect.height, start - end);
        fade = Math.max(0, Math.min(1, visibleHeight / maxHeight));
      }
      img.style.opacity = fade.toFixed(2);
    });
  }
  window.addEventListener('scroll', updateFade, { passive: true });
  window.addEventListener('resize', updateFade);
  updateFade();

  // Lightbox logika
  // --- Lightbox zoom animáció ---
  let lastRect = null;
  let lastImg = null;

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    const images = Array.from(document.querySelectorAll('.mosaic-grid img'));
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const progressBar = lightbox.querySelector('.lightbox-progress span');
    let currentIndex = 0;

    function openZoom(index) {
      lastImg = images[index];
      // Kattintás pillanatában olvasd ki a pozíciót és scrollt!
      const rect = lastImg.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      lastRect = rect; // csak a méret miatt
      lightboxImg.src = lastImg.src;
      lightboxImg.style.position = 'fixed';
      lightboxImg.style.transition = 'none';
      lightboxImg.style.opacity = '0';
      lightboxImg.style.left = (rect.left + scrollX) + 'px';
      lightboxImg.style.top = (rect.top + scrollY) + 'px';
      lightboxImg.style.width = rect.width + 'px';
      lightboxImg.style.height = rect.height + 'px';
      lightboxImg.style.transform = 'none';
      lightbox.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      // Egy animációs frame múlva indítjuk az animációt
      requestAnimationFrame(() => {
        lightboxImg.style.transition = 'left 0.5s, top 0.5s, width 0.5s, height 0.5s, transform 0.5s, opacity 0.5s';
        lightboxImg.style.opacity = '1';
        const maxW = window.innerWidth * 0.8;
        const maxH = window.innerHeight * 0.8;
        let finalW = maxW;
        let finalH = finalW / aspect;
        if (finalH > maxH) {
          finalH = maxH;
          finalW = finalH * aspect;
        }
        lightboxImg.style.left = '50%';
        lightboxImg.style.top = '50%';
        lightboxImg.style.width = finalW + 'px';
        lightboxImg.style.height = finalH + 'px';
        lightboxImg.style.transform = 'translate(-50%, -50%)';
      });
      updateProgress();
      preload(index + 1);
      preload(index - 1);
    }

    function closeZoom() {
      if (!lastImg) return;
      const rect = lastImg.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      lightboxImg.style.transition = 'left 0.5s, top 0.5s, width 0.5s, height 0.5s, transform 0.5s';
      lightboxImg.style.left = (rect.left + scrollX) + 'px';
      lightboxImg.style.top = (rect.top + scrollY) + 'px';
      lightboxImg.style.width = rect.width + 'px';
      lightboxImg.style.height = rect.height + 'px';
      lightboxImg.style.transform = 'none';
      setTimeout(() => {
        lightbox.classList.remove('is-visible');
        document.body.style.overflow = '';
        lastRect = null;
        lastImg = null;
      }, 500);
    }

    images.forEach((img, i) => {
      img.addEventListener('click', () => {
        currentIndex = i;
        openZoom(i);
      });
    });

    // Lapozás: showImage függvény
    function showImage(index) {
      if (!images[index]) return;
      currentIndex = index;
      openZoom(index);
    }

    // Nyilak kattintásra lapozás
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      showImage((currentIndex - 1 + images.length) % images.length);
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      showImage((currentIndex + 1) % images.length);
    });

    // Lightbox overlay kattintás: csak overlay vagy kép zárja be
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox || e.target === lightboxImg) {
        closeZoom();
      }
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-visible')) return;
      if (e.key === 'Escape') closeZoom();
      if (e.key === 'ArrowRight') showImage((currentIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') showImage((currentIndex - 1 + images.length) % images.length);
    });

    // --- Eredeti lightbox navigáció, progress, preload ---
    function preload(index) {
      if (images[index]) {
        const img = new Image();
        img.src = images[index].src;
      }
    }
  }
});
