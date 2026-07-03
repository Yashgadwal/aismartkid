/* 
 * Cuddle Cafe - Google Review Funnel Logic
 * Interactive Rating, Confetti Delight, Local Storage complaints capture, and Owner Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initAudioPlayer();
  initStarsRating();
  initFeedbackForm();
  initAdminDashboard();
  initStatsCounters();
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
}

// --- Audio Player Toggle ---
let audioPlayed = false;
function initAudioPlayer() {
  const toggleBtn = document.getElementById('audioToggle');
  const bgAudio = document.getElementById('bgAudio');
  if (!toggleBtn || !bgAudio) return;

  // Audio file source (soft royalty-free jazz piano loop)
  bgAudio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // working audio loop placeholder
  bgAudio.loop = true;
  bgAudio.volume = 0.15; // soft background volume

  toggleBtn.addEventListener('click', () => {
    if (bgAudio.paused) {
      bgAudio.play().then(() => {
        toggleBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        lucide.createIcons();
        audioPlayed = true;
      }).catch(err => console.log('Audio autoplay blocked: ', err));
    } else {
      bgAudio.pause();
      toggleBtn.innerHTML = '<i data-lucide="volume-x"></i>';
      lucide.createIcons();
    }
  });
}

// --- Interactive Stars Logic ---
let selectedRating = 0;
function initStarsRating() {
  const stars = document.querySelectorAll('.star-btn');
  const ratingText = document.getElementById('ratingText');
  const initialCard = document.getElementById('initialCard');
  const positiveCard = document.getElementById('positiveCard');
  const negativeCard = document.getElementById('negativeCard');

  if (stars.length === 0) return;

  const hoverTexts = {
    1: 'Disappointing 💔',
    2: 'Could be better 😕',
    3: 'Average / OK 😐',
    4: 'Great experience! 😊',
    5: 'Loved it! Outstanding! ❤️'
  };

  stars.forEach((star, idx) => {
    const starVal = idx + 1;

    // Hover state
    star.addEventListener('mouseenter', () => {
      highlightStars(starVal);
      if (ratingText) ratingText.textContent = hoverTexts[starVal];
    });

    // Reset stars when mouse leaves stars row
    star.parentElement.addEventListener('mouseleave', () => {
      if (selectedRating > 0) {
        highlightStars(selectedRating);
        if (ratingText) ratingText.textContent = hoverTexts[selectedRating];
      } else {
        highlightStars(0);
        if (ratingText) ratingText.textContent = '';
      }
    });

    // Click rating event
    star.addEventListener('click', (e) => {
      selectedRating = starVal;
      highlightStars(starVal);
      
      // Spawn floating hearts
      spawnHearts(e.clientX, e.clientY);

      // Branch logic based on rating value
      if (selectedRating >= 4) {
        // Auto-copy SEO review text to clipboard immediately on user gesture click
        const seoTextEl = document.getElementById('copiedReviewPreview');
        if (seoTextEl) {
          const textToCopy = seoTextEl.innerText.trim();
          copyToClipboard(textToCopy).then(() => {
            console.log('SEO review auto-copied on star click.');
          }).catch(err => {
            console.error('Auto-copy failed:', err);
          });
        }
      }

      setTimeout(() => {
        initialCard.style.display = 'none';
        
        if (selectedRating >= 4) {
          // Positive flow (4 or 5 stars)
          positiveCard.classList.add('active');
          triggerPositiveCelebration();
        } else {
          // Negative flow (1 to 3 stars)
          negativeCard.classList.add('active');
          document.getElementById('hiddenRating').value = selectedRating;
        }
      }, 600);
    });
  });

  function highlightStars(count) {
    stars.forEach((s, i) => {
      if (i < count) {
        s.classList.add('star-active');
      } else {
        s.classList.remove('star-active');
      }
    });
  }
}

// --- Confetti & Floating Hearts Delight ---
function triggerPositiveCelebration() {
  // Fire Canvas Confetti if loaded
  if (typeof confetti !== 'undefined') {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#C59A45', '#FAF8F5', '#6F4E37', '#FFC107']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#C59A45', '#FAF8F5', '#6F4E37', '#FFC107']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  // Soft cafe music trigger
  const bgAudio = document.getElementById('bgAudio');
  const toggleBtn = document.getElementById('audioToggle');
  if (bgAudio && bgAudio.paused && !audioPlayed) {
    bgAudio.play().then(() => {
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        lucide.createIcons();
      }
    }).catch(err => console.log('Autoplay blocked: ', err));
  }
}

// Spawn floating hearts around mouse coordinate
function spawnHearts(x, y) {
  const container = document.getElementById('heartsContainer');
  if (!container) return;

  const heartCount = 8;
  for (let i = 0; i < heartCount; i++) {
    const heart = document.createElement('div');
    heart.classList.add('floating-heart');
    heart.innerHTML = Math.random() > 0.5 ? '❤️' : '☕';
    
    // Position
    heart.style.left = `${x + (Math.random() - 0.5) * 40}px`;
    heart.style.top = `${y + (Math.random() - 0.5) * 40}px`;
    
    // Animate details
    const angle = (Math.random() - 0.5) * 50;
    const distance = 80 + Math.random() * 80;
    heart.style.setProperty('--tx', `${Math.sin(angle) * distance}px`);
    heart.style.setProperty('--ty', `-${distance}px`);

    container.appendChild(heart);

    // Remove element after animation completes
    setTimeout(() => {
      heart.remove();
    }, 2500);
  }
}

// --- Submit Private Feedback (1-3 stars) ---
function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  const negativeCard = document.getElementById('negativeCard');
  const successCard = document.getElementById('successCard');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();
    const rating = document.getElementById('hiddenRating').value || selectedRating;

    if (!name || !phone || !message) {
      alert('Please fill out all required fields.');
      return;
    }

    // Capture Metadata
    const browser = getBrowserName();
    const device = window.innerWidth <= 768 ? 'Mobile' : 'Desktop';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Store review
    const reviewData = {
      name,
      phone,
      email: email || 'N/A',
      rating,
      comment: message,
      browser,
      device,
      timestamp
    };

    const currentReviews = JSON.parse(localStorage.getItem('cuddle_reviews')) || [];
    currentReviews.push(reviewData);
    localStorage.setItem('cuddle_reviews', JSON.stringify(currentReviews));

    // Transition card view
    negativeCard.classList.remove('active');
    setTimeout(() => {
      negativeCard.style.display = 'none';
      successCard.classList.add('active');
      
      // Fire success confetti
      if (typeof confetti !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#6F4E37', '#FAF8F5', '#C59A45']
        });
      }
    }, 400);
  });
}

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Firefox") > -1) return "Mozilla Firefox";
  if (userAgent.indexOf("Chrome") > -1) return "Google Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Apple Safari";
  if (userAgent.indexOf("Edge") > -1) return "Microsoft Edge";
  return "Unknown Browser";
}

// --- Secret Admin Dashboard Portal ---
function initAdminDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin');

  if (isAdmin !== 'true') return;

  const overlay = document.getElementById('adminPanel');
  if (!overlay) return;

  overlay.classList.add('active');

  const lockScreen = document.getElementById('adminLockScreen');
  const dashboard = document.getElementById('adminDashboard');
  const passwordInput = document.getElementById('adminPassword');
  const passwordBtn = document.getElementById('adminSubmitPassword');

  passwordBtn.addEventListener('click', verifyAdminPassword);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyAdminPassword();
  });

  function verifyAdminPassword() {
    const password = passwordInput.value;
    if (password === 'cuddle123') {
      lockScreen.style.display = 'none';
      dashboard.style.display = 'block';
      loadAdminData();
    } else {
      alert('Incorrect password! Access denied.');
      passwordInput.value = '';
    }
  }

  // Handle panel close
  document.getElementById('adminClose').addEventListener('click', () => {
    overlay.classList.remove('active');
    // Clear admin param
    window.history.replaceState({}, document.title, window.location.pathname);
  });
}

function loadAdminData() {
  const tableBody = document.getElementById('adminTableBody');
  if (!tableBody) return;

  const reviews = JSON.parse(localStorage.getItem('cuddle_reviews')) || [];
  tableBody.innerHTML = '';

  if (reviews.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="admin-empty-state">No complaints captured yet. You're doing great! ☕</td></tr>`;
    return;
  }

  // Render rows (newest first)
  reviews.reverse().forEach(rev => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${rev.timestamp}</td>
      <td><strong>${escapeHtml(rev.name)}</strong><br>${escapeHtml(rev.phone)}<br><span style="color:rgba(255,255,255,0.4);">${escapeHtml(rev.email)}</span></td>
      <td class="rating-cell">${'★'.repeat(rev.rating)}</td>
      <td>${escapeHtml(rev.comment)}</td>
      <td class="meta-cell">${rev.device}<br>${rev.browser}</td>
      <td><button class="admin-close-btn" style="border-color:#dc3545; color:#dc3545;" onclick="deleteSingleReview('${rev.timestamp}')">Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Global functions for admin dashboard deletion actions
window.deleteSingleReview = function(timestamp) {
  if (!confirm('Are you sure you want to delete this complaint record?')) return;
  let reviews = JSON.parse(localStorage.getItem('cuddle_reviews')) || [];
  reviews = reviews.filter(r => r.timestamp !== timestamp);
  localStorage.setItem('cuddle_reviews', JSON.stringify(reviews));
  loadAdminData();
};

window.clearAllReviews = function() {
  if (!confirm('WARNING: Are you sure you want to delete ALL captured complaints data? This action is irreversible.')) return;
  localStorage.removeItem('cuddle_reviews');
  loadAdminData();
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Animated Stats Numbers ---
function initStatsCounters() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const stats = document.querySelectorAll('.stat-num');
  stats.forEach(stat => {
    const target = parseFloat(stat.getAttribute('data-target'));
    const isDecimal = target % 1 !== 0;
    const valueObj = { val: 0 };

    gsap.to(valueObj, {
      scrollTrigger: {
        trigger: '.stats-section',
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      },
      val: target,
      duration: 2,
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

// --- Cross-Context Clipboard Copy Helper (Handles Insecure HTTP / Wi-Fi testing) ---
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          resolve();
        } else {
          reject(new Error('execCommand copy failed'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}


