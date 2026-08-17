Page({
  data: {
    opinion: '',
    msg: '',
    msgType: '',
    submitting: false
  },

  onInput(e) {
    this.setData({ opinion: e.detail.value });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const content = (this.data.opinion || '').trim();
    // 全选填：允许空内容提交
    this.setData({ submitting: true, msg: '' });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      await wx.cloud.callFunction({
        name: 'submitOpinion',
        data: { content }
      });
      wx.hideLoading();
      this.setData({
        opinion: '',
        submitting: false,
        msg: '提交成功，感谢你的反馈！',
        msgType: 'ok'
      });
      setTimeout(() => this.setData({ msg: '' }), 2500);
    } catch (err) {
      wx.hideLoading();
      this.setData({
        submitting: false,
        msg: '提交失败，请稍后重试',
        msgType: 'err'
      });
      console.error(err);
    }
  }
});
