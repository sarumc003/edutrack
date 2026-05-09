// js/utils.js
const Utils = (() => {
  function ini(name) {
    return (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(ds) {
    if (!ds) return '—';
    return new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateLong() {
    return new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function pctColor(p) {
    if (p >= 85) return '#16a34a';
    if (p >= 70) return '#d97706';
    return '#dc2626';
  }

  function statusPill(status, inClass) {
    if (inClass) return `<span class="pill pill-inclass"><i class="ti ti-door-enter"></i> In Class</span>`;
    const map = {
      P: `<span class="pill pill-present"><i class="ti ti-check"></i> Present</span>`,
      A: `<span class="pill pill-absent"><i class="ti ti-x"></i> Absent</span>`,
      L: `<span class="pill pill-leave"><i class="ti ti-calendar-off"></i> Leave</span>`,
      H: `<span class="pill pill-holiday">Holiday</span>`,
    };
    return map[status] || `<span class="pill pill-absent">Absent</span>`;
  }

  function toast(msg, type = 'success') {
    const icons = { success: 'ti-circle-check', error: 'ti-alert-circle', warn: 'ti-alert-triangle' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="ti ${icons[type] || icons.success}"></i> ${msg}`;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 350); }, 3000);
  }

  function confirm(msg) {
    return window.confirm(msg);
  }

  function avatar(name, color, size = 34) {
    const fs = Math.round(size * 0.35);
    return `<div class="av" style="width:${size}px;height:${size}px;font-size:${fs}px;background:${color}20;color:${color}">${ini(name)}</div>`;
  }

  function progBar(pct, height = 5) {
    return `<div class="prog-bar" style="height:${height}px"><div class="prog-fill" style="width:${pct}%;background:${pctColor(pct)}"></div></div>`;
  }

  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  }

  function showModal(html) {
    document.getElementById('modal-root').innerHTML = html;
  }

  return { ini, todayStr, formatDate, formatDateLong, pctColor, statusPill, toast, confirm, avatar, progBar, closeModal, showModal };
})();
