// index.ts
// 获取应用实例
const items = require('../../utils/items.js')
Page({
  data: {
    item2: [],
  },
  /*
  goToDetail:function(){
  wx.navigateTo({
    url:'/pages/detail/detail',
  })*/
  onLoad:function(){ 
  this.setData({
    item2:items
  })
},
})