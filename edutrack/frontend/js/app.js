// js/app.js — main app controller
const App = (() => {
  const state = {
    user: null,
    currentPage: null
  };

  const pageMap = {
    dashboard:  () => DashboardPage.render(),
    classrooms: () => ClassroomsPage.render(),
    teachers:   () => TeachersPage.render(),
    attendance: () => AttendancePage.render(),
    leaves:     () => LeavesPage.render(),
    reports:    () => ReportsPage.render(),
    qrscan:     () => QRScanPage.render(),
    qrprint:    () => QRPrintPage.render(),
    profile:    () => ProfilePage.render(),
    myatt:      () => ProfilePage.render(),
    mark:       () => AttendancePage.render(),
  };

  function navigate(page) {
    state.currentPage = page;

    // Rebuild sidebar to highlight correct nav
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) sidebar.innerHTML = Components.sidebar(state.user.role, page);

    // Wire sidebar nav clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Render page
    const fn = pageMap[page];
    if (fn) fn();
    else DashboardPage.render();
  }

  function launch() {
    const role = state.user.role;

    document.getElementById('app').innerHTML = `
      <div id="sidebar-container">${Components.sidebar(role, 'dashboard')}</div>
      <div class="main">
        <div id="main-content"></div>
      </div>
    `;

    // Wire nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Default page
    const defaultPages = { principal: 'dashboard', teacher: 'dashboard', attender: 'dashboard' };
    navigate(defaultPages[role] || 'dashboard');
  }

  function logout() {
    localStorage.removeItem('edutrack_token');
    state.user = null;
    state.currentPage = null;
    LoginPage.render();
  }

  async function init() {
    const token = localStorage.getItem('edutrack_token');
    if (token) {
      try {
        const user = await API.auth.me();
        state.user = user;
        launch();
        return;
      } catch {
        localStorage.removeItem('edutrack_token');
      }
    }
    LoginPage.render();
  }

  return { state, navigate, launch, logout, init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
