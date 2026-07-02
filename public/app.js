// AI Smart Kids - Vanilla Landing Page Logic

let currentStep = 1;
const projectData = {
  art: {
    title: "Cyber-Tiger Generative Canvas",
    category: "AI Art",
    img: "/images/student_project_ai_art.png",
    desc: "Created by Kabir Rathore (Age 12) during our AI Creative Arts workshop. Kabir engineered multi-layer descriptive prompt inputs utilizing ChatGPT to map anatomical details, and Leonardo AI with stylization parameters to output a cyberpunk themed neon tiger canvas."
  },
  web: {
    title: "Global Weather Tracker Dashboard",
    category: "AI Analytics",
    img: "/images/student_project_web.png",
    desc: "Built by Rohan Gupta (Age 13). Rohan leveraged AI-guided logic builders to structure a custom weather dashboard, connecting it to an open-source weather database API to fetch real-time metrics globally."
  },
  vr: {
    title: "Virtual Universe Coding Concept",
    category: "AI & VR",
    img: "/images/student_project_vr_coding.png",
    desc: "Designed by Anya Sharma (Age 14). Anya leveraged AI generation tools to design a stunning 3D virtual environment layout, drafting conceptual coding architectures and system logic to illustrate an immersive virtual learning lab."
  }
};

// ----------------------------------------
// On Page Load Initialization
// ----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  trackVisit();
  loadGlobalSettings();
  loadTestimonials();
  loadGallery();
  loadBlogsLanding();
  initStickyCta();
});

// ----------------------------------------
// API & Analytics Tracking
// ----------------------------------------
async function trackVisit() {
  try {
    const deviceType = window.innerWidth < 768 ? 'Mobile' : (window.innerWidth < 1024 ? 'Tablet' : 'Desktop');
    let source = 'Direct Traffic';
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        source = refUrl.hostname;
      } catch (e) {
        source = document.referrer;
      }
    }
    
    // Log visit analytics
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', source, device: deviceType })
    });

    // Log page view
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', page: '/' })
    });
  } catch (err) {
    console.error("Analytics trace failed:", err);
  }
}

// ----------------------------------------
// Dynamic Content Loading
// ----------------------------------------
async function loadGlobalSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      const phoneEl = document.getElementById('settings-phone');
      if (phoneEl) phoneEl.innerText = data.phone || '+91 83085 07820';
      
      const emailEl = document.getElementById('settings-email');
      if (emailEl) emailEl.innerText = data.email || '';
      
      const addressEl = document.getElementById('settings-address');
      if (addressEl) addressEl.innerText = data.address || '';

      const mapEl = document.getElementById('settings-map');
      if (mapEl && data.googleMapsEmbed) {
        mapEl.src = data.googleMapsEmbed;
      }
      
      const callBtn = document.getElementById('floating-call-btn');
      if (callBtn && data.phone) {
        callBtn.href = 'tel:' + data.phone.replace(/\s+/g, '');
      }
      
      const whatsBtn = document.getElementById('floating-whats-btn');
      if (whatsBtn && data.whatsapp) {
        const cleanWa = data.whatsapp.replace(/\+/g, '').replace(/\s+/g, '').replace(/[^0-9]/g, '');
        whatsBtn.href = `https://wa.me/${cleanWa}?text=Hello%20AI%20Smart%20Kids%2C%20I%20would%20like%20to%20enquire%20about%20your%20AI%20batches%20for%20my%20child.`;
      }
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

async function loadTestimonials() {
  const container = document.getElementById('testimonials-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="glass-card testimonial-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; border-radius: 20px; width: 100%; border: 1px dashed rgba(37,99,235,0.12);">
      <div style="font-size: 28px; margin-bottom: 12px;">⭐</div>
      <h4 style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--color-text-dark); margin-bottom: 8px;">Parent Reviews Coming Soon</h4>
      <p style="font-size: 11px; color: var(--color-text-gray); margin: 0; max-width: 440px; margin: 0 auto; line-height: 1.6;">Our next batch of student creators is graduating soon! Check back to read their success stories, project creations, and feedback.</p>
    </div>
  `;
}

async function loadGallery() {
  try {
    const res = await fetch('/api/gallery');
    if (res.ok) {
      const items = await res.json();
      const container = document.getElementById('gallery-container');
      container.innerHTML = '';

      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'studio-item';
        div.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.category}">
          <div class="studio-overlay">
            <p>${item.caption || item.category}</p>
          </div>
        `;
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Gallery load fail:", err);
  }
}

// ----------------------------------------
// Sticky CTA reveal
// ----------------------------------------
function initStickyCta() {
  const cta = document.getElementById('sticky-cta-bar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      cta.classList.add('active');
    } else {
      cta.classList.remove('active');
    }
  });
}

function hideStickyCta() {
  document.getElementById('sticky-cta-bar').classList.remove('active');
}

// ----------------------------------------
// Project details Modal
// ----------------------------------------
function openProjectModal(type) {
  const data = projectData[type];
  if (!data) return;

  document.getElementById('modal-img').src = data.img;
  document.getElementById('modal-title').innerText = data.title;
  document.getElementById('modal-badge').innerText = data.category;
  document.getElementById('modal-desc').innerText = data.desc;

  document.getElementById('project-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function closeProjectModalOuter(event) {
  if (event.target.id === 'project-modal') {
    closeProjectModal();
  }
}

// ----------------------------------------
// FAQ Accordion toggler
// ----------------------------------------
function toggleFaq(button) {
  const item = button.parentElement;
  const answer = button.nextElementSibling;
  const isActive = item.classList.contains('active');

  // Close all other FAQs
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('active');
    el.querySelector('.faq-answer').style.maxHeight = null;
  });

  if (!isActive) {
    item.classList.add('active');
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

// ----------------------------------------
// Admission Wizard Form Actions
// ----------------------------------------
function goToStep2() {
  const parentName = document.getElementById('input-parent-name').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  
  if (!parentName || !phone) {
    alert("Please fill in Parent Name and Phone Number");
    return;
  }

  document.getElementById('step-1').classList.remove('active');
  document.getElementById('step-2').classList.add('active');
  document.getElementById('dot-1').classList.remove('active');
  document.getElementById('dot-2').classList.add('active');
  document.getElementById('wizard-subheader').innerText = "Step 2 of 2: Student & Batch details";
  currentStep = 2;
}

function backToStep1() {
  document.getElementById('step-2').classList.remove('active');
  document.getElementById('step-1').classList.add('active');
  document.getElementById('dot-2').classList.remove('active');
  document.getElementById('dot-1').classList.add('active');
  document.getElementById('wizard-subheader').innerText = "Step 1 of 2: Parent Profile";
  currentStep = 1;
}

async function submitBookingForm() {
  const parentName = document.getElementById('input-parent-name').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const childName = document.getElementById('input-child-name').value.trim();
  const age = document.getElementById('input-age').value.trim();
  const school = document.getElementById('input-school').value.trim();
  const childClass = document.getElementById('input-class').value.trim();
  const preferredBatch = document.getElementById('input-batch').value;
  const message = document.getElementById('input-message').value.trim();

  if (!childName || !age) {
    alert("Please fill in Child Name and Age");
    return;
  }

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName, phone, email, childName, age, school, class: childClass, preferredBatch, message
      })
    });

    if (res.ok) {
      const result = await res.json();
      
      // Explosion celebration
      if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }

      // Render logs
      document.getElementById('log-email').innerText = result.notificationLogs[0] || 'Email notification logged';
      document.getElementById('log-whatsapp').innerText = result.notificationLogs[1] || 'WhatsApp dispatcher triggered';

      // Transition to success screen
      document.getElementById('step-2').classList.remove('active');
      document.getElementById('success-screen').style.display = 'flex';
      document.getElementById('wizard-subheader').innerText = "Seat Reserved Successfully!";
    } else {
      alert("Submission error. Please verify input details.");
    }
  } catch (err) {
    console.error("Booking error:", err);
    alert("Failed to connect to the enrollment network.");
  }
}

function resetWizardForm() {
  document.getElementById('input-parent-name').value = '';
  document.getElementById('input-phone').value = '';
  document.getElementById('input-email').value = '';
  document.getElementById('input-child-name').value = '';
  document.getElementById('input-age').value = '';
  document.getElementById('input-school').value = '';
  document.getElementById('input-class').value = '';
  document.getElementById('input-message').value = '';

  document.getElementById('success-screen').style.display = 'none';
  document.getElementById('step-1').classList.add('active');
  document.getElementById('dot-1').classList.add('active');
  document.getElementById('dot-2').classList.remove('active');
  document.getElementById('wizard-subheader').innerText = "Step 1 of 2: Parent Profile";
  currentStep = 1;
}

// ----------------------------------------
// Conversational AI Assistant Chatbot
// ----------------------------------------
function toggleChatWindow() {
  const windowDiv = document.getElementById('chat-window-container');
  windowDiv.classList.toggle('active');
  
  // Hide glowing pulses once clicked
  const ring = document.querySelector('.pulse-ring');
  const dot = document.querySelector('.pulse-dot');
  if (ring) ring.style.display = 'none';
  if (dot) dot.style.display = 'none';
}

function handleSendChat(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  // Add User bubble
  appendMessage(text, 'user');
  input.value = '';

  // Show typing loader
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  const messagesWrap = document.getElementById('chat-messages-wrap');
  messagesWrap.appendChild(typing);
  messagesWrap.scrollTop = messagesWrap.scrollHeight;

  // Answer matching latency simulation
  setTimeout(() => {
    // Remove loader
    const loader = document.getElementById('chat-typing-indicator');
    if (loader) loader.remove();

    const response = matchBotResponse(text.toLowerCase());
    appendMessage(response, 'bot');
  }, 1000);
}

function appendMessage(text, sender) {
  const messagesWrap = document.getElementById('chat-messages-wrap');
  const msg = document.createElement('div');
  msg.className = `msg msg-${sender}`;
  msg.innerText = text;
  messagesWrap.appendChild(msg);
  messagesWrap.scrollTop = messagesWrap.scrollHeight;
}

function matchBotResponse(query) {
  if (query.includes('course') || query.includes('syllabus') || query.includes('learn') || query.includes('teach')) {
    return `We offer two premium cohorts:
    1. Junior Creators (Ages 9-12): AI storyboards, Midjourney, block games, basic prompts.
    2. Senior Innovators (Ages 13-16): Prompt design, HTML/CSS/JS, coding inside Cursor, building real API weather dashboards.`;
  }
  if (query.includes('fee') || query.includes('cost') || query.includes('price') || query.includes('rupees') || query.includes('admission')) {
    return `Tuition details:
    • Junior Creators cohort: ₹12,000 (3 months).
    • Senior Innovators cohort: ₹15,000 (3 months).
    Our batches are capped at 12 seats, so booking a demo early is recommended!`;
  }
  if (query.includes('timing') || query.includes('batch') || query.includes('time') || query.includes('schedule')) {
    return `Our active batches run as:
    • Junior Creators: 4:00 PM - 5:30 PM (Mon-Wed-Fri)
    • Senior Innovators: 6:00 PM - 7:30 PM (Mon-Wed-Fri)
    Coordination team can adjust slots based on school timings.`;
  }
  if (query.includes('location') || query.includes('address') || query.includes('where') || query.includes('place') || query.includes('freeganj')) {
    return `We are located in Ujjain:
    📍 B-9/8, Mahakal Vanijya Kendra, near Cosmos Mall, Ujjain, MP 456010.
    Feel free to visit our futuristic studio for a guided tour!`;
  }
  if (query.includes('founder') || query.includes('yash') || query.includes('saurabh') || query.includes('teacher') || query.includes('mentor')) {
    return `Our academy is founded by Saurabh Singhal.
    Saurabh is an Engineer and MBA with 6+ years of hands-on experience working with AI tools at a professional level, and he leads the mentorship program at AI Smart Kids.`;
  }
  if (query.includes('demo') || query.includes('booking') || query.includes('reserve') || query.includes('register') || query.includes('waitlist')) {
    return `Excellent! You can join the Waitlist by filling in the 'Admission Booking' wizard at the bottom of the page, or by sharing your contact number here. Our team will contact you shortly!`;
  }
  if (query.includes('contact') || query.includes('phone') || query.includes('whatsapp') || query.includes('call')) {
    return `You can call or WhatsApp us directly at +91 83085 07820. We are happy to talk!`;
  }
  if (query.includes('thanks') || query.includes('thank you') || query.includes('ok') || query.includes('hello') || query.includes('hi')) {
    return `Hello! Let me know if you need any other details. I'm here to help you get started with Ujjain's first AI academy!`;
  }

  return `I want to provide the correct details. Could you ask about: 'courses', 'batch timings', 'tuition fees', or 'our location in Freeganj'?`;
}

// ----------------------------------------
// Conversion & Spacing Optimizations
// ----------------------------------------

// Exit Intent Popup
let exitModalShown = false;
document.addEventListener('mouseleave', (e) => {
  if (window.location.pathname.includes('/landing')) {
    if (e.clientY < 20 && !exitModalShown) {
      exitModalShown = true;
      const modal = document.getElementById('exit-intent-modal');
      if (modal) modal.classList.add('active');
    }
  }
});

function closeModalDirect(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

async function submitExitInquiry(event) {
  event.preventDefault();
  const parentName = document.getElementById('exit-parent-name').value.trim();
  const phone = document.getElementById('exit-phone').value.trim();

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName,
        childName: 'Exit Intent Gift Inquiry',
        age: 10,
        phone,
        preferredBatch: 'Undecided',
        message: 'Lead booked via exit-intent gift popup.'
      })
    });

    if (res.ok) {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
      alert('Free trial class and PDF checklist requested successfully!');
      closeModalDirect('exit-intent-modal');
    }
  } catch (err) {
    console.error("Exit-intent lead error:", err);
  }
}

// Live Booking Notifications toast loop
const toastNames = [
  "Rahul Sharma from Freeganj",
  "Priyanka Vyas from Nanakheda",
  "Sunita Patel from Rishi Nagar",
  "Meera Rathore from Mahananda Nagar",
  "Deepak Gupta from Sethi Nagar",
  "Rajesh Kelkar from Varahmihir Marg"
];

function showLiveToast() {
  const toast = document.getElementById('live-toast');
  const label = document.getElementById('live-toast-name');
  if (!toast || !label) return;

  const randomName = toastNames[Math.floor(Math.random() * toastNames.length)];
  label.innerText = randomName;

  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 5000);
}

// Start toast loop after 8 seconds
if (window.location.pathname.includes('/landing')) {
  setTimeout(() => {
    showLiveToast();
    setInterval(showLiveToast, 25000);
  }, 8000);
}

// Animated Counters Observer
function startCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 1200; // ms
    const step = target / (duration / 16); // ~60fps
    let current = 0;

    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        counter.innerText = target;
        clearInterval(interval);
      } else {
        counter.innerText = Math.floor(current);
      }
    }, 16);
  });
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      startCounters();
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const statsGrid = document.querySelector('.hero-stats');
if (statsGrid) counterObserver.observe(statsGrid);

// Seats Banner Countdown timer
const countdownTargetDate = new Date();
countdownTargetDate.setDate(countdownTargetDate.getDate() + 5);
countdownTargetDate.setHours(16, 0, 0, 0);

function updateSeatsCountdown() {
  const now = new Date();
  const diff = countdownTargetDate - now;

  const daysLabel = document.getElementById('banner-days');
  const hoursLabel = document.getElementById('banner-hours');
  const minsLabel = document.getElementById('banner-minutes');
  const secsLabel = document.getElementById('banner-seconds');

  if (!daysLabel || !hoursLabel || !minsLabel || !secsLabel) return;

  if (diff <= 0) {
    daysLabel.innerText = "00";
    hoursLabel.innerText = "00";
    minsLabel.innerText = "00";
    secsLabel.innerText = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysLabel.innerText = String(days).padStart(2, '0');
  hoursLabel.innerText = String(hours).padStart(2, '0');
  minsLabel.innerText = String(minutes).padStart(2, '0');
  secsLabel.innerText = String(seconds).padStart(2, '0');
}

if (window.location.pathname.includes('/landing')) {
  updateSeatsCountdown();
  setInterval(updateSeatsCountdown, 1000);
}

// ----------------------------------------
// BLOG CMS LOADER & READER
// ----------------------------------------
async function loadBlogsLanding() {
  try {
    const res = await fetch('/api/blog');
    if (res.ok) {
      const posts = await res.json();
      const container = document.getElementById('blogs-container');
      if (!container) return;
      container.innerHTML = '';

      if (posts.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; font-size:12px; color:#94A3B8; padding:40px 0;">No articles published yet. Stay tuned!</div>`;
        return;
      }

      posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.onclick = () => openBlogReader(post.id);
        
        const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        card.innerHTML = `
          <div class="blog-image">
            <img src="${post.featuredImage || '/images/blog_default.jpg'}" alt="${post.title}">
          </div>
          <div class="blog-info">
            <h4 style="font-family: var(--font-display); font-weight:800; font-size: 13px; line-height: 1.35; color: var(--color-text-dark);">${post.title}</h4>
            <p style="font-size: 11px; margin-top: 4px; color: var(--color-text-gray);">${post.excerpt || ''}</p>
            <div class="blog-meta">
              <span class="badge-tag" style="margin:0; background:rgba(37,99,235,0.06); color:var(--color-primary);">${post.category}</span>
              <span>${dateStr}</span>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Blogs loader failed:", err);
  }
}

async function openBlogReader(id) {
  try {
    const res = await fetch(`/api/blog?id=${id}`);
    if (res.ok) {
      const post = await res.json();
      
      const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      document.getElementById('blog-modal-img').src = post.featuredImage || '/images/blog_default.jpg';
      document.getElementById('blog-modal-category').innerText = post.category;
      document.getElementById('blog-modal-date').innerText = dateStr;
      document.getElementById('blog-modal-title').innerText = post.title;
      
      // Convert markdown content newlines to paragraph tags
      const paragraphs = post.content.split('\n\n').map(p => {
        // Convert headers
        if (p.startsWith('###')) return `<h5 style="font-family:var(--font-display); font-weight:800; font-size:13px; color:var(--color-text-dark); margin: 16px 0 8px 0;">${p.replace('###', '').trim()}</h5>`;
        if (p.startsWith('##')) return `<h4 style="font-family:var(--font-display); font-weight:800; font-size:14px; color:var(--color-text-dark); margin: 18px 0 8px 0;">${p.replace('##', '').trim()}</h4>`;
        
        // Convert lists
        if (p.includes('\n*') || p.includes('\n-')) {
          const items = p.split(/\n[\*\-]\s+/).filter(Boolean);
          const listHtml = items.map(item => `<li style="margin-left: 12px; margin-bottom: 6px;">${item.trim()}</li>`).join('');
          return `<ul style="margin: 8px 0; padding-left: 12px;">${listHtml}</ul>`;
        }
        
        return `<p style="margin-bottom: 12px; font-size:12px; line-height:1.6; color:var(--color-text-gray);">${p.replace(/\n/g, '<br>')}</p>`;
      }).join('');

      document.getElementById('blog-modal-body').innerHTML = paragraphs;
      document.getElementById('blog-reader-modal').classList.add('active');
    }
  } catch (err) {
    console.error("Open blog failed:", err);
  }
}

function closeBlogReaderModal() {
  document.getElementById('blog-reader-modal').classList.remove('active');
}

function closeBlogReaderModalOuter(event) {
  if (event.target.id === 'blog-reader-modal') {
    closeBlogReaderModal();
  }
}
