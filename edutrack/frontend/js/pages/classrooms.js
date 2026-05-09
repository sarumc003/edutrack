// js/pages/classrooms.js
const ClassroomsPage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading classrooms...</div>`;

    try {
      const classrooms = await API.classrooms.list();
      const occupied = classrooms.filter(c => c.occupied).length;

      mc.innerHTML = `
        ${Components.topbar('Classroom Status')}

        <div class="stat-grid">
          ${Components.statCard('Occupied', occupied, 'teacher in class', 'green', 'ti-building')}
          ${Components.statCard('Free', classrooms.length - occupied, 'no teacher', 'red', 'ti-door-exit')}
          ${Components.statCard('Total', classrooms.length, 'all classrooms', '', 'ti-school')}
          ${Components.statCard('Gr. 12–13', classrooms.filter(c => c.grade >= 12).length, 'advanced level', 'blue', 'ti-certificate')}
        </div>

        <div class="card">
          <div class="card-title">
            All Classrooms — Live Status
            <div style="display:flex;gap:8px">
              <span style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:4px">
                <span class="dot" style="background:#22c55e"></span>Occupied
                <span class="dot" style="background:#ef4444;margin-left:8px"></span>Free
              </span>
            </div>
          </div>
          <div class="class-tile-grid">
            ${classrooms.map(c => {
              const occ = c.occupied;
              const l = c.current_log;
              return `<div class="class-tile ${occ ? 'occupied' : 'free'}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                  <div class="cname">${c.name}</div>
                  <span style="font-size:9px;color:var(--text3);font-family:monospace">${c.id}</span>
                </div>
                ${occ
                  ? `<div class="cinfo" style="font-weight:500;color:var(--green-txt)">${l.teacher_name}</div>
                     <div class="cinfo">${l.subject}</div>
                     <div class="cinfo">In: ${l.arrive_time}${l.depart_time ? ' → ' + l.depart_time : ' <span style="color:#22c55e">●</span>'}</div>`
                  : `<div class="cinfo">Free period</div>`
                }
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card" style="margin-top:1.25rem">
          <div class="card-title">Today's Class Log</div>
          <div class="table-wrap" id="logs-table">
            <div style="color:var(--text2);font-size:13px;padding:1rem 0;text-align:center">
              <i class="ti ti-loader-2"></i> Loading logs...
            </div>
          </div>
        </div>
      `;

      // Load today's logs
      const logs = await API.classrooms.logs();
      const logsTable = document.getElementById('logs-table');
      if (!logs.length) {
        logsTable.innerHTML = `<p style="color:var(--text2);font-size:13px;text-align:center;padding:1.5rem">No class logs recorded today.</p>`;
      } else {
        logsTable.innerHTML = `<table>
          <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Arrived</th><th>Departed</th><th>Duration</th></tr></thead>
          <tbody>
            ${logs.map(l => {
              let duration = '—';
              if (l.arrive_time && l.depart_time) {
                const [ah, am] = l.arrive_time.split(':').map(Number);
                const [dh, dm] = l.depart_time.split(':').map(Number);
                const mins = (dh * 60 + dm) - (ah * 60 + am);
                duration = `${mins} min`;
              }
              return `<tr>
                <td style="font-weight:500">${l.teacher_name}</td>
                <td>${l.class_name}</td>
                <td>${l.subject || '—'}</td>
                <td>${l.arrive_time}</td>
                <td>${l.depart_time || `<span style="color:#22c55e;font-size:11px">In class</span>`}</td>
                <td style="font-size:12px;color:var(--text2)">${duration}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
      }

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  return { render };
})();
