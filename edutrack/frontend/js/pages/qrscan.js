// js/pages/qrscan.js
const QRScanPage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Loading classrooms...</div>`;

    try {
      const classrooms = await API.classrooms.list();
      const user = App.state.user;
      const teacher = user.teacher;

      mc.innerHTML = `
        ${Components.topbar('QR Code Scanner')}

        <div class="notice">
          <i class="ti ti-info-circle"></i>
          <div>In production, point your phone camera at the QR code posted at each classroom door. Use the simulator below to test. Scan on <strong>arrival</strong> and again on <strong>departure</strong>.</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="card">
            <div class="card-title"><i class="ti ti-qrcode" style="margin-right:6px"></i>Classroom QR Scanner</div>

            <div class="form-field">
              <label>Select Classroom</label>
              <select id="qr-class">
                ${classrooms.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label>Scan Action</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border2);border-radius:8px;cursor:pointer;font-size:13px">
                  <input type="radio" name="scan-type" value="arrive" checked/> <i class="ti ti-login" style="color:var(--green-txt)"></i> Arrival
                </label>
                <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border2);border-radius:8px;cursor:pointer;font-size:13px">
                  <input type="radio" name="scan-type" value="depart"/> <i class="ti ti-logout" style="color:var(--red-txt)"></i> Departure
                </label>
              </div>
            </div>

            <div class="qr-box">
              <div class="qr-scan-line"></div>
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                <rect x="6" y="6" width="46" height="46" rx="5" stroke="#0f1f3d" stroke-width="4"/>
                <rect x="18" y="18" width="22" height="22" rx="3" fill="#0f1f3d"/>
                <rect x="88" y="6" width="46" height="46" rx="5" stroke="#0f1f3d" stroke-width="4"/>
                <rect x="100" y="18" width="22" height="22" rx="3" fill="#0f1f3d"/>
                <rect x="6" y="88" width="46" height="46" rx="5" stroke="#0f1f3d" stroke-width="4"/>
                <rect x="18" y="100" width="22" height="22" rx="3" fill="#0f1f3d"/>
                <rect x="64" y="64" width="12" height="12" fill="#0f1f3d"/>
                <rect x="82" y="64" width="12" height="12" fill="#0f1f3d"/>
                <rect x="100" y="64" width="12" height="12" fill="#0f1f3d"/>
                <rect x="118" y="64" width="12" height="12" fill="#0f1f3d"/>
                <rect x="64" y="82" width="12" height="12" fill="#0f1f3d"/>
                <rect x="100" y="82" width="12" height="12" fill="#0f1f3d"/>
                <rect x="64" y="100" width="12" height="12" fill="#0f1f3d"/>
                <rect x="100" y="100" width="12" height="12" fill="#0f1f3d"/>
                <rect x="118" y="100" width="12" height="12" fill="#0f1f3d"/>
                <rect x="82" y="118" width="12" height="12" fill="#0f1f3d"/>
                <rect x="118" y="118" width="12" height="12" fill="#0f1f3d"/>
              </svg>
            </div>

            <button class="btn btn-primary" id="scan-btn" style="width:100%;justify-content:center;padding:11px">
              <i class="ti ti-qrcode"></i> Simulate QR Scan
            </button>

            <div id="scan-result"></div>
          </div>

          <div class="card">
            <div class="card-title"><i class="ti ti-history" style="margin-right:6px"></i>My Scan History — Today</div>
            <div id="scan-history">
              <div style="color:var(--text2);font-size:13px;text-align:center;padding:1.5rem">
                <i class="ti ti-loader-2"></i> Loading...
              </div>
            </div>
          </div>
        </div>
      `;

      // Load scan history
      loadHistory(teacher?.id);

      // Scan button
      document.getElementById('scan-btn').onclick = async () => {
        const classroom_id = document.getElementById('qr-class').value;
        const scan_type = document.querySelector('input[name="scan-type"]:checked').value;

        const btn = document.getElementById('scan-btn');
        btn.innerHTML = '<i class="ti ti-loader-2"></i> Scanning...';
        btn.disabled = true;

        try {
          const payload = { classroom_id, scan_type };
          if (user.role !== 'teacher') payload.teacher_id = teacher?.id;

          const res = await API.classrooms.scan(payload);
          const action = scan_type === 'arrive' ? 'Arrival' : 'Departure';
          document.getElementById('scan-result').innerHTML = `
            <div class="scan-success">
              <i class="ti ti-circle-check"></i>
              <div>
                <div style="font-weight:600">${action} recorded successfully!</div>
                <div style="font-size:12px">${res.classroom} at ${res.time}</div>
              </div>
            </div>
          `;
          Utils.toast(`${action} recorded — ${res.classroom}`);
          loadHistory(teacher?.id);
        } catch (e) {
          document.getElementById('scan-result').innerHTML = `
            <div class="notice warn" style="margin-top:.75rem">
              <i class="ti ti-alert-triangle"></i> ${e.message}
            </div>
          `;
        } finally {
          btn.innerHTML = '<i class="ti ti-qrcode"></i> Simulate QR Scan';
          btn.disabled = false;
        }
      };

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i>${e.message}</div>`;
    }
  }

  async function loadHistory(teacherId) {
    if (!teacherId) return;
    try {
      const logs = await API.classrooms.logs();
      const myLogs = logs.filter(l => l.teacher_id === teacherId);
      const el = document.getElementById('scan-history');
      if (!el) return;

      if (!myLogs.length) {
        el.innerHTML = `<p style="color:var(--text2);font-size:13px;text-align:center;padding:1.5rem">No scans recorded today.</p>`;
        return;
      }

      el.innerHTML = myLogs.map(l => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid var(--border)">
          <div style="width:10px;height:10px;border-radius:50%;background:${l.depart_time ? 'var(--text3)' : '#22c55e'};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${l.class_name}</div>
            <div style="font-size:11px;color:var(--text2)">${l.subject || '—'}</div>
          </div>
          <div style="text-align:right;font-size:12px;color:var(--text2)">
            <div>In: ${l.arrive_time}</div>
            <div>${l.depart_time ? 'Out: ' + l.depart_time : '<span style="color:#22c55e">In class now</span>'}</div>
          </div>
        </div>
      `).join('');
    } catch {}
  }

  return { render };
})();
