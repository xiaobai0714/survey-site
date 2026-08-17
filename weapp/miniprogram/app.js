// app.js —— 小程序入口，初始化云开发
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      // 把下面的 'YOUR_ENV_ID' 替换成你在云开发控制台看到的环境 ID
      env: 'YOUR_ENV_ID',
      traceUser: true
    });
  }
});
