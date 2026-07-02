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
  },
  j1: {
    title: "Space Station Concept Illustration",
    category: "AI Art",
    img: "/student-projects/project_junior_1.jpeg",
    desc: "Created by Aarav S. (Age 10). Aarav designed a multi-layer spaceship module prompt, utilizing ChatGPT and Midjourney to render this complex hyper-realistic space dock concept."
  },
  j2: {
    title: "Future City Skylines Concept",
    category: "AI Art",
    img: "/student-projects/project_junior_2.jpeg",
    desc: "Created by Yash V. (Age 11). Yash generated futuristic urban architectural forms using descriptive style guides and AI render tools during our Creative Design cohort."
  },
  j3: {
    title: "Mythological Temple Reconstruction",
    category: "AI Art",
    img: "/student-projects/project_junior_3.jpeg",
    desc: "Created by Ananya P. (Age 9). Ananya used natural language descriptors to instruct AI image builders to draft this detailed ancient temple scene."
  },
  j4: {
    title: "Steampunk Airship Mechanics",
    category: "AI Art",
    img: "/student-projects/project_junior_4.jpeg",
    desc: "Created by Parth K. (Age 12). Parth compiled detailed mechanical descriptors to generate this retro-futuristic steampunk flying airship design."
  },
  j5: {
    title: "Cybernetic Rainforest Biome",
    category: "AI Art",
    img: "/student-projects/project_junior_5.jpeg",
    desc: "Created by Diya N. (Age 10). Diya prompt-engineered detailed neon vegetation forms, blending organic biomes with synthetic cyberpunk lighting details."
  },
  j6: {
    title: "Galactic Voyage Concept Art",
    category: "AI Art",
    img: "/student-projects/project_junior_6.jpeg",
    desc: "Created by Vivaan S. (Age 11). Vivaan leveraged AI space render templates to build an atmospheric space cruiser traveling through deep cosmos."
  },
  j7: {
    title: "Deep Sea Atlantis Exploration",
    category: "AI Art",
    img: "/student-projects/project_junior_7.jpeg",
    desc: "Created by Tanvi M. (Age 12). Tanvi engineered prompts outlining coral reefs, underwater cities, and ancient submarine ruins."
  },
  j8: {
    title: "Neon Samurai Knight Canvas",
    category: "AI Art",
    img: "/student-projects/project_junior_8.jpeg",
    desc: "Created by Dev J. (Age 11). Dev combined traditional Japanese armor styles with futuristic neon graphics to design this action canvas."
  },
  j9: {
    title: "Eco-Friendly Solar Cruiser",
    category: "AI Art",
    img: "/student-projects/project_junior_9.jpeg",
    desc: "Created by Myra K. (Age 10). Myra designed a concept solar-powered yacht, directing generative algorithms to output a sleek minimalist cruiser design."
  },
  jv1: {
    title: "Interactive Solar System Simulation",
    category: "AI Programming",
    img: "/student-projects/project_junior_v1.mp4",
    desc: "Built by Kabir R. (Age 12). Kabir prompt-engineered code templates to structure an interactive solar system simulator, rendering motion trails and orbital mathematics."
  },
  jv2: {
    title: "AI-Assisted Adventure Animation",
    category: "AI Animation",
    img: "/student-projects/project_junior_v2.mp4",
    desc: "Created by Siya G. (Age 11). Siya used AI text-to-video generators to produce custom animation clips, editing them into a cohesive story sequence."
  },
  jv3: {
    title: "Smart Robot Navigation Routine",
    category: "AI Robotics",
    img: "/student-projects/project_junior_v3.mp4",
    desc: "Built by Advait T. (Age 10). Advait directed generative logic engines to write pathfinding algorithms, showing active obstacle avoidance simulation."
  },
  jv4: {
    title: "Holographic Interface Animation",
    category: "AI Design",
    img: "/student-projects/project_junior_v4.mp4",
    desc: "Designed by Isha S. (Age 12). Isha leveraged prompt descriptors to animate rotating science-fiction HUD graphics and tech parameters."
  },
  jv5: {
    title: "Future World Tour Video Walkthrough",
    category: "AI Architecture",
    img: "/student-projects/project_junior_v5.mp4",
    desc: "Created by Aryan P. (Age 11). Aryan generated dynamic environment layers, creating a moving video tour of a futuristic ecological city dome."
  }
};

// ----------------------------------------
// On Page Load Initialization
// ----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initPageLoader();
  trackVisit();
  loadGlobalSettings();
  loadTestimonials();
  loadGallery();
  loadBlogsLanding();
  initStickyCta();
  init3DTilt();
  init3DBackground();
  initBgSpotlight();
  initCustomCursor();
  initCarouselPagination();
  initScrollReveal();
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

      // Initialize Dynamic Cohort Card Countdowns
      if (data.cohortDateJunior) {
        startCountdown(data.cohortDateJunior, 'junior');
      }
      if (data.cohortDateSenior) {
        startCountdown(data.cohortDateSenior, 'senior');
      }
      
      // Update seats banner using the closest date
      let bannerDate = null;
      if (data.cohortDateJunior && data.cohortDateSenior) {
        const jTime = new Date(data.cohortDateJunior).getTime();
        const sTime = new Date(data.cohortDateSenior).getTime();
        const now = Date.now();
        
        // Pick the closest future date
        if (jTime > now && sTime > now) {
          bannerDate = jTime < sTime ? data.cohortDateJunior : data.cohortDateSenior;
        } else if (jTime > now) {
          bannerDate = data.cohortDateJunior;
        } else if (sTime > now) {
          bannerDate = data.cohortDateSenior;
        }
      } else {
        bannerDate = data.cohortDateJunior || data.cohortDateSenior;
      }
      
      if (bannerDate) {
        startBannerCountdown(bannerDate);
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

  const modalImg = document.getElementById('modal-img');
  const modalVideo = document.getElementById('modal-video');

  if (data.img && data.img.endsWith('.mp4')) {
    modalImg.style.display = 'none';
    modalVideo.style.display = 'block';
    modalVideo.src = data.img;
    modalVideo.load();
    modalVideo.play().catch(e => console.log("Video play deferred:", e));
  } else {
    modalVideo.style.display = 'none';
    modalVideo.pause();
    modalVideo.src = '';
    modalImg.style.display = 'block';
    modalImg.src = data.img;
  }

  document.getElementById('modal-title').innerText = data.title;
  document.getElementById('modal-badge').innerText = data.category;
  document.getElementById('modal-desc').innerText = data.desc;

  document.getElementById('project-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modalVideo = document.getElementById('modal-video');
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.src = '';
  }
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
  const email = document.getElementById('input-email').value.trim();
  
  if (!parentName) {
    alert("Please enter Parent Name.");
    return;
  }
  if (!phone) {
    alert("Please enter Phone Number.");
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid Email Address.");
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

  if (!childName) {
    alert("Please enter Child's Full Name.");
    return;
  }
  if (!age) {
    alert("Please enter Child's Age.");
    return;
  }
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 5 || ageNum > 18) {
    alert("Please enter a valid age between 5 and 18.");
    return;
  }

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName, phone, email, childName, age: ageNum, school, class: childClass, preferredBatch, message
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

  if (!parentName) {
    alert("Please enter Parent Full Name.");
    return;
  }
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

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
function startCountdown(targetDateStr, prefix) {
  const targetDate = new Date(targetDateStr);
  
  function update() {
    const now = new Date();
    const diff = targetDate - now;
    
    const daysEl = document.getElementById(`${prefix}-days`);
    const hoursEl = document.getElementById(`${prefix}-hours`);
    const minsEl = document.getElementById(`${prefix}-minutes`);
    const secsEl = document.getElementById(`${prefix}-seconds`);
    
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    
    if (diff <= 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minsEl.innerText = "00";
      secsEl.innerText = "00";
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    daysEl.innerText = String(days).padStart(2, '0');
    hoursEl.innerText = String(hours).padStart(2, '0');
    minsEl.innerText = String(minutes).padStart(2, '0');
    secsEl.innerText = String(seconds).padStart(2, '0');
  }
  
  update();
  setInterval(update, 1000);
}

function startBannerCountdown(targetDateStr) {
  const targetDate = new Date(targetDateStr);
  
  function update() {
    const now = new Date();
    const diff = targetDate - now;
    
    const daysEl = document.getElementById('banner-days');
    const hoursEl = document.getElementById('banner-hours');
    const minsEl = document.getElementById('banner-minutes');
    const secsEl = document.getElementById('banner-seconds');
    
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    
    if (diff <= 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minsEl.innerText = "00";
      secsEl.innerText = "00";
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    daysEl.innerText = String(days).padStart(2, '0');
    hoursEl.innerText = String(hours).padStart(2, '0');
    minsEl.innerText = String(minutes).padStart(2, '0');
    secsEl.innerText = String(seconds).padStart(2, '0');
  }
  
  update();
  setInterval(update, 1000);
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
        card.onclick = () => location.href = `/blog/${post.id}`;
        
        const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        card.innerHTML = `
          <div class="blog-image">
            <img src="${post.featuredImage || '/images/blog_default.png'}" alt="${post.title}">
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

      document.getElementById('blog-modal-img').src = post.featuredImage || '/images/blog_default.png';
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

// Interactive 3D tilt effects
function init3DTilt() {
  const cards = document.querySelectorAll('.course-card, .skill-card, .project-card, .why-card');
  cards.forEach(card => {
    card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';
    card.style.transformStyle = 'preserve-3d';
    
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const angleX = (yc - y) / 16;
      const angleY = (x - xc) / 16;
      
      card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.015, 1.015, 1.015)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

// 3D Animated Canvas Background
function init3DBackground() {
  const canvas = document.getElementById('hero-3d-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  canvas.width = width;
  canvas.height = height;
  
  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  });

  const particles = [];
  const particleCount = 20;
  const colors = [
    { r: 37, g: 99, b: 235 },  // Primary Blue
    { r: 124, g: 58, b: 237 }, // Secondary Purple
    { r: 255, g: 138, b: 0 }    // Accent Orange
  ];
  
  class Sphere {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * 0.8 + 0.2; // depth factor
      this.size = (Math.random() * 40 + 20) * this.z;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.vx = (Math.random() * 0.4 - 0.2) * this.z;
      this.vy = (Math.random() * 0.4 - 0.2) * this.z;
      this.alpha = (Math.random() * 0.2 + 0.1) * this.z;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
        this.reset();
      }
    }
    
    draw() {
      const gradient = ctx.createRadialGradient(
        this.x - this.size * 0.3,
        this.y - this.size * 0.3,
        this.size * 0.05,
        this.x,
        this.y,
        this.size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha * 1.5})`);
      gradient.addColorStop(0.2, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`);
      gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Sphere());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Background Glow Spotlight Cursor Follower
function initBgSpotlight() {
  if (window.innerWidth < 1024) return;

  const spotlight = document.createElement('div');
  spotlight.className = 'bg-glow-spotlight';
  document.body.appendChild(spotlight);

  window.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  });
}

// Custom Cursor trailing logic
function initCustomCursor() {
  // Only initialize on desktop viewports (1024px and wider)
  if (window.innerWidth < 1024) return;

  const cursorDot = document.createElement('div');
  cursorDot.className = 'custom-cursor-dot';
  const cursorOutline = document.createElement('div');
  cursorOutline.className = 'custom-cursor-outline';

  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorOutline);

  let mouseX = -100, mouseY = -100;
  let cursorX = -100, cursorY = -100;
  let isHovered = false;
  let isClick = false;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Position dot instantly
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  // Outline follow interpolation loop
  function animateOutline() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    
    let scaleStr = '';
    if (isHovered) {
      scaleStr = 'scale(1.4)';
    } else if (isClick) {
      scaleStr = 'scale(0.8)';
    }
    
    cursorOutline.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) ${scaleStr}`;
    
    requestAnimationFrame(animateOutline);
  }
  animateOutline();

  // Event delegation to capture dynamically loaded links/cards
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, .btn, .course-card, .skill-card, .project-card, .why-card, .faq-question, .chatbot-btn, .testimonial-card');
    if (target) {
      isHovered = true;
      cursorOutline.classList.add('cursor-hover-active');
      cursorDot.classList.add('cursor-hover-active');
    }
  });

  document.addEventListener('mouseout', e => {
    const target = e.target.closest('a, button, .btn, .course-card, .skill-card, .project-card, .why-card, .faq-question, .chatbot-btn, .testimonial-card');
    if (target) {
      isHovered = false;
      cursorOutline.classList.remove('cursor-hover-active');
      cursorDot.classList.remove('cursor-hover-active');
    }
  });

  window.addEventListener('mousedown', () => {
    isClick = true;
  });

  window.addEventListener('mouseup', () => {
    isClick = false;
  });
}

// Instagram-style projects carousel scrolling handler
function scrollCarousel(button, direction) {
  const track = button.parentElement.querySelector('.carousel-track');
  if (!track) return;
  const card = track.querySelector('.project-card');
  if (!card) return;
  const scrollAmount = (card.offsetWidth + 24) * direction; // card width + CSS gap
  track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// Instagram-style Dot Indicators Initializer
function initCarouselPagination() {
  document.querySelectorAll('.carousel-wrapper').forEach((wrapper) => {
    const track = wrapper.querySelector('.carousel-track');
    const cards = track.querySelectorAll('.project-card');
    if (!track || cards.length === 0) return;
    
    // Clear any existing dots first
    const existingDots = wrapper.querySelector('.carousel-dots');
    if (existingDots) existingDots.remove();
    
    // Create dots container
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    wrapper.appendChild(dotsContainer);
    
    // Create dots based on card count
    cards.forEach((card, i) => {
      const dot = document.createElement('div');
      dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        const cardWidth = card.offsetWidth + 24;
        track.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
      });
      dotsContainer.appendChild(dot);
    });
    
    // Update active dot on scroll
    track.addEventListener('scroll', () => {
      const cardWidth = cards[0].offsetWidth + 24;
      if (cardWidth <= 24) return;
      const activeIndex = Math.round(track.scrollLeft / cardWidth);
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        if (i === activeIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });
  });
}

// 3D Page Loader Initializer
function initPageLoader() {
  const loader = document.getElementById('global-3d-loader');
  const fill = document.getElementById('loader-fill');
  const text = document.getElementById('loader-text');
  if (!loader || !fill || !text) return;
  
  let progress = 0;
  const interval = setInterval(() => {
    if (progress < 40) {
      progress += Math.floor(Math.random() * 12) + 4;
    } else if (progress < 85) {
      progress += Math.floor(Math.random() * 6) + 1;
    } else if (progress < 99) {
      progress += 1;
    }
    
    if (progress > 99) progress = 99;
    
    fill.style.width = `${progress}%`;
    text.innerText = `${progress}%`;
  }, 35);
  
  // Fade out loader on window load
  window.addEventListener('load', () => {
    clearInterval(interval);
    fill.style.width = '100%';
    text.innerText = '100%';
    
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      document.body.classList.add('loaded');
    }, 600);
  });

  // Fallback in case window load takes too long (e.g. 5 seconds)
  setTimeout(() => {
    clearInterval(interval);
    fill.style.width = '100%';
    text.innerText = '100%';
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      document.body.classList.add('loaded');
    }, 400);
  }, 5000);
}

// Automatically add scroll reveal classes to key layout blocks
function prepareScrollReveal() {
  // Add reveal-up to all section headers
  document.querySelectorAll('.section-header').forEach(el => {
    el.classList.add('reveal-up');
  });

  // Grids selectors list
  const grids = [
    '.skills-grid',
    '.courses-grid',
    '.projects-grid',
    '.why-grid',
    '.tools-split-grid',
    '.testimonials-grid',
    '.studio-grid',
    '.admission-timeline',
    '.blogs-grid',
    '#faq-accordion',
    '.contact-items'
  ];

  grids.forEach(gridSelector => {
    document.querySelectorAll(gridSelector).forEach(grid => {
      const cards = grid.children;
      Array.from(cards).forEach((card, index) => {
        card.classList.add('reveal-up');
        // Stagger delays
        if (index > 0 && index <= 5) {
          card.classList.add(`reveal-delay-${index}`);
        }
      });
    });
  });
}

// Scroll Reveal Observer
function initScrollReveal() {
  prepareScrollReveal();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  });
  
  document.querySelectorAll('.reveal-up').forEach(el => {
    observer.observe(el);
  });
}
