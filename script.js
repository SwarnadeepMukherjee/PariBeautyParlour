// ====== Supabase Client (Auth Only) ======
const SUPABASE_URL = 'https://lrncoponmjrrzuonqamb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybmNvcG9ubWpycnp1b25xYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTUxNzQsImV4cCI6MjA4NjI5MTE3NH0.IMzsorUoF4nWwS46QDNj8IbiJ-jdD7ajOKSbCX329Cs';

let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ====== Default Settings ======
const DEFAULT_SETTINGS = {
  phone: '7069437249',
  email: 'radhika@paribeauty.com',
  instagram: 'pari_beauty_parlour_8',
  location: 'Amreli Road, Murlidhar Society, Bagasara',
  status: 'open'
};

// ====== LocalStorage Settings ======
function getSalonSettings() {
  try {
    const stored = localStorage.getItem('salonSettings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSalonSettings(settings) {
  try {
    localStorage.setItem('salonSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// ====== Update Status Badge ======
function updateStatusBadge(status) {
  const badge = document.getElementById('statusBadge');
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (!badge || !dot || !text) return;

  const isOpen = status === 'open';
  badge.classList.remove('open', 'closed');
  badge.classList.add(isOpen ? 'open' : 'closed');
  dot.style.backgroundColor = isOpen ? '#4ade80' : '#f87171';
  dot.style.boxShadow = isOpen
    ? '0 0 8px rgba(74,222,128,0.5)'
    : '0 0 8px rgba(248,113,113,0.5)';
  text.textContent = isOpen ? 'We are currently OPEN' : 'Sorry, we are CLOSED';
}

// ====== Update Footer Contact Info ======
function updateFooterInfo(settings) {
  if (!settings) return;

  const phoneEl = document.getElementById('footerPhone');
  if (phoneEl) {
    phoneEl.textContent = settings.phone;
    phoneEl.href = 'tel:' + settings.phone.replace(/[^\d+]/g, '');
  }

  const emailEl = document.getElementById('footerEmail');
  if (emailEl) {
    emailEl.textContent = settings.email;
    emailEl.href = 'mailto:' + settings.email;
  }

  const instaEl = document.getElementById('footerInstagram');
  if (instaEl) {
    const handle = settings.instagram;
    instaEl.textContent = handle;
    instaEl.href = 'https://instagram.com/' + handle.replace('@', '');
  }

  const locationEl = document.getElementById('footerLocation');
  if (locationEl) {
    locationEl.textContent = settings.location;
  }
}

// ====== Sticky Header ======
function handleScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 80);
}

// ====== Mobile Menu ======
function setupMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => menu.classList.toggle('hidden'));
  menu.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => menu.classList.add('hidden'))
  );
}

// ====== Scroll Reveal ======
function setupScrollReveal() {
  const sections = document.querySelectorAll('#about, #services, #products, #testimonials, #mission, #contact');
  sections.forEach(section => {
    const children = section.querySelectorAll('h2, .service-card, .testimonial-card, p, .grid > div');
    children.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  sections.forEach(section => observer.observe(section));
}

// ====== Smooth Scroll ======
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ====== ADMIN: Auth & Dashboard Logic ======

async function setupAdminPage() {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  if (!loginView || !dashboardView) return;

  // Check existing session
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showDashboard();
    }
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const loginBtn = document.getElementById('loginBtn');

      errorEl.classList.add('hidden');
      loginBtn.textContent = 'Signing in...';
      loginBtn.disabled = true;

      if (!supabaseClient) {
        errorEl.textContent = 'Authentication service unavailable. Please try again later.';
        errorEl.classList.remove('hidden');
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
        return;
      }

      showDashboard();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      loginView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
    });
  }
}

function showDashboard() {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');

  // Load current settings from LocalStorage
  const settings = getSalonSettings();
  document.getElementById('settingPhone').value = settings.phone || '';
  document.getElementById('settingEmail').value = settings.email || '';
  document.getElementById('settingInstagram').value = settings.instagram || '';
  document.getElementById('settingLocation').value = settings.location || '';

  const toggle = document.getElementById('statusToggle');
  toggle.checked = settings.status === 'open';
  updateAdminStatusBadge(settings.status);

  // Status toggle — save immediately
  toggle.addEventListener('change', () => {
    const newStatus = toggle.checked ? 'open' : 'closed';
    updateAdminStatusBadge(newStatus);
    const current = getSalonSettings();
    current.status = newStatus;
    saveSalonSettings(current);
  });

  // Settings form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('saveBtn');
      const feedback = document.getElementById('saveFeedback');

      saveBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2" stroke-dasharray="30 60" /></svg> Saving...';
      saveBtn.disabled = true;

      const updatedSettings = getSalonSettings();
      updatedSettings.phone = document.getElementById('settingPhone').value;
      updatedSettings.email = document.getElementById('settingEmail').value;
      updatedSettings.instagram = document.getElementById('settingInstagram').value;
      updatedSettings.location = document.getElementById('settingLocation').value;
      saveSalonSettings(updatedSettings);

      feedback.classList.remove('hidden');
      feedback.className = 'text-center text-sm py-3 rounded-lg bg-green-50 text-green-700';
      feedback.textContent = '✓ Settings saved successfully!';

      saveBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Save Changes';
      saveBtn.disabled = false;

      setTimeout(() => feedback.classList.add('hidden'), 3000);
    });
  }
}

function updateAdminStatusBadge(status) {
  const badge = document.getElementById('adminStatusBadge');
  if (!badge) return;
  if (status === 'open') {
    badge.className = 'px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200';
    badge.textContent = '● OPEN';
  } else {
    badge.className = 'px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200';
    badge.textContent = '● CLOSED';
  }
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', async () => {
  handleScroll();
  setupMobileMenu();
  setupSmoothScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Main site: load settings from LocalStorage
  const isMainSite = document.getElementById('hero');
  if (isMainSite) {
    setupScrollReveal();
    const settings = getSalonSettings();
    updateStatusBadge(settings.status);
    updateFooterInfo(settings);
  }

  // Admin page
  const isAdminPage = document.getElementById('loginView');
  if (isAdminPage) {
    setupAdminPage();
  }

  // Listen for changes from other tabs (admin ↔ main site)
  window.addEventListener('storage', () => {
    const settings = getSalonSettings();
    updateStatusBadge(settings.status);
    updateFooterInfo(settings);
  });
});
