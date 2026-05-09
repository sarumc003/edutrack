// js/pages/leaves.js
const LeavesPage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading...</div>`;

    try {
      const [leaves, teachers] = await Promise.all([
        API.leaves.list(),
        API.teachers.list()
      ]);

      mc.innerHTML = `
        ${Components.topbar('Leave Management', `
          <button class="btn btn-primary" id="add-leave-btn"><i class="ti ti-plus"></i> Add Leave</button>
        `)}

        <div class="stat-grid">
          ${Components.statCard('Total Leaves', leaves.length, 'all time', '', 'ti-file-description')}
          ${Components.statCard('Medical', leaves.filter(l=>l.leave_type==='Medical').length, 'leaves', 'red', 'ti-stethoscope')}
          ${Components.statCard('Casual', leaves.filter(l=>l.leave_type==='Casual').length, 'leaves', 'amber', 'ti-calendar-off')}
          ${Components.statCard('Duty', leaves.filter(l=>l.leave_type==='Duty').length, 'leaves', 'blue', 'ti-briefcase')}
        </div>

        <div class="card">
          <div class="card-title">
            Leave Records
            <span class="badge-sm">${leaves.length} records</span>
          </div>
          ${leaves.length ? `
            <div class="table-wrap">
              <table>
                <thead><tr><th>Teacher</th><th>Subject</th><th>Date</th><th>Type</th><th>Reason</th><th>Approved By</th><th></th></tr></thead>
                <tbody>
                  ${leaves.map(l => `<tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        ${Utils.avatar(l.teacher_name, teachers.find(t=>t.id===l.teacher_id)?.color||'#0f1f3d', 28)}
                        <span style="font-size:13px;font-weight:500">${l.teacher_name}</span>
                      </div>
                    </td>
                    <td style="font-size:12px">${l.subject||'—'}</td>
                    <td style="font-size:12px">${Utils.formatDate(l.date)}</td>
                    <td><span class="pill pill-leave" style="font-size:10px">${l.leave_type}</span></td>
                    <td style="font-size:12px;color:var(--text2);max-width:200px">${l.reason||'—'}</td>
                    <td style="font-size:12px;color:var(--text2)">${l.approved_by||'—'}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" data-id="${l.id}">
                        <i class="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="text-align:center;padding:3rem;color:var(--text2)">
              <i class="ti ti-file-off" style="font-size:40px;display:block;margin-bottom:1rem;opacity:.3"></i>
              No leave records yet. Click "Add Leave" to record one.
            </div>
          `}
        </div>
      `;

      document.getElementById('add-leave-btn').onclick = () => openLeaveModal(teachers);
      document.querySelectorAll('[data-id]').forEach(btn => {
        btn.onclick = async () => {
          if (!Utils.confirm('Delete this leave record?')) return;
          try {
            await API.leaves.delete(btn.dataset.id);
            Utils.toast('Leave record deleted');
            render();
          } catch (e) { Utils.toast(e.message, 'error'); }
        };
      });

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  function openLeaveModal(teachers) {
    const modal = Components.leaveModal(teachers, null);
    document.getElementById('lv-save').onclick = async () => {
      const data = modal.getData();
      if (!data.teacher_id || !data.date || !data.leave_type) {
        Utils.toast('Fill all required fields', 'error'); return;
      }
      try {
        await API.leaves.create(data);
        Utils.toast('Leave recorded successfully!');
        Utils.closeModal();
        render();
      } catch (e) { Utils.toast(e.message, 'error'); }
    };
  }

  return { render };
})();
