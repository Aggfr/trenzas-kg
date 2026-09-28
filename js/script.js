// =========================================================
// TRENZAS KG — script.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initGalleryControls();
  initContactForm();
  initHeroTracking();
});

/* ---------- Menú móvil ---------- */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("primary-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.classList.toggle("is-active", isOpen);
  });

  // Cierra el menú al pulsar un enlace (útil en móvil)
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Tracking del hero (video scrubbing: el fotograma sigue al cursor) ---------- */
function initHeroTracking() {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero__video-scrub");

  if (!hero || !video) return;

  const CENTER_RATIO = 0.5;
  const EASE = 0.12; // suavizado del movimiento, independiente de la frecuencia del mousemove

  let targetRatio = CENTER_RATIO;
  let currentRatio = CENTER_RATIO;
  let metadataReady = video.readyState >= 1; // HAVE_METADATA
  let seeking = false;
  let pendingRatio = null;

  video.addEventListener("loadedmetadata", () => {
    metadataReady = true;
  });

  // Evita "inundar" de seeks al video: si llega un nuevo objetivo mientras
  // aun se esta buscando el anterior, se guarda y se aplica al terminar.
  const seekTo = (ratio) => {
    if (!metadataReady || !video.duration) return;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const targetTime = clamped * video.duration;
    if (seeking) {
      pendingRatio = clamped;
      return;
    }
    seeking = true;
    video.currentTime = targetTime;
  };

  video.addEventListener("seeked", () => {
    seeking = false;
    if (pendingRatio !== null) {
      const next = pendingRatio;
      pendingRatio = null;
      seekTo(next);
    }
  });

  const animate = () => {
    currentRatio += (targetRatio - currentRatio) * EASE;
    seekTo(currentRatio);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);

  // En tactil (sin raton real) se queda en el fotograma central (poster)
  const hasMouse = window.matchMedia("(pointer: fine)").matches;
  if (!hasMouse) return;

  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const relX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    // Cursor a la izquierda -> ultimo fotograma (ella girada a la izquierda);
    // cursor a la derecha -> primer fotograma (ella girada a la derecha).
    targetRatio = 1 - relX;
  });

  hero.addEventListener("mouseleave", () => {
    targetRatio = CENTER_RATIO;
  });
}

/* ---------- Carrusel de la galería (automático, sin flechas) ---------- */
function initGalleryControls() {
  const scroller = document.getElementById("galleryScroller");

  if (!scroller) return;

  const AUTOPLAY_INTERVAL = 3500; // ms entre cada desplazamiento automático
  const RESUME_DELAY = 6000; // ms de espera tras arrastrar manualmente antes de reanudar
  let autoplayTimer = null;
  let resumeTimer = null;

  const scrollAmount = () => {
    const item = scroller.querySelector(".gallery__item");
    if (!item) return 300;
    const style = window.getComputedStyle(scroller);
    const gap = parseInt(style.columnGap || style.gap || "0", 10);
    return item.getBoundingClientRect().width + gap;
  };

  const isAtEnd = () => {
    // Pequeño margen de tolerancia para evitar errores de redondeo
    return scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
  };

  const goNext = () => {
    if (isAtEnd()) {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      scroller.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(goNext, AUTOPLAY_INTERVAL);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  // Pausa el autoplay un rato si el usuario arrastra la galería manualmente
  const pauseAndResumeLater = () => {
    stopAutoplay();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoplay, RESUME_DELAY);
  };

  // Se detiene mientras el ratón está encima o mientras el usuario toca/arrastra
  scroller.addEventListener("mouseenter", stopAutoplay);
  scroller.addEventListener("mouseleave", startAutoplay);
  scroller.addEventListener("touchstart", pauseAndResumeLater, { passive: true });

  // No malgastar recursos si la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  startAutoplay();
}

/* ---------- Formulario de contacto ---------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Por favor, completa todos los campos antes de enviar.";
      return;
    }

    // Aquí, más adelante, se puede conectar con un backend real
    // (por ejemplo un endpoint propio, Formspree, EmailJS, etc.)
    const name = form.name.value.trim();

    status.textContent = `¡Gracias, ${name}! Hemos recibido tu mensaje y te contactaremos pronto.`;
    form.reset();
  });
}
