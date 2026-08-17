(function () {
  'use strict';

  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashView');
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMsg');
  const tbody = document.querySelector('#tbl tbody');
  const search = document.getElementById('search');
  const countEl = document.getElementById('count');
  let allItems = [];

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function fmt(t) {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t || '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const items = allItems.filter((it) => !q || String(it.opinion || '').toLowerCase().includes(q));
    countEl.textContent = `共 ${items.length} 条`;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="2" class="empty">暂无符合条件的意见</td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map(
        (it) => `<tr>
        <td>${fmt(it.submittedAt)}</td>
        <td>${it.opinion ? escapeHtml(it.opinion) : '<span style="color:#9ca3af">（空）</span>'}</td>
      </tr>`
      )
      .join('');
  }

  async function showDash() {
    loginView.style.display = 'none';
    dashView.style.display = 'block';
    try {
      const r = await fetch('/api/submissions');
      if (r.status === 401) {
        loginView.style.display = 'block';
        dashView.style.display = 'none';
        return;
      }
      const d = await r.json();
      allItems = d.items || [];
      render();
    } catch (e) {
      loginView.style.display = 'block';
      dashView.style.display = 'none';
    }
  }

  async function checkAuth() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch('/api/me', { signal: ctrl.signal });
      clearTimeout(t);
      const d = await r.json().catch(() => null);
      if (d && typeof d.authed === 'boolean') {
        if (d.authed) showDash();
        else {
          loginView.style.display = 'block';
          dashView.style.display = 'none';
        }
        return;
      }
      showPreviewNotice();
    } catch (e) {
      showPreviewNotice();
    }
  }

  function showPreviewNotice() {
    loginView.style.display = 'block';
    dashView.style.display = 'none';
    if (document.getElementById('previewNotice')) return;
    const n = document.createElement('div');
    n.id = 'previewNotice';
    n.className = 'preview-banner';
    n.innerHTML =
      '⚠️ 当前为<b>预览版</b>：管理后台需在完整部署（带后端）后访问。本地运行 <code>node server.js</code> 即可使用。';
    loginView.insertBefore(n, loginView.firstChild);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = '';
    loginMsg.className = 'msg';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || '登录失败');
      }
      showDash();
    } catch (err) {
      loginMsg.textContent = err.message;
      loginMsg.className = 'msg err';
    }
  });

  search.addEventListener('input', render);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    allItems = [];
    checkAuth();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    if (!allItems.length) return;
    const headers = ['提交时间', '意见'];
    const rows = allItems.map((it) => [fmt(it.submittedAt), it.opinion || '']);
    const csv =
      '﻿' +
      [headers, ...rows]
        .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '意见记录.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });

  checkAuth();
})();
