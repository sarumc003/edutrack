// js/pages/attendance.js
const AttendancePage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading...</div>`;

    try {
      const today = Utils.todayStr();
      const [records, teachers] = await Promise.all([
        API.attendance.list(today),
        API.teachers.list()
      ]);

      // Build status map
      const statusMap = {};
      records.forEach(r => statusMap[r.teacher_id] = r.status);

      mc.innerHTML = `
        ${Components.topbar('Attendance Management', `
          <button class="btn btn-primary" id="save-all-btn"><i class="ti ti-device-floppy"></i> Save All</button>
        `)}

        <div class="notice">
          <i class="ti ti-info-circle"></i>
          <div>Marking attendance for <strong>${Utils.formatDateLong()}</strong>. Changes auto-reflect in teacher profiles. Teachers also self-record via QR scan at classroom entry.</div>
        </div>

        <div class="card">
          <div class="card-title">
            Daily Attendance — ${today}
            <div style="display:flex;gap:8px">
              <button class="btn btn-sm" id="mark-all-present">All Present</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Teacher</th><th>Subject</th><th>Mark Attendance</th><th>Current Status</th><th>Overall %</th><th>Leave</th></tr>
              </thead>
              <tbody>
                ${teachers.map(t => {
                  const s = statusMap[t.id] || t.today_status || 'A';
                  return `<tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        ${Utils.avatar(t.name, t.color, 32)}
                        <div>
                          <div style="font-weight:500;font-size:13px">${t.name}</div>
                          <div style="font-size:10px;color:var(--text3)">${t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size:12px">${t.subject}</td>
                    <td>
                      <select class="att-select" data-tid="${t.id}" style="padding:5px 10px;border-radius:7px;border:0.5px solid var(--border2);background:var(--surface2);color:var(--text);font-size:12px;cursor:pointer">
                        <option value="P" ${s === 'P' ? 'selected' : ''}>✓ Present</option>
                        <option value="A" ${s === 'A' ? 'selected' : ''}>✗ Absent</option>
                        <option value="L" ${s === 'L' ? 'selected' : ''}>◷ Leave</option>
                      </select>
                    </td>
                    <td>${Utils.statusPill(s)}</td>
                    <td style="min-width:100px">
                      <div style="font-size:11px;margin-bottom:2px;color:${Utils.pctColor(t.attendance_pct)}">${t.attendance_pct}%</div>
                      ${Utils.progBar(t.attendance_pct)}
                    </td>
                    <td>
                      <button class="btn btn-sm" data-tid="${t.id}" data-action="leave" data-name="${t.name}">
                        <i class="ti ti-file-plus"></i>
                      </button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Save all
      document.getElementById('save-all-btn').onclick = async () => {
        const selects = document.querySelectorAll('.att-select');
        const records = Array.from(selects).map(s => ({ teacher_id: s.dataset.tid, status: s.value }));
        try {
          await API.attendance.bulk({ records, date: today });
          Utils.toast('Attendance saved for all teachers!');
        } catch (e) { Utils.toast(e.message, 'error'); }
      };

      // Mark all present
      document.getElementById('mark-all-present').onclick = () => {
        document.querySelectorAll('.att-select').forEach(s => s.value = 'P');
      };

      // Individual leave buttons
      document.querySelectorAll('[data-action="leave"]').forEach(btn => {
        btn.onclick = () => openLeave(teachers, btn.dataset.tid);
      });

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  function openLeave(teachers, preselect) {
    const modal = Components.leaveModal(teachers, preselect);
    document.getElementById('lv-save').onclick = async () => {
      const data = modal.getData();
      if (!data.date || !data.leave_type) { Utils.toast('Fill all required fields', 'error'); return; }
      try {
        await API.leaves.create(data);
        Utils.toast('Leave recorded!');
        Utils.closeModal();
        render();
      } catch (e) { Utils.toast(e.message, 'error'); }
    };
  }

  return { render };
})();

// Mark page for attender
const MarkPage = (() => {
  async function render() {
    return AttendancePage.render();
  }
  return { render };
})();
