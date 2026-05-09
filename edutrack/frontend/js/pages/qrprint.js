// js/pages/qrscan.js (QR print section appended separately as QRPrintPage)
const QRPrintPage = (() => {

  async function render() {
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div style="padding:2rem;color:var(--text2)"><i class="ti ti-loader-2"></i> Generating QR codes for all classrooms...</div>`;

    try {
      const classrooms = await API.classrooms.qrAll();

      mc.innerHTML = `
        ${Components.topbar('Print QR Codes', `
          <button class="btn btn-primary no-print" onclick="window.print()">
            <i class="ti ti-printer"></i> Print All QR Codes
          </button>
        `)}

        <div class="notice no-print">
          <i class="ti ti-info-circle"></i>
          <div>Print these QR codes and paste them on each classroom door. Teachers scan on arrival and departure using their phone or the classroom tablet.</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          ${classrooms.map(c => `
            <div class="qr-print-page card" style="text-align:center;padding:1.5rem">
              <div style="font-size:18px;font-weight:700;color:var(--navy);margin-bottom:4px">${c.name}</div>
              <div style="font-size:11px;color:var(--text2);margin-bottom:1rem;font-family:monospace">ID: ${c.id}</div>
              <img src="${c.qr}" alt="QR for ${c.name}" style="width:180px;height:180px;border-radius:10px;border:2px solid var(--navy)"/>
              <div style="margin-top:1rem;font-size:11px;color:var(--text2)">Scan to record attendance</div>
              <div style="font-size:10px;color:var(--text3);margin-top:4px">EduTrack School System</div>
            </div>
          `).join('')}
        </div>
      `;

    } catch (e) {
      mc.innerHTML = `<div class="notice warn"><i class="ti ti-alert-triangle"></i> ${e.message}</div>`;
    }
  }

  return { render };
})();
