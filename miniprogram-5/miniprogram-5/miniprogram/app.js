// app.ts
App({
  onLaunch: function () {
    wx.cloud.init({
      // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      env: 'cloud1-0gggau3xd319b71f',
      // 是否在将用户访问记录到用户管理中，在控制台中可见，默认为false
      traceUser: true,
    });
  },
})