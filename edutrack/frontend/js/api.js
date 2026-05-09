// js/api.js — centralised API client
const API = (() => {
  const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://YOUR-APP-NAME.up.railway.app/api';
  function getToken() { return localStorage.getItem('edutrack_token'); }

  async function req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body)  opts.body = JSON.stringify(body);

    const res = await fetch(BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  return {
    get:    (path)        => req('GET',    path),
    post:   (path, body)  => req('POST',   path, body),
    put:    (path, body)  => req('PUT',    path, body),
    delete: (path)        => req('DELETE', path),

    auth: {
      login: (u, p) => req('POST', '/auth/login', { username: u, password: p }),
      me:    ()     => req('GET',  '/auth/me'),
    },
    teachers: {
      list:   ()      => req('GET', '/teachers'),
      get:    (id)    => req('GET', `/teachers/${id}`),
      create: (data)  => req('POST', '/teachers', data),
      update: (id, d) => req('PUT',  `/teachers/${id}`, d),
      delete: (id)    => req('DELETE', `/teachers/${id}`),
    },
    attendance: {
      list:     (date) => req('GET', `/attendance?date=${date}`),
      summary:  (date) => req('GET', `/attendance/summary?date=${date}`),
      mark:     (data) => req('POST', '/attendance', data),
      bulk:     (data) => req('POST', '/attendance/bulk', data),
      teacher:  (id)   => req('GET', `/attendance/teacher/${id}`),
    },
    classrooms: {
      list:    ()     => req('GET', '/classrooms'),
      qr:      (id)   => req('GET', `/classrooms/${id}/qr`),
      qrAll:   ()     => req('GET', '/classrooms/qr/all'),
      scan:    (data) => req('POST', '/classrooms/scan', data),
      logs:    ()     => req('GET', '/classrooms/logs/today'),
    },
    leaves: {
      list:    (tid)  => req('GET', `/leaves${tid ? '?teacher_id=' + tid : ''}`),
      create:  (data) => req('POST', '/leaves', data),
      balance: (id)   => req('GET', `/leaves/balance/${id}`),
      delete:  (id)   => req('DELETE', `/leaves/${id}`),
    },
    reports: {
      overview:     () => req('GET', '/reports/overview'),
      lowAttendance: (t) => req('GET', `/reports/low-attendance?threshold=${t||80}`),
    }
  };
})();
