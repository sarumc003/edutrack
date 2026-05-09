// js/pages/login.js
const LoginPage = (() => {

  function render() {
    document.getElementById('app').innerHTML = `
      <div class="login-screen">
        <div class="login-wrap">
          <div class="login-logo">
            <div class="badge"><i class="ti ti-school"></i></div>
            <h1>EduTrack School System</h1>
            <p>Teacher Attendance & Classroom Management</p>
          </div>

          <div class="login-card">
            <div class="login-tabs">
              <button class="login-tab active" data-role="principal">
                <i class="ti ti-crown"></i> Principal
              </button>
              <button class="login-tab" data-role="teacher">
                <i class="ti ti-user"></i> Teacher
              </button>
              <button class="login-tab" data-role="attender">
                <i class="ti ti-clipboard-list"></i> Attender
              </button>
            </div>

            <div class="login-field">
              <label>Username</label>
              <input type="text" id="login-user" placeholder="Enter username" value="principal" autocomplete="username"/>
            </div>
            <div class="login-field">
              <label>Password</label>
              <input type="password" id="login-pass" placeholder="Enter password" value="admin123" autocomplete="current-password"/>
            </div>

            <button class="btn-login" id="login-btn">
              <i class="ti ti-login"></i> Sign In
            </button>

            <div class="login-hint">
              principal / admin123 &nbsp;|&nbsp; attender / att123 &nbsp;|&nbsp; teachers: teach123
            </div>
          </div>
        </div>
      </div>
    `;

    // Role tab switching
    document.querySelectorAll('.login-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const role = tab.dataset.role;
        const creds = { principal: ['principal', 'admin123'], teacher: ['kamala', 'teach123'], attender: ['attender', 'att123'] };
        document.getElementById('login-user').value = creds[role][0];
        document.getElementById('login-pass').value = creds[role][1];
      });
    });

    // Login button
    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  }

  async function doLogin() {
    const btn = document.getElementById('login-btn');
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!user || !pass) { Utils.toast('Enter username and password', 'error'); return; }

    btn.innerHTML = '<i class="ti ti-loader-2"></i> Signing in...';
    btn.disabled = true;

    try {
      const data = await API.auth.login(user, pass);
      localStorage.setItem('edutrack_token', data.token);
      App.state.user = data.user;
      App.launch();
    } catch (e) {
      Utils.toast(e.message || 'Invalid credentials', 'error');
      btn.innerHTML = '<i class="ti ti-login"></i> Sign In';
      btn.disabled = false;
    }
  }

  return { render };
})();
