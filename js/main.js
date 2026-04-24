/* ═══════════════════════════════════════════════════════
   3D PRINTING STUDIO — MAIN JAVASCRIPT
   Miniworks Design Merchandise Pvt. Ltd.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     THEME ENGINE — Sunrise / Sunset Auto-Switching
  ═══════════════════════════════════════════════════ */

  const htmlEl = document.documentElement;
  const STORAGE_KEY = 'mw_theme_manual';   // 'dark' | 'light' | null (auto)
  const MUMBAI = { lat: 19.076, lng: 72.877 }; // default fallback coords

  /* Astronomical sunrise/sunset (NOAA simplified algorithm) */
  function getSunTimes(lat, lng) {
    const D2R = Math.PI / 180;
    const R2D = 180 / Math.PI;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const lngHour = lng / 15;

    function calc(rising) {
      const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;
      const M = (0.9856 * t) - 3.289;
      let L = M + (1.916 * Math.sin(M * D2R)) + (0.020 * Math.sin(2 * M * D2R)) + 282.634;
      L = ((L % 360) + 360) % 360;
      let RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
      RA = ((RA % 360) + 360) % 360;
      const Lq = Math.floor(L / 90) * 90;
      const RAq = Math.floor(RA / 90) * 90;
      RA = (RA + Lq - RAq) / 15;
      const sinDec = 0.39782 * Math.sin(L * D2R);
      const cosDec = Math.cos(Math.asin(sinDec));
      const cosH = (Math.cos(90.833 * D2R) - sinDec * Math.sin(lat * D2R)) / (cosDec * Math.cos(lat * D2R));
      if (cosH > 1 || cosH < -1) return null;
      let H = rising ? (360 - R2D * Math.acos(cosH)) : (R2D * Math.acos(cosH));
      H /= 15;
      const T = H + RA - (0.06571 * t) - 6.622;
      const UT = ((T - lngHour) % 24 + 24) % 24;
      const tz = -now.getTimezoneOffset() / 60;
      return ((UT + tz) % 24 + 24) % 24;
    }

    const sr = calc(true);
    const ss = calc(false);
    if (sr === null || ss === null) return null;
    return { sunrise: sr, sunset: ss };
  }

  function isDaytime(lat, lng) {
    const times = getSunTimes(lat, lng);
    if (!times) return true;
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    return h >= times.sunrise && h < times.sunset;
  }

  function applyTheme(theme, animate) {
    if (animate) {
      htmlEl.classList.add('theme-transitioning');
      setTimeout(() => htmlEl.classList.remove('theme-transitioning'), 500);
    }
    htmlEl.setAttribute('data-theme', theme);
  }

  function getAutoTheme(lat, lng) {
    return isDaytime(lat, lng) ? 'light' : 'dark';
  }

  function initTheme(lat, lng) {
    const manual = localStorage.getItem(STORAGE_KEY);
    const autoBadge = document.getElementById('themeAutoBadge');
    if (manual) {
      applyTheme(manual, false);
      if (autoBadge) autoBadge.classList.remove('visible');
    } else {
      applyTheme(getAutoTheme(lat, lng), false);
      if (autoBadge) autoBadge.classList.add('visible');
    }
    setInterval(() => {
      if (!localStorage.getItem(STORAGE_KEY)) applyTheme(getAutoTheme(lat, lng), true);
    }, 3 * 60 * 1000);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => initTheme(pos.coords.latitude, pos.coords.longitude),
      ()  => initTheme(MUMBAI.lat, MUMBAI.lng)
    );
  } else {
    initTheme(MUMBAI.lat, MUMBAI.lng);
  }

  const themeToggleBtn = document.getElementById('themeToggle');
  const autoBadge = document.getElementById('themeAutoBadge');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next, true);
      if (autoBadge) autoBadge.classList.remove('visible');
    });

    /* Long-press 1.5s → reset to auto mode */
    let pressTimer;
    themeToggleBtn.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        if (autoBadge) autoBadge.classList.add('visible');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => applyTheme(getAutoTheme(pos.coords.latitude, pos.coords.longitude), true),
            ()  => applyTheme(getAutoTheme(MUMBAI.lat, MUMBAI.lng), true)
          );
        } else {
          applyTheme(getAutoTheme(MUMBAI.lat, MUMBAI.lng), true);
        }
      }, 1500);
    });
    ['mouseup','mouseleave'].forEach(e => themeToggleBtn.addEventListener(e, () => clearTimeout(pressTimer)));
  }

  /* ── Navbar Scroll Behavior ────────────────────────── */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  /* ── Hamburger / Mobile Menu ───────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('mobile-open');
  });

  /* ── Search Overlay ────────────────────────────────── */
  const searchToggle  = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose   = document.getElementById('searchClose');
  const searchInput   = document.getElementById('searchInput');

  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    setTimeout(() => searchInput.focus(), 300);
  });
  searchClose.addEventListener('click', () => searchOverlay.classList.remove('active'));
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) searchOverlay.classList.remove('active');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') searchOverlay.classList.remove('active');
  });

  /* ── Cart Sidebar ──────────────────────────────────── */
  const cartToggle  = document.getElementById('cartToggle');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose   = document.getElementById('cartClose');

  function openCart()  { cartSidebar.classList.add('open'); cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }

  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* Cart — Add to Cart button feedback */
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', function () {
      const original = this.innerHTML;
      this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Added!';
      this.style.background = '#22C55E';
      this.style.borderColor = '#22C55E';
      this.style.color = '#fff';
      setTimeout(() => {
        this.innerHTML = original;
        this.style.background = '';
        this.style.borderColor = '';
        this.style.color = '';
      }, 2000);
    });
  });

  /* ── Scroll Reveal ─────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el, i) => {
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal-up'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = (idx * 0.08) + 's';
    revealObserver.observe(el);
  });

  /* ── Counter Animation ─────────────────────────────── */
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const startVal = 0;
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(startVal + (target - startVal) * eased).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        animateCounter(el, target, 1800);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  /* ── Hero Stat Counters ────────────────────────────── */
  const heroStatObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach(el => {
          const target = parseInt(el.dataset.count, 10);
          animateCounter(el, target, 2000);
        });
        heroStatObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroStatObs.observe(heroStats);

  /* ── Product Filter Tabs ───────────────────────────── */
  const filterTabs = document.querySelectorAll('.filter-tab');
  const productCards = document.querySelectorAll('.product-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;

      productCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'none';
          card.offsetHeight;
          card.style.animation = '';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ── Testimonials Carousel ─────────────────────────── */
  const track = document.getElementById('testimonialsTrack');
  const dots  = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let currentSlide = 0;
  const cards = track ? track.querySelectorAll('.testimonial-card') : [];
  let slidesPerView = getSlidesPerView();
  const totalSlides = cards.length;

  function getSlidesPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function updateCarousel() {
    slidesPerView = getSlidesPerView();
    const maxSlide = totalSlides - slidesPerView;
    if (currentSlide > maxSlide) currentSlide = maxSlide;
    if (currentSlide < 0) currentSlide = 0;

    const cardWidth = cards[0] ? cards[0].offsetWidth + 24 : 0;
    track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
      const maxSlide = totalSlides - slidesPerView;
      currentSlide = currentSlide < maxSlide ? currentSlide + 1 : 0;
      updateCarousel();
    });
    prevBtn.addEventListener('click', () => {
      const maxSlide = totalSlides - slidesPerView;
      currentSlide = currentSlide > 0 ? currentSlide - 1 : maxSlide;
      updateCarousel();
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        currentSlide = i;
        updateCarousel();
      });
    });
  }

  /* Auto-advance carousel */
  let carouselTimer = setInterval(() => {
    const maxSlide = totalSlides - getSlidesPerView();
    currentSlide = currentSlide < maxSlide ? currentSlide + 1 : 0;
    updateCarousel();
  }, 5000);

  document.getElementById('testimonialsCarousel')?.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  document.getElementById('testimonialsCarousel')?.addEventListener('mouseleave', () => {
    carouselTimer = setInterval(() => {
      const maxSlide = totalSlides - getSlidesPerView();
      currentSlide = currentSlide < maxSlide ? currentSlide + 1 : 0;
      updateCarousel();
    }, 5000);
  });

  window.addEventListener('resize', updateCarousel);

  /* ── Countdown Timer ───────────────────────────────── */
  function startCountdown() {
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 2);
    endTime.setHours(endTime.getHours() + 14);
    endTime.setMinutes(endTime.getMinutes() + 38);

    const cdDays  = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMins  = document.getElementById('cdMins');
    const cdSecs  = document.getElementById('cdSecs');

    if (!cdDays) return;

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
      const diff = endTime - new Date();
      if (diff <= 0) { clearInterval(timer); return; }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      cdDays.textContent  = pad(d);
      cdHours.textContent = pad(h);
      cdMins.textContent  = pad(m);
      cdSecs.textContent  = pad(s);
    }
    const timer = setInterval(tick, 1000);
    tick();
  }
  startCountdown();

  /* ── Newsletter Form ───────────────────────────────── */
  const nlForm = document.getElementById('nlForm');
  if (nlForm) {
    nlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = nlForm.querySelector('.nl-input');
      const btn   = nlForm.querySelector('.btn-primary');
      if (!input.value) return;

      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Subscribed!';
      btn.style.background = '#22C55E';
      input.value = '';
      input.placeholder = 'You\'re subscribed — thank you!';
      setTimeout(() => {
        btn.innerHTML = 'Subscribe <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        btn.style.background = '';
        input.placeholder = 'Enter your email address';
      }, 4000);
    });
  }

  /* ── Back to Top ───────────────────────────────────── */
  const btt = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btt.classList.add('visible');
    else btt.classList.remove('visible');
  }, { passive: true });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Smooth Anchor Scrolling ───────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        navLinks.classList.remove('mobile-open');
        hamburger.classList.remove('open');
      }
    });
  });

  /* ── Nav Active Link on Scroll ─────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkEls.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ── Wishlist button toggle ────────────────────────── */
  document.querySelectorAll('.pa-btn[title="Add to Wishlist"]').forEach(btn => {
    btn.addEventListener('click', function () {
      const svg = this.querySelector('svg');
      if (svg.getAttribute('fill') === 'none') {
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('stroke', 'currentColor');
      } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
      }
    });
  });

  /* Continue Shopping button in cart */
  const cartClose2 = document.getElementById('cartClose2');
  if (cartClose2) cartClose2.addEventListener('click', closeCart);

  /* ── Stagger product card animation on load ────────── */
  function staggerCards() {
    document.querySelectorAll('.product-card.reveal-up').forEach((card, i) => {
      card.style.transitionDelay = (i * 0.06) + 's';
    });
  }
  staggerCards();

})();
