// js/pages/profile.js
const ProfilePage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    const user = App.state.user;
    const teacher = user.teacher;
    if (!teacher) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> No teacher profile linked to this account.</div>`;
      return;
    }

    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading profile...</div>`;

    try {
      const [t, balance] = await Promise.all([
        API.teachers.get(teacher.id),
        API.leaves.balance(teacher.id)
      ]);

      // Build 60-day calendar
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
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:0.5px solid var(--border)">
          <div style="width:9px;height:9px;border-radius:50%;background:${l.depart_time ? 'var(--text3)' : '#22c55e'};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${l.class_name}</div>
            <div style="font-size:11px;color:var(--text2)">${l.subject}</div>
          </div>
          <div style="text-align:right;font-size:12px;color:var(--text2)">
            ${l.arrive_time}${l.depart_time ? ' → ' + l.depart_time : ' <span style="color:#22c55e;font-weight:500">● Now</span>'}
          </div>
        </div>
      `).join('') || `<p style="color:var(--text2);font-size:13px;padding:.5rem 0">No class activity recorded today.</p>`;

      const leaveRows = (t.leave_records || []).map(r =>
        `<tr>
          <td>${Utils.formatDate(r.date)}</td>
          <td><span class="pill pill-leave" style="font-size:10px">${r.leave_type}</span></td>
          <td style="font-size:12px;color:var(--text2)">${r.reason || '—'}</td>
        </tr>`
      ).join('');

      mc.innerHTML = `
        ${Components.topbar('My Profile')}

        <div class="profile-header">
          <div class="profile-av" style="background:${t.color}20;color:${t.color}">
            ${Utils.ini(t.name)}
          </div>
          <div style="flex:1">
            <h2 style="font-size:19px;font-weight:600">${t.name}</h2>
            <p class="meta">${t.id} &nbsp;·&nbsp; ${t.subject} Teacher &nbsp;·&nbsp; Since ${t.joined_date || '—'}</p>
            <div class="tags" style="margin-top:10px">
              <span class="tag" style="background:${t.color}15;color:${t.color}">${t.subject}</span>
              <span class="tag" style="background:var(--green-bg);color:var(--green-txt)">Active</span>
              ${t.email ? `<span class="tag"><i class="ti ti-mail" style="font-size:11px"></i> ${t.email}</span>` : ''}
              ${t.phone ? `<span class="tag"><i class="ti ti-phone" style="font-size:11px"></i> ${t.phone}</span>` : ''}
            </div>
          </div>
          <div style="text-align:center;padding:1.25rem 2rem;background:var(--surface2);border-radius:14px;border:0.5px solid var(--border2)">
            <div style="font-size:36px;font-weight:700;color:${Utils.pctColor(t.attendance_pct)}">${t.attendance_pct}%</div>
            <div style="font-size:11px;color:var(--text2);margin-top:4px">Attendance Rate</div>
            <div class="prog-bar" style="width:80px;margin:6px auto 0;height:6px">
              <div class="prog-fill" style="width:${t.attendance_pct}%;background:${Utils.pctColor(t.attendance_pct)}"></div>
            </div>
          </div>
        </div>

        <div class="panel-grid">
          <div class="card">
            <div class="card-title">My Statistics</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem">
              <div class="stat-card green" style="padding:10px"><div class="lbl" style="font-size:10px">Present Days</div><div class="val" style="font-size:22px">${t.stats?.present_days || 0}</div></div>
              <div class="stat-card red"   style="padding:10px"><div class="lbl" style="font-size:10px">Absent Days</div><div class="val" style="font-size:22px">${t.stats?.absent_days || 0}</div></div>
              <div class="stat-card amber" style="padding:10px"><div class="lbl" style="font-size:10px">Leave Days</div><div class="val" style="font-size:22px">${t.stats?.leave_days || 0}</div></div>
              <div class="stat-card blue"  style="padding:10px"><div class="lbl" style="font-size:10px">Work Days</div><div class="val" style="font-size:22px">${t.stats?.total_work_days || 0}</div></div>
            </div>

            <div class="card-title" style="font-size:12px;margin-bottom:.75rem">Annual Leave Balance</div>
            ${Object.entries(balance || {}).map(([type, b]) => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
                <div style="width:72px;font-size:11px;color:var(--text2)">${type}</div>
                <div style="flex:1">
                  <div class="prog-bar" style="height:6px">
                    <div class="prog-fill" style="width:${b.max>0?Math.round(b.taken/b.max*100):0}%;background:${b.remaining===0?'#dc2626':'#f59e0b'}"></div>
                  </div>
                </div>
                <div style="font-size:11px;font-weight:600;color:var(--text2);white-space:nowrap">${b.taken}/${b.max} used</div>
                <div style="font-size:11px;color:${b.remaining===0?'var(--red-txt)':'var(--green-txt)'};font-weight:500;width:40px;text-align:right">${b.remaining} left</div>
              </div>
            `).join('')}
          </div>

          <div class="card">
            <div class="card-title">Today's Class Log</div>
            ${logRows}
          </div>
        </div>

        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-title">
            60-Day Attendance Calendar
            <span style="font-size:10px;font-weight:400;color:var(--text2)">
              <span class="att-day P" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px;margin:0 2px">P</span>Present
              <span class="att-day A" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px;margin:0 2px">A</span>Absent
              <span class="att-day L" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px;margin:0 2px">L</span>Leave
              <span class="att-day H" style="display:inline-flex;width:16px;height:16px;border-radius:3px;font-size:9px;margin:0 2px">H</span>Holiday
            </span>
          </div>
          <div class="att-calendar">${calCells.join('')}</div>
        </div>

        ${leaveRows ? `
          <div class="card">
            <div class="card-title">My Leave History</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Reason</th></tr></thead>
                <tbody>${leaveRows}</tbody>
              </table>
            </div>
          </div>
        ` : ''}
      `;

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  return { render };
})();
