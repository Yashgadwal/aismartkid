/* 
 * Cuddle Cafe - Premium Website JavaScript
 * Lenis Smooth Scrolling, GSAP Animations, Category Filtering, Table Booking & UI Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initLenis();
  initHeader();
  initMobileMenu();
  initMouseGlow();
  initGSAPAnimations();
  initMenuShuffler();
  initReviewsCarousel();
  initGalleryLightbox();
  initFAQ();
  initReservations();
  initStickyCTA();
});

// --- Preloader ---
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 800);
    }, 500);
  });

  // Fallback in case load takes too long
  setTimeout(() => {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 800);
  }, 3000);
}

// --- Lenis Smooth Scrolling ---
let lenis;
function initLenis() {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    
    // Connect GSAP ScrollTrigger to Lenis
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }
}

// --- Header Scroll Effect ---
function initHeader() {
  const header = document.querySelector('header');
  const scrollProgress = document.getElementById('scrollProgress');
  if (!header) return;

  window.addEventListener('scroll', () => {
    // Scroll progress bar calculation
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if (scrollProgress) {
      scrollProgress.style.width = scrolled + '%';
    }

    // Scrolled class toggle
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// --- Mobile Navigation Drawer ---
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('active-drawer');
  });

  // Close drawer when clicking a link
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      navLinks.classList.remove('active-drawer');
    });
  });
}

// --- Mouse Glow Effect ---
function initMouseGlow() {
  const glow = document.getElementById('mouseGlow');
  if (!glow) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth lerping animation
  function animateGlow() {
    const dx = mouseX - glowX;
    const dy = mouseY - glowY;
    glowX += dx * 0.08;
    glowY += dy * 0.08;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}

// --- GSAP Scroll Reveal & Counters ---
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') {
    // Fail-safe simple reveal if GSAP isn't loaded
    console.log('GSAP not loaded, using fallback reveals');
    return;
  }

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Parallax Hero Background
  gsap.to('.hero-img', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    },
    y: 80,
    ease: 'none'
  });

  // Floating Elements Scroll Parallax
  gsap.to('.floating-bean-1', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: -150
  });

  gsap.to('.floating-bean-2', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5
    },
    y: -80
  });

  gsap.to('.floating-leaf-1', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2
    },
    y: -100
  });

  // Staggered reveal for section contents
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    const elements = section.querySelectorAll('.reveal-fade-up');
    
    if (header) {
      gsap.from(header, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out'
      });
    }

    if (elements.length > 0) {
      gsap.from(elements, {
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }
  });

  // Stats Number Counters
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(stat => {
    const target = parseFloat(stat.getAttribute('data-target'));
    const isDecimal = target % 1 !== 0;
    const valueObj = { val: 0 };

    gsap.to(valueObj, {
      scrollTrigger: {
        trigger: '.stats-section',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      val: target,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (isDecimal) {
          stat.innerText = valueObj.val.toFixed(1) + '★';
        } else {
          stat.innerText = Math.floor(valueObj.val) + '+';
        }
      }
    });
  });
}

// --- Menu Shuffler ---
function initMenuShuffler() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.menu-card'));
  if (cards.length === 0) return;

  // Shuffle the cards array
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Clear grid and re-append in shuffled order
  grid.innerHTML = '';
  cards.forEach(card => {
    grid.appendChild(card);
    card.style.display = 'flex';
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });
}

// --- Reviews Carousel ---
function initReviewsCarousel() {
  const track = document.getElementById('reviewsTrack');
  const dotsContainer = document.getElementById('reviewsDots');
  if (!track || !dotsContainer) return;

  const cards = track.querySelectorAll('.review-card');
  let cardsToShow = getCardsToShow();
  const maxSlides = Math.ceil(cards.length / cardsToShow);
  let currentIndex = 0;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;

  // Create dot paginators
  dotsContainer.innerHTML = '';
  for (let i = 0; i < cards.length - (cardsToShow - 1); i++) {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      goToSlide(i);
    });
    dotsContainer.appendChild(dot);
  }

  function getCardsToShow() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function goToSlide(index) {
    const dotsCount = dotsContainer.querySelectorAll('.carousel-dot').length;
    if (index < 0) index = 0;
    if (index >= dotsCount) index = dotsCount - 1;
    
    currentIndex = index;
    const cardWidth = cards[0].offsetWidth;
    const gap = 30; // matches style.css gap: 30px
    const translateAmount = -index * (cardWidth + gap);
    
    track.style.transform = `translateX(${translateAmount}px)`;
    currentTranslate = translateAmount;
    prevTranslate = translateAmount;
    updateDots();
  }

  // Drag / Swipe functionality
  track.addEventListener('mousedown', dragStart);
  track.addEventListener('touchstart', dragStart);
  track.addEventListener('mouseup', dragEnd);
  track.addEventListener('touchend', dragEnd);
  track.addEventListener('mousemove', drag);
  track.addEventListener('touchmove', drag);
  track.addEventListener('mouseleave', dragEnd);

  function dragStart(e) {
    isDragging = true;
    startX = getPositionX(e);
    track.style.transition = 'none';
  }

  function drag(e) {
    if (!isDragging) return;
    const currentPosition = getPositionX(e);
    const diff = currentPosition - startX;
    currentTranslate = prevTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = 'transform 0.5s ease-in-out';
    const movedBy = currentTranslate - prevTranslate;

    const threshold = 100;
    if (movedBy < -threshold && currentIndex < dotsContainer.querySelectorAll('.carousel-dot').length - 1) {
      goToSlide(currentIndex + 1);
    } else if (movedBy > threshold && currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      goToSlide(currentIndex);
    }
  }

  function getPositionX(e) {
    return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  }

  // Recalculate size on resize
  window.addEventListener('resize', () => {
    const prevCardsToShow = cardsToShow;
    cardsToShow = getCardsToShow();
    if (prevCardsToShow !== cardsToShow) {
      // Re-initialize dots and layout
      initReviewsCarousel();
    }
  });

  // Autoplay
  let autoplayInterval = setInterval(() => {
    const dotsCount = dotsContainer.querySelectorAll('.carousel-dot').length;
    let nextIndex = currentIndex + 1;
    if (nextIndex >= dotsCount) nextIndex = 0;
    goToSlide(nextIndex);
  }, 5000);

  // Pause autoplay on mouse hover/drag
  track.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  track.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => {
      const dotsCount = dotsContainer.querySelectorAll('.carousel-dot').length;
      let nextIndex = currentIndex + 1;
      if (nextIndex >= dotsCount) nextIndex = 0;
      goToSlide(nextIndex);
    }, 5000);
  });
}

// --- Gallery Lightbox ---
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.style.display = 'flex';
        setTimeout(() => {
          lightbox.classList.add('active');
          if (lenis) lenis.stop(); // Stop Lenis scrolling when lightbox is active
        }, 50);
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    setTimeout(() => {
      lightbox.style.display = 'none';
      if (lenis) lenis.start(); // Resume scrolling
    }, 400);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

// --- FAQ Accordion ---
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all FAQs
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = '0px';
      });

      // If clicked wasn't active, open it
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

// --- Booking Forms with WhatsApp Redirection ---
function initReservations() {
  const forms = [
    { id: 'bookingForm', type: 'Table Reservation' },
    { id: 'banquetForm', type: 'Banquet Hall Booking' }
  ];

  forms.forEach(formObj => {
    const form = document.getElementById(formObj.id);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Form validation
      const name = form.querySelector('[name="name"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      const guests = form.querySelector('[name="guests"]').value;
      const date = form.querySelector('[name="date"]').value;
      const time = form.querySelector('[name="time"]') ? form.querySelector('[name="time"]').value : '';
      const message = form.querySelector('[name="message"]').value.trim();

      if (!name || !phone || !guests || !date) {
        alert('Please fill out all required fields.');
        return;
      }

      // Phone length validation (approx. India 10 digit check)
      if (phone.replace(/[^0-9]/g, '').length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }

      // Format WhatsApp message
      let whatsappText = `✨ *New ${formObj.type} Request* ✨\n\n`;
      whatsappText += `👤 *Name:* ${name}\n`;
      whatsappText += `📞 *Phone:* ${phone}\n`;
      whatsappText += `👥 *Number of Guests:* ${guests}\n`;
      whatsappText += `📅 *Date:* ${date}\n`;
      if (time) whatsappText += `⏰ *Time:* ${time}\n`;
      if (message) whatsappText += `💬 *Message:* ${message}\n\n`;
      whatsappText += `_Sent from Cuddle Cafe Premium Website_`;

      const encodedText = encodeURIComponent(whatsappText);
      const whatsappNumber = '917000234433'; // Rishi Nagar cafe main contact

      // Open in new tab
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
      
      // Reset form
      form.reset();
      alert('Thank you! Redirecting you to WhatsApp to complete your reservation.');
    });
  });
}

// --- Sticky "Reserve Your Table" CTA on Scroll ---
function initStickyCTA() {
  const stickyCta = document.getElementById('stickyReserveCta');
  const heroSection = document.querySelector('.hero');
  const footerSection = document.querySelector('footer');
  if (!stickyCta || !heroSection) return;

  window.addEventListener('scroll', () => {
    const heroHeight = heroSection.offsetHeight;
    const scrollPos = window.scrollY;
    
    // Show only after scrolling past the Hero section
    // Hide when reaching the footer
    const footerTop = footerSection ? footerSection.getBoundingClientRect().top + scrollPos : document.body.offsetHeight;
    const isPastHero = scrollPos > heroHeight - 100;
    const isBeforeFooter = scrollPos + window.innerHeight < footerTop + 50;

    if (isPastHero && isBeforeFooter) {
      stickyCta.classList.add('active');
    } else {
      stickyCta.classList.remove('active');
    }
  });
}

// --- Order WhatsApp menu items click ---
window.orderMenuItem = function(itemName, category) {
  const text = `Hi Cuddle Cafe! I would like to order *${itemName}* from the *${category}* category. Please confirm availability and delivery details. Thank you!`;
  const encodedText = encodeURIComponent(text);
  const whatsappNumber = '917000234433';
  window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
}
