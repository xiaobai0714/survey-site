(function () {
  'use strict';

  const form = document.getElementById('surveyForm');
  const msg = document.getElementById('msg');
  const stars = document.getElementById('stars');
  const satisfInput = document.getElementById('satisfaction');
  const starLabel = document.getElementById('starLabel');
  const labels = ['', '很不满意', '不满意', '一般', '满意', '非常满意'];
  let rating = 0;
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

  function paint(n) {
    Array.from(stars.children).forEach((s, i) => s.classList.toggle('active', i < n));
    starLabel.textContent = n ? labels[n] : '请选择您的满意度';
  }

  stars.addEventListener('mouseover', (e) => {
    if (e.target.dataset.v) paint(+e.target.dataset.v);
  });
  stars.addEventListener('mouseleave', () => paint(rating));
  stars.addEventListener('click', (e) => {
    if (e.target.dataset.v) {
      rating = +e.target.dataset.v;
      satisfInput.value = rating;
      paint(rating);
    }
  });
  paint(0);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'msg';

    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const occupation = document.getElementById('occupation').value.trim();
    const effect = document.getElementById('effect').value;
    const opinion = document.getElementById('opinion').value.trim();

    if (!name || !age || !occupation || !rating || !effect) {
      msg.textContent = '请填写所有必填项（姓名、年龄、职业、满意度、使用效果）';
      msg.className = 'msg err';
      return;
    }
    const numericAge = Number(age);
    if (!Number.isFinite(numericAge) || numericAge <= 0 || numericAge > 150) {
      msg.textContent = '请填写有效的年龄（1-150）';
      msg.className = 'msg err';
      return;
    }

    const payload = { name, age, occupation, satisfaction: rating, effect, opinion };

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
      rating = 0;
      satisfInput.value = '';
      paint(0);
      msg.textContent = '✅ 提交成功，感谢您的参与！';
      msg.className = 'msg ok';
    } catch (err) {
      msg.textContent = err.message || '提交失败，请稍后重试';
      msg.className = 'msg err';
    }
  });

  detectBackend();
})();
