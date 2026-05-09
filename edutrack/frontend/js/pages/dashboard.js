// js/pages/dashboard.js
const DashboardPage = (() => {

  async function render() {
    const role = App.state.user.role;
    if (role === 'teacher')  return ProfilePage.render();
    if (role === 'attender') return MarkPage.render();

    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading dashboard...</div>`;

    try {
      const [teachers, classrooms, summary] = await Promise.all([
        API.teachers.list(),
        API.classrooms.list(),
        API.attendance.summary(Utils.todayStr()),
      ]);

      const occupied = classrooms.filter(c => c.occupied).length;
      const freeCount = classrooms.length - occupied;

      mc.innerHTML = `
        ${Components.topbar('Principal Dashboard')}

        <div class="stat-grid">
          ${Components.statCard('Present Today',   summary.present  || 0, `of ${teachers.length} teachers`, 'green', 'ti-user-check')}
          ${Components.statCard('Absent Today',    summary.absent   || 0, 'including leave', 'red', 'ti-user-x')}
          ${Components.statCard('Classes Active',  occupied,             'currently teaching', 'blue', 'ti-building')}
          ${Components.statCard('Free Classrooms', freeCount,            'no teacher', 'amber', 'ti-door-exit')}
        </div>

        <div class="panel-grid">
          <div class="card">
            <div class="card-title">
              Live Classroom Status
              <span class="badge-sm">${classrooms.length} rooms</span>
            </div>
            <div class="class-tile-grid">
              ${classrooms.slice(0, 12).map(c => Components.classTile(c, c.current_log)).join('')}
            </div>
            <div style="text-align:center;margin-top:12px">
              <button class="btn btn-sm" id="all-cls-btn">View all classrooms →</button>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Teacher Status — Now</div>
            ${teachers.slice(0, 8).map(t => {
              const inClass = !!t.active_log;
              return Components.teacherRow(t,
                Utils.statusPill(t.today_status, inClass),
                `<button class="btn btn-sm" data-tid="${t.id}">View</button>`
              );
            }).join('')}
          </div>
        </div>

        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-title">
            All Teachers — Today's Overview
            <button class="btn btn-sm btn-primary" id="manage-teachers-btn"><i class="ti ti-users"></i> Manage</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th><th>Status</th><th>Current Class</th>
                  <th>Arrived</th><th>Attendance %</th><th></th>
                </tr>
              </thead>
              <tbody>
                ${teachers.map(t => {
                  const inClass = !!t.active_log;
                  return `<tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        ${Utils.avatar(t.name, t.color, 32)}
                        <div>
                          <div style="font-weight:500">${t.name}</div>
                          <div style="font-size:11px;color:var(--text2)">${t.subject}</div>
                        </div>
                      </div>
                    </td>
                    <td>${Utils.statusPill(t.today_status, inClass)}</td>
                    <td style="font-size:12px">${inClass ? (t.active_log.subject + ' — ' + t.active_log.class_name) : '—'}</td>
                    <td style="font-size:12px">${inClass ? t.active_log.arrive_time : '—'}</td>
                    <td style="min-width:100px">
                      <div style="font-size:11px;color:var(--text2);margin-bottom:3px">${t.attendance_pct}%</div>
                      ${Utils.progBar(t.attendance_pct)}
                    </td>
                    <td><button class="btn btn-sm" data-tid="${t.id}">Profile</button></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Events
      document.getElementById('all-cls-btn').onclick = () => App.navigate('classrooms');
      document.getElementById('manage-teachers-btn').onclick = () => App.navigate('teachers');
      document.querySelectorAll('[data-tid]').forEach(btn => {
        btn.onclick = () => TeachersPage.openProfile(btn.dataset.tid);
      });

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  return { render };
})();
