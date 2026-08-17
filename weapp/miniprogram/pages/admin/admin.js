function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => ('0' + n).slice(-2);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Page({
  data: {
    authed: false,
    password: '',
    err: '',
    logging: false,
    list: [],
    keyword: ''
  },

  onPwd(e) {
    this.setData({ password: e.detail.value });
  },
  onSearch(e) {
    this.setData({ keyword: e.detail.value });
  },

  async onLogin() {
    if (this.data.logging) return;
    const password = (this.data.password || '').trim();
    if (!password) {
      this.setData({ err: '请输入密码' });
      return;
    }
    this.setData({ logging: true, err: '' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'listOpinions',
        data: { password }
      });
      const result = res.result || {};
      if (result.error) {
        this.setData({ logging: false, err: result.error });
        return;
      }
      const list = (result.list || []).map((o) => ({
        _id: o._id,
        content: o.content,
        timeText: fmtTime(o.ts)
      }));
      this.setData({ logging: false, authed: true, list });
    } catch (err) {
      this.setData({ logging: false, err: '登录失败，请重试' });
      console.error(err);
    }
  },

  async doSearch() {
    if (!this.data.authed) return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'listOpinions',
        data: { password: this.data.password, keyword: this.data.keyword }
      });
      const result = res.result || {};
      const list = (result.list || []).map((o) => ({
        _id: o._id,
        content: o.content,
        timeText: fmtTime(o.ts)
      }));
      this.setData({ list });
    } catch (err) {
      console.error(err);
    }
  },

  onLogout() {
    this.setData({ authed: false, list: [], keyword: '', password: '', err: '' });
  }
});
