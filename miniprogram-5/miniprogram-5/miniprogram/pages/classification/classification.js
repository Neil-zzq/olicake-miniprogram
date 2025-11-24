// pages/classification/classification.ts
const items = require('../../utils/items.js')
Page({
  data: {
    vtabs: [],
    vcontents: []
  },
  onLoad(options) {
    this.initTab();
 },
 //初始化tab
 initTab: function(){
  var vtabs = items.map(item => ({title: item.category_name}));
  this.setData({
    vtabs: vtabs
  });
  this.setData({
    vcontents: items
  });
},


  
  /**
   * 生命周期函数--监听页面加载
   */
  /*
  onTap:function(e){
      
      for (let i = 0;i < items3.length;i++ ){
        let item = items3[i];
        var currentSection = [];
        if(items.groups === e._relatedInfo.anchorTargetText){
          currentSection.push(item);
        }
        
      }
      console.log(currentSection)
    },
    */

   /**
   * 用户点击左侧菜单时间
   */
  /*
  onTap:function (e) {
    console.log(e._relatedInfo.anchorTargetText)
    this.setData({
      currentSecName:e.currentTarget.dataset.current,
      currentSection:cate[e.currentTarget.dataset.current]
    })
  },
 */

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})