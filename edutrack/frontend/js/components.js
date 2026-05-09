// js/components.js — reusable UI pieces
const Components = (() => {

  function sidebar(role, active) {
    const navs = {
      principal: [
        { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard' },
        { id: 'classrooms', icon: 'ti-building',          label: 'Classrooms' },
        { id: 'teachers',   icon: 'ti-users',             label: 'Teachers' },
        { id: 'attendance', icon: 'ti-calendar-check',    label: 'Attendance' },
        { id: 'leaves',     icon: 'ti-file-description',  label: 'Leave Records' },
        { id: 'reports',    icon: 'ti-chart-bar',         label: 'Analytics' },
        { id: 'qrprint',    icon: 'ti-qrcode',            label: 'Print QR Codes' },
      ],
      teacher: [
        { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'My Dashboard' },
        { id: 'qrscan',     icon: 'ti-qrcode',            label: 'Scan QR' },
        { id: 'profile',    icon: 'ti-user-circle',       label: 'My Profile' },
        { id: 'myatt',      icon: 'ti-calendar',          label: 'My Attendance' },
      ],
      attender: [
        { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard' },
        { id: 'mark',       icon: 'ti-clipboard-list',    label: 'Mark Attendance' },
        { id: 'leaves',     icon: 'ti-file-description',  label: 'Leave Records' },
      ]
    };

    const items = navs[role] || navs.principal;
    const user = App.state.user;
    const avatarIni = Utils.ini(user?.teacher?.name || user?.username || 'U');

    return `
      <div class="sidebar">
        <div class="sidebar-logo">
          <div class="badge"><i class="ti ti-school"></i></div>
          <h1>EduTrack</h1>
          <p>${role === 'principal' ? 'Principal Panel' : role === 'attender' ? 'Attender Panel' : 'Teacher Panel'}</p>
        </div>

        <div class="nav-section">Main</div>
        ${items.map(n => `
          <div class="nav-item ${active === n.id ? 'active' : ''}" data-page="${n.id}">
            <i class="ti ${n.icon}"></i> ${n.label}
          </div>
        `).join('')}

        <div class="nav-bottom">
          <div class="nav-item" style="opacity:.6;font-size:12px">
            ${Utils.avatar(user?.teacher?.name || user?.username, '#f5a623', 26)}
            <span style="margin-left:2px">${user?.teacher?.name?.split(' ')[0] || user?.username}</span>
          </div>
          <div class="nav-item" id="logout-btn">
            <i class="ti ti-logout"></i> Sign Out
          </div>
        </div>
      </div>`;
  }

  function topbar(title, actions = '') {
    return `
      <div class="topbar">
        <h1>${title}</h1>
        <div class="topbar-right">
          <div class="date-chip"><i class="ti ti-calendar"></i> ${Utils.formatDateLong()}</div>
          ${actions}
        </div>
      </div>`;
  }

  function statCard(label, value, sub = '', variant = '', icon = '') {
    return `
      <div class="stat-card ${variant}">
        <div class="lbl">${icon ? `<i class="ti ${icon}"></i>` : ''} ${label}</div>
        <div class="val">${value}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ''}
      </div>`;
  }

  function teacherRow(t, statusHtml, extra = '') {
    return `
      <div class="teacher-row">
        ${Utils.avatar(t.name, t.color, 34)}
        <div class="info">
          <div class="name">${t.name}</div>
          <div class="sub">${t.subject}</div>
        </div>
        ${statusHtml}
        ${extra}
      </div>`;
  }

  function classTile(cls, log) {
    const occupied = log && !log.depart_time;
    return `
      <div class="class-tile ${occupied ? 'occupied' : 'free'}">
        <div class="cname">
          <span class="dot" style="background:${occupied ? '#22c55e' : '#ef4444'}"></span>
          ${cls.name}
        </div>
        <div class="cinfo">${occupied ? (log.teacher_name || '') + ' · ' + (log.subject || '') : 'Free period'}</div>
        ${occupied && log.arrive_time ? `<div class="cinfo" style="margin-top:3px">In: ${log.arrive_time}${log.depart_time ? ' → ' + log.depart_time : ''}</div>` : ''}
      </div>`;
  }

  function leaveModal(teachers, preselect) {
    const today = Utils.todayStr();
    Utils.showModal(`
      <div class="modal-bg" id="modal-bg">
        <div class="modal modal-sm">
          <div class="modal-hd">
            <h2><i class="ti ti-file-plus" style="margin-right:6px"></i>Record Leave</h2>
            <div class="close" id="modal-close"><i class="ti ti-x"></i></div>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Teacher</label>
              <select id="lv-teacher">
                ${teachers.map(t => `<option value="${t.id}" ${t.id === preselect ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Date</label>
                <input type="date" id="lv-date" value="${today}"/>
              </div>
              <div class="form-field">
                <label>Leave Type</label>
                <select id="lv-type">
                  <option>Medical</option>
                  <option>Casual</option>
                  <option>Duty</option>
                  <option>Annual</option>
                  <option>No Pay</option>
                </select>
              </div>
            </div>
            <div class="form-field">
              <label>Reason / Notes</label>
              <textarea id="lv-reason" placeholder="Brief reason for leave..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="lv-save"><i class="ti ti-check"></i> Save Leave</button>
          </div>
        </div>
      </div>
    `);
    document.getElementById('modal-close').onclick = Utils.closeModal;
    document.getElementById('modal-cancel').onclick = Utils.closeModal;
    document.getElementById('modal-bg').onclick = e => { if (e.target.id === 'modal-bg') Utils.closeModal(); };
    return {
      getData: () => ({
        teacher_id: document.getElementById('lv-teacher').value,
        date: document.getElementById('lv-date').value,
        leave_type: document.getElementById('lv-type').value,
        reason: document.getElementById('lv-reason').value
      })
    };
  }

  return { sidebar, topbar, statCard, teacherRow, classTile, leaveModal };
})();
