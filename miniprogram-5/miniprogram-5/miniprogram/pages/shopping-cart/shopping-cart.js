// pages/shopping-cart/shopping-cart.ts
Page({

  /**
   * 页面的初始数据 
   */
  data: {
      num:1,
      price:328,
      selectAll:false,
      cart:[],
      totalCount:0,
      totalPrice:0,
      touch:{
        cartId:0,
        start:0
      },
      showBottomModal:true,
  },
  subNum:function (e) {
    let cart = this.data.cart
    for(var i in cart){
      if(cart[i].id == e.currentTarget.dataset.id){
        cart[i].total = cart[i].total<=1? 1: cart[i].total - 1
        this.setData({
          cart:cart
        })
        this.onSummary()
      }
    }
  },
  addNum:function(e){
    let cart = this.data.cart
    for(var i in cart){
      if(cart[i].id == e.currentTarget.dataset.id){
        cart[i].total += 1
        this.setData({
          cart:cart
        })
        this.onSummary()
      }
    }
  },
  

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.onRefresh()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.onRefresh()
  },

  /**
   * 事件函数--监听页面跳转到详情页
   */
  switchToDetail:function(e) {
     wx.navigateTo({
       url: '/pages/detail/detail?id='+e.currentTarget.dataset.id,
     })
  },
  orderConfirm:function(e) {
    wx.navigateTo({
      url: '/pages/orderconfirm/orderconfirm'
    })
  },

  /** 
   * 生命周期函数--监听页面刷新
   */
  onRefresh:function() {
    wx.getStorage({
      key:"cart",
      success:res =>{
        let cart = res.data
        for (var i in cart){
          cart[i].selected = true
          cart[i].showDelBtn =false
        }
        this.setData({
          cart:cart
        })
        this.onSummary()
            }
    })
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onSummary:function() {
     let cart = this.data.cart
     let totalPrice = 0
     let totalCount = 0
     for (var i in cart){
       if (cart[i].selected){
        totalPrice += cart[i].Price * cart[i].total
        totalCount += 1
        this.setData({
          totalPrice : totalPrice,
          totalCount : totalCount
        })
        wx.setStorage({
          data:{
            totalCount: this.data.totalCount,
            totalPrice: this.data.totalPrice} ,
          key:'total',
        })
       }
     }
  },

  /**
   * 页面函数-监听全选按钮
   */
  onSelectAll:function(){
    let cart = this.data.cart
    let selectAll=this.data.selectAll
    let totalPrice = this.data.totalPrice
     let totalCount = this.data.totalCount
    if(this.data.selectAll == false){
      for (var j in cart){
        cart[j].selected = true
        this.setData({
         cart:cart,
         selectAll:!selectAll
        })
      }
     }
     else{
      for (var j in cart){
        cart[j].selected = false
        this.setData({
         cart:cart,
         selectAll:!selectAll,
         totalPrice: 0,
         totalCount: 0
        })
      }
     }
     this.onSummary()
  },
  onSelectCard:function(e){
    console.log(e)
     let cart = this.data.cart
     for(var k in cart){
       if(cart[k].cartId == e.currentTarget.dataset.id){
        cart[k].selected=!cart[k].selected
        this.setData({
          cart:cart
        })
        this.onSummary()
       }
       
     }

  },
/**
   * 监听商品卡片开始
   */
  onTouchStart:function(e){

   let touch ={
     cartId:e.currentTarget.dataset.id,
     start:e.changedTouches[0].clientX
   }
   let cart =this.data.cart
    for(var i in cart) {
      cart[i].showDelBtn = false
    }
    this.setData({
      cart:cart,
      touch:touch
    })
  
  }
,
/**
   * 监听商品卡片滑动
   */
  onTouchMove:function(e){
    
let cart = this.data.cart
if(this.data.touch.start - e.changedTouches[0].clientX >100){
  for(var i in cart){
    if (this.data.touch.cartId == cart[i].cartId){
      cart[i].showDelBtn = true
    }
  }
}else if(e.changedTouches[0].clientX -this.data.touch.start >100){
  for(var i in cart){
    if (this.data.touch.cartId == e.currentTarget.dataset.id){
      cart[i].showDelBtn = false
    }
}}
this.setData({
  cart:cart
})
  },
 /**
   * 监听商品卡片删除
   */
  onDeleteCard:function(e){
    let cart = this.data.cart
    for(var i in cart ){
      if(cart[i].cartId == e.currentTarget.dataset.id){
        cart.splice(i,1)
        wx.setStorage({
          data:cart,
          key:'cart',
        })
      }
    }
    this.setData({
      cart:cart
    })
    this.onSummary()
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    
  }
})
