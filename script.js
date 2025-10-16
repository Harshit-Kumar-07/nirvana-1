/* -----------------------
   Smart Attendance v2
   + role-based (teacher vs student)
   + teacher can view all students and mark for them
   + formatted date in history (day Month year)
   ----------------------- */

const $ = id => document.getElementById(id);

// Elements
const showLogin = $('showLogin');
const showRegister = $('showRegister');
const authOptions = $('authOptions');

const loginForm = $('loginForm');
const registerForm = $('registerForm');
const loginUsername = $('loginUsername');
const loginPassword = $('loginPassword');
const regUsername = $('regUsername');
const regPassword = $('regPassword');
const loginSubmit = $('loginSubmit');
const registerSubmit = $('registerSubmit');
const goRegister = $('goRegister');
const goLogin = $('goLogin');

const loginRole = $('loginRole');
const regRole = $('regRole');

const dashboardCard = $('dashboardCard');
const authCard = $('authCard');
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
let viewingUser = null;  // For teacher: which student is currently in view

// Utils
function saveUsers(){ localStorage.setItem('sas_users', JSON.stringify(users)); }
function saveCurrent(){
  if (currentUser) localStorage.setItem('sas_current', currentUser);
  else localStorage.removeItem('sas_current');
}
function todayISO(){ const d = new Date(); return d.toISOString().slice(0,10); }
function isoToDisplay(iso) {
  const d = new Date(iso);
  const day = d.getDate();
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Auth UI
function showLoginForm(){
  authOptions.classList.add('hidden');
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
}
function showRegisterForm(){
  authOptions.classList.add('hidden');
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
}
function resetAuthUI(){
  authOptions.classList.remove('hidden');
  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');
}

showLogin.addEventListener('click', showLoginForm);
showRegister.addEventListener('click', showRegisterForm);
goRegister.addEventListener('click', showRegisterForm);
goLogin.addEventListener('click', showLoginForm);

registerSubmit.addEventListener('click', e => {
  e.preventDefault();
  const u = regUsername.value.trim();
  const p = regPassword.value.trim();
  const r = regRole.value;
  if (!u || !p) {
    alert('Enter username & password');
    return;
  }
  if (users[u]) {
    alert('User exists — choose another username');
    return;
  }
  users[u] = { password: p, role: r, attendance: [], created: todayISO() };
  saveUsers();
  alert('Account created. Log in now.');
  regUsername.value = '';
  regPassword.value = '';
  regRole.value = 'student';
  showLoginForm();
});

loginSubmit.addEventListener('click', e => {
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
    alert(`You are not a ${r}. Please login with correct role.`);
    return;
  }
  currentUser = u;
  saveCurrent();
  loginUsername.value = '';
  loginPassword.value = '';
  loginRole.value = 'student';
  openDashboard();
});

// Dashboard & rendering
function openDashboard(){
  authCard.classList.add('hidden');
  dashboardCard.classList.remove('hidden');
  renderDashboard();
}

function renderDashboard(){
  if (!currentUser || !users[currentUser]) {
    logout();
    return;
  }
  const me = users[currentUser];
  welcomeUser.textContent = `Welcome, ${currentUser} (${me.role})`;
  joinedAt.textContent = `Joined: ${new Date(me.created).toLocaleDateString()}`;

  // If teacher, show student list
  if (me.role === 'teacher') {
    teacherControls.classList.remove('hidden');
    attendanceSection.classList.add('hidden');
    renderStudentList();
  } else {
    // student view: show their own attendance section
    teacherControls.classList.add('hidden');
    attendanceSection.classList.remove('hidden');
    viewingUser = currentUser;
    renderAttendanceFor(viewingUser);
  }
}

// Render list of students
function renderStudentList() {
  studentList.innerHTML = '';
  for (const uname in users) {
    if (users[uname].role === 'student') {
      const btn = document.createElement('div');
      btn.className = 'student-item';
      btn.textContent = uname;
      btn.addEventListener('click', () => {
        viewingUser = uname;
        attendanceSection.classList.remove('hidden');
        renderAttendanceFor(uname);
      });
      studentList.appendChild(btn);
    }
  }
}

// Render attendance view for a particular user
function renderAttendanceFor(uname) {
  const udata = users[uname];
  if (!udata) return;
  const attendance = (udata.attendance || []).slice().sort();

  totalPresent.textContent = attendance.length;

  const last30 = lastNDaysList(30);
  const presentLast30 = last30.filter(d => attendance.includes(d)).length;
  const pct = Math.round((presentLast30 / last30.length) * 100);
  updateDonut(pct);

  streakVal.textContent = calcStreak(attendance);

  renderHistory(attendance);

  // Mark attendance button logic
  if (attendance.includes(todayISO())) {
    markBtn.classList.add('outline');
    markBtn.textContent = 'Marked Today ✓';
    markBtn.disabled = true;
  } else {
    markBtn.classList.remove('outline');
    markBtn.textContent = 'Mark Attendance';
    markBtn.disabled = false;
  }
}

// Utility: donut update
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
    } else {
      break;
    }
  }
  return streak;
}

function renderHistory(attendance) {
  historyList.innerHTML = '';
  const display = attendance.slice().reverse();
  if (display.length === 0) {
    const el = document.createElement('div');
    el.className = 'muted';
    el.textContent = 'No attendance yet.';
    historyList.appendChild(el);
    return;
  }
  if (historyViewCompact) {
    display.forEach(iso => {
      const el = document.createElement('div');
      el.className = 'history-item present';
      if (iso === todayISO()) el.classList.add('today');
      el.textContent = isoToDisplay(iso);
      historyList.appendChild(el);
    });
  } else {
    display.forEach(iso => {
      const el = document.createElement('div');
      el.className = 'history-item present';
      el.style.minWidth = '100%';
      el.innerHTML = `<strong>${isoToDisplay(iso)}</strong> — ${iso}`;
      historyList.appendChild(el);
    });
  }
}

// Mark attendance (for current viewingUser), only teacher allowed
markBtn.addEventListener('click', () => {
  if (!currentUser) return;
  const me = users[currentUser];
  if (me.role !== 'teacher' && currentUser !== viewingUser) {
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

// Export CSV for current viewingUser
exportCsvBtn.addEventListener('click', () => {
  if (!viewingUser) return;
  const u = users[viewingUser];
  const rows = [['username','date_iso','date_display']];
  (u.attendance || []).forEach(iso => {
    rows.push([viewingUser, iso, isoToDisplay(iso)]);
  });
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${viewingUser}_attendance.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Clear history for viewingUser (teacher can do for students, student for self)
clearHistoryBtn.addEventListener('click', () => {
  if (!viewingUser) return;
  if (!confirm(`Clear all attendance history for ${viewingUser}? This cannot be undone.`)) return;
  users[viewingUser].attendance = [];
  saveUsers();
  renderAttendanceFor(viewingUser);
  flash('History cleared');
});

// Toggle history view
toggleHistoryView.addEventListener('click', () => {
  historyViewCompact = !historyViewCompact;
  if (viewingUser) renderHistory(users[viewingUser].attendance);
});

// Logout
$('logoutBtn').addEventListener('click', () => {
  logout();
});
function logout(){
  currentUser = null;
  viewingUser = null;
  saveCurrent();
  dashboardCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  resetAuthUI();
}

// Flash message
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
    t.style.opacity = 0;
    setTimeout(() => t.remove(), 220);
  }, 1600);
}

// Auto-login
if (currentUser && users[currentUser]) {
  openDashboard();
}

// Clock
function updateClock(){
  const now = new Date();
  const s = now.toLocaleTimeString();
  clockNode.textContent = s;
}
setInterval(updateClock, 1000);
updateClock();

// Particles background
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W = canvas.width = innerWidth;
let H = canvas.height = innerHeight;
window.addEventListener('resize', () => {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  initParticles();
});

class P {
  constructor(){
    this.reset();
  }
  reset(){
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.8 + 0.6;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.h = Math.floor(Math.random() * 360);
    this.a = 0.06 + Math.random() * 0.25;
  }
  step(){
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw(){
    ctx.beginPath();
    ctx.fillStyle = `hsla(${this.h},70%,60%,${this.a})`;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

let parts = [];
function initParticles(){
  parts = [];
  const count = Math.floor(Math.min(120, (W * H) / 80000));
  for (let i = 0; i < count; i++){
    parts.push(new P());
  }
}
function anim(){
  ctx.clearRect(0, 0, W, H);
  for (const p of parts){
    p.step();
    p.draw();
  }
  requestAnimationFrame(anim);
}
initParticles();
anim();

// If no users exist, seed a demo teacher
if (Object.keys(users).length === 0) {
  users['demo_teacher'] = { password: 'demo', role: 'teacher', attendance: [], created: todayISO() };
  saveUsers();
}

// Cleanup invalid current
if (currentUser && !users[currentUser]) {
  currentUser = null;
  saveCurrent();
}
