// app.js —— 小程序入口，初始化云开发
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      // 云开发环境 ID（来自云开发控制台）
      env: 'cloud1-d7gcmmc7p4d1eb639',
      traceUser: true
    });
  }
});
