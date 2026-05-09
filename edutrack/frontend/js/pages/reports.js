// js/pages/reports.js
const ReportsPage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading analytics...</div>`;

    try {
      const [overview, low] = await Promise.all([
        API.reports.overview(),
        API.reports.lowAttendance(80)
      ]);

      const t = overview.today || {};
      const c = overview.classrooms || {};
      const teacherAtt = overview.teacher_attendance || [];
      const monthly = overview.monthly_trend || [];

      mc.innerHTML = `
        ${Components.topbar('Reports & Analytics')}

        <div class="stat-grid">
          ${Components.statCard('Avg Attendance', (teacherAtt.reduce((a,t)=>a+(t.pct||0),0)/Math.max(teacherAtt.length,1)).toFixed(0)+'%', 'all teachers', 'blue', 'ti-chart-bar')}
          ${Components.statCard('Below 80%', low.length, 'need attention', 'red', 'ti-alert-circle')}
          ${Components.statCard('Perfect (≥95%)', teacherAtt.filter(t=>(t.pct||0)>=95).length, 'teachers', 'green', 'ti-star')}
          ${Components.statCard('Leave Records', (overview.subject_coverage||[]).length, 'subjects active', '', 'ti-file-description')}
        </div>

        <div class="panel-grid">
          <div class="card">
            <div class="card-title">Individual Attendance Rates</div>
            ${teacherAtt.map(t => `
              <div class="rep-bar-row">
                <div class="name" title="${t.name}">${t.name.split(' ').slice(-1)[0]}, ${t.subject}</div>
                <div class="bar">
                  <div class="prog-bar" style="height:7px">
                    <div class="prog-fill" style="width:${t.pct||0}%;background:${Utils.pctColor(t.pct||0)}"></div>
                  </div>
                </div>
                <div class="pct" style="color:${Utils.pctColor(t.pct||0)}">${t.pct||0}%</div>
              </div>
            `).join('')}
          </div>

          <div class="card">
            <div class="card-title">Monthly Trend (Last 6 Months)</div>
            ${monthly.length ? `
              <div style="display:flex;align-items:flex-end;gap:8px;height:100px;margin-top:.5rem">
                ${monthly.map(m => `
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div style="font-size:10px;color:var(--text2);font-weight:500">${m.avg_pct||0}%</div>
                    <div style="width:100%;border-radius:4px 4px 0 0;background:${Utils.pctColor(m.avg_pct||0)};opacity:.85"
                         style="height:${Math.max(4,(m.avg_pct||0))}px"
                         title="${m.month}: ${m.avg_pct||0}%">
                      &nbsp;
                    </div>
                    <div style="font-size:9px;color:var(--text3)">${m.month?.slice(5)}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color:var(--text2);font-size:13px">Not enough historical data yet.</p>'}

            <div class="card-title" style="margin-top:1.5rem">Subject Coverage Today</div>
            ${(overview.subject_coverage||[]).slice(0,8).map(s => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:0.5px solid var(--border)">
                <span style="font-size:12px">${s.subject}</span>
                <span class="pill ${s.classes_today>0?'pill-present':'pill-absent'}" style="font-size:10px">
                  ${s.classes_today} class${s.classes_today!==1?'es':''}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        ${low.length ? `
          <div class="card">
            <div class="card-title" style="color:var(--red-txt)">
              <i class="ti ti-alert-circle" style="margin-right:6px"></i>
              Teachers Below 80% Attendance
              <span class="badge-sm">${low.length} teachers</span>
            </div>
            <div class="notice warn" style="margin-bottom:1rem">
              <i class="ti ti-alert-triangle"></i>
              These teachers may need counselling or review. Minimum attendance requirement is typically 80%.
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Teacher</th><th>Subject</th><th>Present</th><th>Absent</th><th>Leave</th><th>Attendance %</th></tr></thead>
                <tbody>
                  ${low.map(t => `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px">
                      <div class="av" style="width:30px;height:30px;font-size:10px;background:#ef444420;color:#dc2626">${Utils.ini(t.name)}</div>
                      <div>
                        <div style="font-weight:500">${t.name}</div>
                        <div style="font-size:10px;color:var(--text3)">${t.email||''}</div>
                      </div>
                    </div></td>
                    <td>${t.subject}</td>
                    <td style="color:var(--green-txt);font-weight:500">${t.present_days||0}</td>
                    <td style="color:var(--red-txt);font-weight:500">${t.absent_days||0}</td>
                    <td style="color:var(--amber-txt);font-weight:500">${t.leave_days||0}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="flex:1;min-width:60px">${Utils.progBar(t.pct||0)}</div>
                        <span style="font-size:12px;font-weight:600;color:${Utils.pctColor(t.pct||0)}">${t.pct||0}%</span>
                      </div>
                    </td>
                  </tr>`).join('')}
                </tbody>
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
