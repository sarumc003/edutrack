// js/pages/teachers.js
const TeachersPage = (() => {
  const SUBJECTS = ['Mathematics','Science','English','History','Geography','Biology','Physics','Chemistry','Commerce','ICT','Tamil','Sinhala','Physical Education','Art'];
  const COLORS = ['#0f1f3d','#1e3a6e','#2d5a27','#5c2d0a','#1e4570','#3d1a6e','#6e1a3d','#1a6e4b','#6e4b1a','#1a4b6e'];

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading...</div>`;

    try {
      const teachers = await API.teachers.list();
      mc.innerHTML = `
        ${Components.topbar('All Teachers', `<button class="btn btn-primary" id="add-teacher-btn"><i class="ti ti-plus"></i> Add Teacher</button>`)}

        <div class="card">
          <div class="card-title">
            Teacher Directory <span class="badge-sm">${teachers.length} active</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Subject</th><th>Email</th><th>Phone</th><th>Today</th><th>Attendance</th><th></th></tr>
              </thead>
              <tbody>
                ${teachers.map(t => `<tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${Utils.avatar(t.name, t.color, 34)}
                      <div>
                        <div style="font-weight:500">${t.name}</div>
                        <div style="font-size:10px;color:var(--text3);font-family:monospace">${t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>${t.subject}</td>
                  <td style="font-size:12px;color:var(--text2)">${t.email || '—'}</td>
                  <td style="font-size:12px;color:var(--text2)">${t.phone || '—'}</td>
                  <td>${Utils.statusPill(t.today_status, !!t.active_log)}</td>
                  <td style="min-width:110px">
                    <div style="font-size:11px;margin-bottom:3px;font-weight:500;color:${Utils.pctColor(t.attendance_pct)}">${t.attendance_pct}%</div>
                    ${Utils.progBar(t.attendance_pct)}
                  </td>
                  <td>
                    <button class="btn btn-sm" data-tid="${t.id}" data-action="profile">Profile</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-teacher-btn').onclick = () => openAddModal();
      document.querySelectorAll('[data-action="profile"]').forEach(btn => {
        btn.onclick = () => openProfile(btn.dataset.tid);
      });

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  async function openProfile(tid) {
    Utils.showModal(`<div class="modal-bg" id="modal-bg">
      <div class="modal modal-lg">
        <div class="modal-hd">
          <h2><i class="ti ti-user-circle" style="margin-right:6px"></i>Teacher Profile</h2>
          <div class="close" id="modal-close"><i class="ti ti-x"></i></div>
        </div>
        <div class="modal-body" id="profile-body">
          <div style="text-align:center;padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading...</div>
        </div>
      </div>
    </div>`);

    document.getElementById('modal-close').onclick = Utils.closeModal;
    document.getElementById('modal-bg').onclick = e => { if (e.target.id === 'modal-bg') Utils.closeModal(); };

    try {
      const t = await API.teachers.get(tid);
      const balance = await API.leaves.balance(tid);
      document.getElementById('profile-body').innerHTML = buildProfileBody(t, balance);
    } catch (e) {
      document.getElementById('profile-body').innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i>${e.message}</div>`;
    }
  }

  function buildProfileBody(t, balance) {
    const calCells = [];
    const recs = {};
    (t.att_records || []).forEach(r => recs[r.date] = r.status);
    for (let i = 59; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const v = recs[ds] || '_';
      calCells.push(`<div class="att-day ${v}" title="${ds}: ${v}">${d.getDate()}</div>`);
    }

    const logRows = (t.class_logs || []).map(l => `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:0.5px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:${l.depart_time ? 'var(--text3)' : '#22c55e'};flex-shrink:0"></div>
        <div style="flex:1"><div style="font-size:12px;font-weight:500">${l.class_name}</div><div style="font-size:11px;color:var(--text2)">${l.subject}</div></div>
        <div style="font-size:11px;color:var(--text2)">${l.arrive_time}${l.depart_time ? ' → ' + l.depart_time : ' <span style="color:#22c55e">● Now</span>'}</div>
      </div>
    `).join('') || `<p style="color:var(--text2);font-size:12px">No class activity today.</p>`;

    const leaveRows = (t.leave_records || []).slice(0, 6).map(r =>
      `<tr><td>${Utils.formatDate(r.date)}</td><td><span class="pill pill-leave" style="font-size:10px">${r.leave_type}</span></td><td style="font-size:12px">${r.reason || '—'}</td></tr>`
    ).join('');

    const balanceHtml = Object.entries(balance || {}).map(([type, b]) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:80px;font-size:11px;color:var(--text2)">${type}</div>
        <div style="flex:1">
          <div class="prog-bar"><div class="prog-fill" style="width:${b.max > 0 ? Math.round(b.taken/b.max*100) : 0}%;background:var(--amber)"></div></div>
        </div>
        <div style="font-size:11px;font-weight:500;color:var(--text2)">${b.taken}/${b.max}</div>
      </div>
    `).join('');

    return `
      <div class="profile-header" style="margin:0 0 1.25rem">
        ${Utils.avatar(t.name, t.color, 72)}
        <div style="flex:1">
          <h2 style="font-size:17px">${t.name}</h2>
          <p class="meta">${t.id} &nbsp;·&nbsp; ${t.subject} Teacher &nbsp;·&nbsp; Since ${t.joined_date || '—'}</p>
          <div class="tags" style="margin-top:8px">
            <span class="tag" style="background:${t.color}15;color:${t.color}">${t.subject}</span>
            ${t.email ? `<span class="tag"><i class="ti ti-mail" style="font-size:12px"></i> ${t.email}</span>` : ''}
            ${t.phone ? `<span class="tag"><i class="ti ti-phone" style="font-size:12px"></i> ${t.phone}</span>` : ''}
          </div>
        </div>
        <div style="text-align:center;padding:1rem 1.5rem;background:var(--surface2);border-radius:12px">
          <div style="font-size:32px;font-weight:700;color:${Utils.pctColor(t.attendance_pct)}">${t.attendance_pct}%</div>
          <div style="font-size:11px;color:var(--text2);margin-top:3px">Attendance</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem">
        <div class="card" style="padding:1rem">
          <div class="card-title" style="font-size:12px">30-Day Stats</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="stat-card green" style="padding:10px"><div class="lbl">Present</div><div class="val" style="font-size:22px">${t.stats?.present_days || 0}</div></div>
            <div class="stat-card red"   style="padding:10px"><div class="lbl">Absent</div><div class="val" style="font-size:22px">${t.stats?.absent_days || 0}</div></div>
            <div class="stat-card amber" style="padding:10px"><div class="lbl">Leave</div><div class="val" style="font-size:22px">${t.stats?.leave_days || 0}</div></div>
            <div class="stat-card blue"  style="padding:10px"><div class="lbl">Work Days</div><div class="val" style="font-size:22px">${t.stats?.total_work_days || 0}</div></div>
          </div>
          <div style="margin-top:1rem">
            <div style="font-size:11px;color:var(--text2);margin-bottom:6px">Annual Leave Balance</div>
            ${balanceHtml}
          </div>
        </div>
        <div class="card" style="padding:1rem">
          <div class="card-title" style="font-size:12px">Today's Class Log</div>
          ${logRows}
        </div>
      </div>

      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-title" style="font-size:12px">
          60-Day Attendance Calendar
          <span style="font-size:10px;font-weight:400;color:var(--text2)">
            <span class="att-day P" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px">P</span> Present &nbsp;
            <span class="att-day A" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px">A</span> Absent &nbsp;
            <span class="att-day L" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px">L</span> Leave &nbsp;
            <span class="att-day H" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px">H</span> Holiday
          </span>
        </div>
        <div class="att-calendar">${calCells.join('')}</div>
      </div>

      ${leaveRows ? `<div class="card">
        <div class="card-title" style="font-size:12px">Recent Leave Records</div>
        <table><thead><tr><th>Date</th><th>Type</th><th>Reason</th></tr></thead>
        <tbody>${leaveRows}</tbody></table>
      </div>` : ''}
    `;
  }

  function openAddModal() {
    Utils.showModal(`
      <div class="modal-bg" id="modal-bg">
        <div class="modal modal-md">
          <div class="modal-hd">
            <h2><i class="ti ti-user-plus" style="margin-right:6px"></i>Add New Teacher</h2>
            <div class="close" id="modal-close"><i class="ti ti-x"></i></div>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-field">
                <label>Full Name *</label>
                <input id="at-name" placeholder="e.g. Mrs. Priya Kumari"/>
              </div>
              <div class="form-field">
                <label>Subject *</label>
                <select id="at-subj">${SUBJECTS.map(s => `<option>${s}</option>`).join('')}</select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Email</label>
                <input type="email" id="at-email" placeholder="teacher@school.lk"/>
              </div>
              <div class="form-field">
                <label>Phone</label>
                <input id="at-phone" placeholder="07X-XXXXXXX"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Joined Date</label>
                <input type="date" id="at-joined" value="${Utils.todayStr()}"/>
              </div>
              <div class="form-field">
                <label>Color</label>
                <input type="color" id="at-color" value="#0f1f3d" style="height:40px;padding:4px"/>
              </div>
            </div>
            <div style="border-top:0.5px solid var(--border);margin:1rem 0;padding-top:1rem">
              <div style="font-size:12px;font-weight:600;margin-bottom:.75rem">Login Credentials</div>
              <div class="form-row">
                <div class="form-field">
                  <label>Username *</label>
                  <input id="at-user" placeholder="login username"/>
                </div>
                <div class="form-field">
                  <label>Password *</label>
                  <input type="password" id="at-pass" placeholder="password" value="teach123"/>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="at-save"><i class="ti ti-check"></i> Add Teacher</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById('modal-close').onclick = Utils.closeModal;
    document.getElementById('modal-cancel').onclick = Utils.closeModal;
    document.getElementById('modal-bg').onclick = e => { if (e.target.id === 'modal-bg') Utils.closeModal(); };
    document.getElementById('at-save').onclick = async () => {
      const data = {
        name:        document.getElementById('at-name').value.trim(),
        subject:     document.getElementById('at-subj').value,
        email:       document.getElementById('at-email').value.trim(),
        phone:       document.getElementById('at-phone').value.trim(),
        joined_date: document.getElementById('at-joined').value,
        color:       document.getElementById('at-color').value,
        username:    document.getElementById('at-user').value.trim(),
        password:    document.getElementById('at-pass').value,
      };
      if (!data.name || !data.username || !data.password) { Utils.toast('Name, username and password required', 'error'); return; }
      try {
        await API.teachers.create(data);
        Utils.toast('Teacher added successfully!');
        Utils.closeModal();
        render();
      } catch (e) { Utils.toast(e.message, 'error'); }
    };
  }

  return { render, openProfile };
})();
