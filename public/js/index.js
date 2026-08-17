(function () {
  'use strict';

  const form = document.getElementById('surveyForm');
  const msg = document.getElementById('msg');
  let previewMode = false; // 后端不可用时为预览版

  // 自动检测后端是否可用；不可用时进入“预览版”，避免提交无反应
  async function detectBackend() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch('/api/me', { signal: ctrl.signal });
      clearTimeout(t);
      const d = await r.json().catch(() => null);
      previewMode = !(d && typeof d.authed === 'boolean');
    } catch (e) {
      previewMode = true;
    }
    if (previewMode) {
      const banner = document.createElement('div');
      banner.className = 'preview-banner';
      banner.innerHTML =
        '⚠️ 当前为<b>预览版</b>：仅展示界面，提交与数据保存需在完整部署（带后端）后使用。';
      const card = document.querySelector('.form-card');
      if (card) card.insertBefore(banner, card.firstChild);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'msg';

    // 匿名收集：仅意见一项，全部选填
    const opinion = document.getElementById('opinion').value.trim();
    const payload = { opinion };

    if (previewMode) {
      msg.textContent = '当前为预览版，提交功能需在完整部署（带后端）后使用。';
      msg.className = 'msg err';
      return;
    }

    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || '提交失败');
      }
      form.reset();
      msg.textContent = '✅ 提交成功，感谢您的反馈！';
      msg.className = 'msg ok';
    } catch (err) {
      msg.textContent = err.message || '提交失败，请稍后重试';
      msg.className = 'msg err';
    }
  });

  detectBackend();
})();
