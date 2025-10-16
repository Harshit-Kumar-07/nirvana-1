const $ = id => document.getElementById(id);

// Elements
const clubSelectDiv = $('clubSelectDiv');
const clubSelect = $('clubSelect');
const subOptionDiv = $('subOptionDiv');
const subOptionSelect = $('subOptionSelect');
const clubContinueBtn = $('clubContinueBtn');

const authOptions = $('authOptions');
const showLogin = $('showLogin');
const showRegister = $('showRegister');

const loginForm = $('loginForm');
const registerForm = $('registerForm');
const loginUsername = $('loginUsername');
const loginPassword = $('loginPassword');
const loginRole = $('loginRole');
const regUsername = $('regUsername');
const regPassword = $('regPassword');
const regRole = $('regRole');

const goRegister = $('goRegister');
const goLogin = $('goLogin');

const authCard = $('authCard');
const dashboardCard = $('dashboardCard');
const welcomeUser = $('welcomeUser');
const joinedAt = $('joinedAt');

const teacherControls = $('teacherControls');
const studentList = $('studentList');

const attendanceSection = $('attendanceSection');
const markBtn = $('markBtn');
const exportCsvBtn = $('exportCsvBtn');
const donutValue = $('donutValue');
const donutText = $('donutText');
const streakVal = $('streakVal');
const totalPresent = $('totalPresent');
const historyList = $('historyList');
const toggleHistoryView = $('toggleHistoryView');
const clearHistoryBtn = $('clearHistoryBtn');

const themeToggle = $('themeToggle');
const clockNode = $('clock');

// State
let users = JSON.parse(localStorage.getItem('sas_users') || '{}');
let currentUser = localStorage.getItem('sas_current') || null;
let historyViewCompact = true;
let viewingUser = null;
let selectedClub = null;
let selectedSubOption = null;

// Map of club → suboptions
const subOptionsMap = {
  tech: ["Webathon", "Hackathon", "Monthly Coding Series"],
  cultural: ["Extravaganza", "Gragest", "Talent Hunt"],
  sports: ["Basketball", "Volleyball", "Cricket"]
};

// Utils
function saveUsers() { localStorage.setItem('sas_users', JSON.stringify(users)); }
function saveCurrent() { if (currentUser) localStorage.setItem('sas_current', currentUser); else localStorage.removeItem('sas_current'); }
function todayISO() { return new Date().toISOString().slice(0,10); }
function isoToDisplay(iso) {
  const d = new Date(iso);
  const day = d.getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// --- Club & suboption selection logic ---
clubSelect.addEventListener('change', () => {
  selectedClub = clubSelect.value;
  const opts = subOptionsMap[selectedClub] || [];
  subOptionSelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Choose event';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  subOptionSelect.appendChild(defaultOpt);
  opts.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    subOptionSelect.appendChild(el);
  });
  subOptionDiv.classList.remove('hidden');
  clubContinueBtn.disabled = true;
});

subOptionSelect.addEventListener('change', () => {
  selectedSubOption = subOptionSelect.value;
  clubContinueBtn.disabled = (!selectedSubOption);
});

clubContinueBtn.addEventListener('click', () => {
  clubSelectDiv.classList.add('hidden');
  authOptions.classList.remove('hidden');
});

// --- Auth UI ---
function showLoginForm() {
  authOptions.classList.add('hidden');
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
}
function showRegisterForm() {
  authOptions.classList.add('hidden');
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
}
function resetAuthUI() {
  authOptions.classList.remove('hidden');
  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');
}

showLogin.addEventListener('click', showLoginForm);
showRegister.addEventListener('click', showRegisterForm);
goRegister.addEventListener('click', showRegisterForm);
goLogin.addEventListener('click', showLoginForm);

// --- Registration ---
registerSubmit.addEventListener('click', (e) => {
  e.preventDefault();
  const u = regUsername.value.trim();
  const p = regPassword.value.trim();
  const r = regRole.value;
  if (!u || !p) {
    alert('Enter username & password');
    return;
  }
  if (users[u]) {
    alert('User exists');
    return;
  }
  users[u] = {
    password: p,
    role: r,
    attendance: [],
    created: todayISO(),
    club: selectedClub,
    subOption: selectedSubOption
  };
  saveUsers();
  alert('Account created. Log in now.');
  regUsername.value = '';
  regPassword.value = '';
  regRole.value = 'student';
  showLoginForm();
});

// --- Login ---
loginSubmit.addEventListener('click', (e) => {
  e.preventDefault();
  const u = loginUsername.value.trim();
  const p = loginPassword.value.trim();
  const r = loginRole.value;
  if (!u || !p) {
    alert('Enter username & password');
    return;
  }
  if (!users[u] || users[u].password !== p) {
    alert('Invalid credentials');
    return;
  }
  if (users[u].role !== r) {
    alert(`You are not a ${r}`);
    return;
  }
  currentUser = u;
  saveCurrent();
  loginUsername.value = '';
  loginPassword.value = '';
  loginRole.value = 'student';
  openDashboard();
});

// --- Dashboard / Rendering ---
function openDashboard() {
  authCard.classList.add('hidden');
  dashboardCard.classList.remove('hidden');
  renderDashboard();
}

function renderDashboard() {
  if (!currentUser || !users[currentUser]) {
    logout();
    return;
  }
  const me = users[currentUser];
  welcomeUser.textContent = `Welcome, ${currentUser} (${me.role}) — ${me.club || ''} / ${me.subOption || ''}`;
  joinedAt.textContent = `Joined: ${new Date(me.created).toLocaleDateString()}`;

  if (me.role === 'teacher') {
    teacherControls.classList.remove('hidden');
    attendanceSection.classList.remove('hidden');
    markBtn.classList.remove('hidden');
    renderStudentList();
  } else {
    teacherControls.classList.add('hidden');
    attendanceSection.classList.remove('hidden');
    markBtn.classList.add('hidden');
    viewingUser = currentUser;
    renderAttendanceFor(viewingUser);
  }
}

function renderStudentList() {
  studentList.innerHTML = '';
  Object.keys(users).forEach(uname => {
    if (users[uname].role === 'student') {
      const st = users[uname];
      const el = document.createElement('div');
      el.className = 'student-item';
      el.textContent = `${uname} (${st.club}/${st.subOption})`;
      el.addEventListener('click', () => {
        viewingUser = uname;
        renderAttendanceFor(viewingUser);
      });
      studentList.appendChild(el);
    }
  });
}

function renderAttendanceFor(uname) {
  const udata = users[uname];
  if (!udata) return;
  const attendance = (udata.attendance || []).slice().sort();

  totalPresent.textContent = attendance.length;

  const last30 = lastNDaysList(30);
  const presentCount = last30.filter(d => attendance.includes(d)).length;
  const pct = Math.round((presentCount / last30.length) * 100);
  updateDonut(pct);

  streakVal.textContent = calcStreak(attendance);

  renderHistory(attendance);
}

// --- Donut / Stats functions ---
function updateDonut(pct) {
  donutValue.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
  donutText.textContent = `${pct}%`;
  donutValue.style.transition = 'stroke-dasharray 700ms cubic-bezier(.2,.9,.2,1)';
}

function lastNDaysList(n) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(d.toISOString().slice(0,10));
  }
  return arr;
}

function calcStreak(attArr) {
  if (!attArr.length) return 0;
  const s = new Set(attArr);
  let streak = 0;
  let d = new Date();
  while (true) {
    const iso = d.toISOString().slice(0,10);
    if (s.has(iso)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function renderHistory(attendance) {
  historyList.innerHTML = '';
  const display = attendance.slice().reverse();
  if (display.length === 0) {
    const e = document.createElement('div');
    e.className = 'muted';
    e.textContent = 'No attendance yet.';
    historyList.appendChild(e);
    return;
  }
  display.forEach(iso => {
    const e = document.createElement('div');
    e.className = 'history-item present';
    if (iso === todayISO()) e.classList.add('today');
    e.textContent = isoToDisplay(iso);
    historyList.appendChild(e);
  });
}

// --- Mark Attendance (only teacher) ---
markBtn.addEventListener('click', () => {
  if (!currentUser) return;
  if (users[currentUser].role !== 'teacher') {
    alert('Only teacher can mark attendance');
    return;
  }
  if (!viewingUser) return;
  const udata = users[viewingUser];
  const iso = todayISO();
  if (udata.attendance.includes(iso)) {
    alert('Already marked today');
    return;
  }
  udata.attendance.push(iso);
  udata.attendance = Array.from(new Set(udata.attendance)).sort();
  users[viewingUser] = udata;
  saveUsers();
  renderAttendanceFor(viewingUser);
  flash(`Marked attendance for ${viewingUser} ✅`);
});

// --- Export / Clear / Toggle History ---
exportCsvBtn.addEventListener('click', () => {
  if (!viewingUser) return;
  const u = users[viewingUser];
  const rows = [['username','date_iso','date_display']];
  (u.attendance || []).forEach(iso => {
    rows.push([viewingUser, iso, isoToDisplay(iso)]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${viewingUser}_attendance.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

clearHistoryBtn.addEventListener('click', () => {
  if (!viewingUser) return;
  if (!confirm(`Clear attendance for ${viewingUser}? This cannot be undone.`)) return;
  users[viewingUser].attendance = [];
  saveUsers();
  renderAttendanceFor(viewingUser);
  flash('History cleared');
});

toggleHistoryView.addEventListener('click', () => {
  historyViewCompact = !historyViewCompact;
  if (viewingUser) renderHistory(users[viewingUser].attendance);
});

// --- Logout / flash / clock / particles etc. ---
$('logoutBtn').addEventListener('click', () => {
  logout();
});
function logout() {
  currentUser = null;
  viewingUser = null;
  saveCurrent();
  dashboardCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  resetAuthUI();
}

function flash(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.bottom = '20px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.background = 'rgba(0,0,0,0.7)';
  t.style.color = 'white';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '8px';
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = '200ms';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 220);
  }, 1600);
}

if (currentUser && users[currentUser]) {
  openDashboard();
}

function updateClock() {
  clockNode.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Particle background (you can reuse your existing code or improved version)
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initParticles();
});
class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.speedY = (Math.random() - 0.5) * 0.2;
    this.opacity = Math.random() * 0.5 + 0.3;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < -this.r) this.x = W + this.r;
    if (this.x > W + this.r) this.x = -this.r;
    if (this.y < -this.r) this.y = H + this.r;
    if (this.y > H + this.r) this.y = -this.r;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
    ctx.fill();
  }
}

let particles = [];
function initParticles() {
  particles = [];
  const num = Math.floor(Math.min(200, (W * H) / 20000));
  for (let i = 0; i < num; i++) {
    particles.push(new Particle());
  }
}
function animateParticles() {
  ctx.clearRect(0, 0, W, H);
  for (const p of particles) {
    p.update();
    p.draw();
  }
  requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

// If no users initially, seed a demo teacher
if (Object.keys(users).length === 0) {
  users['demo_teacher'] = {
    password: 'demo',
    role: 'teacher',
    attendance: [],
    created: todayISO()
  };
  saveUsers();
}

// Cleanup invalid current
if (currentUser && !users[currentUser]) {
  currentUser = null;
  saveCurrent();
}
