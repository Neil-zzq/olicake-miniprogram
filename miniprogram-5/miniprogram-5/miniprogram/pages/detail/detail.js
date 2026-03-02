// pages/detail/detail.ts 
Page({
  goback: function () {
    wx.navigateBack()
  },
  popupTips() {
    this.setData({
      tipsShow: true,
    })
  },
  tipsButton(){
    this.setData({
      tipsShow: false,
    })
  },
  data: {
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,
    selectedTasteIndex : -1,
    selectedSizeIndex:-1,
    Price:0,
    cakeSizePrice:0,
    cakeBagPrice:0,
    Size:'尺寸',
    Taste:'口味',
    Bag:'保温袋',
    cakeBag:[
      {name:'需要',price:0.1},
      {name:'不需要',price:0}
    ],
    cakeitems:{},
    img:{},
    cart:[],
    item:{},
    num:1,
    latitude: 22.538526,
    longitude: 113.922043,
    markers: [{
      id: 1,
      latitude: 22.538526,
      longitude: 113.922043,
      name: 'olicake',
      width: '30',
      height: '50'
    }],
    covers: [{
      latitude: 22.538526,
      longitude: 113.922043,
      iconPath: '../../img/location.png'
    }, {
      latitude: 22.538526,
      longitude: 113.922043,
      iconPath: '../../img/location.png'
    }],
    tipsShow: false,
    inShow:false,
    phone: '', 
    message: '', 
  },
  bindPhoneInput(e) {
    this.setData({ phone: e.detail.value }); 
  },
  bindMessageInput(e) {
    this.setData({ message: e.detail.value });
  },
  showTan(){
     this.setData({
      inShow:!this.data.inShow
     })
  },
  addnum:function(){
    let num = ++this.data.num
    this.setData({
      num:num
    })
    this.onSummary()
  },
  subnum:function(){
    let num = this.data.num <= 1 ? 1 : this.data.num-1
    this.setData({
      num: num
    })  
    this.onSummary()
  },
  onLoad:function(options) {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 0

    let navBarContentHeight = 44
    try {
      const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
      if (menu && menu.height && menu.top != null) {
        const gap = Math.max(0, menu.top - statusBarHeight)
        navBarContentHeight = menu.height + gap * 2
      }
    } catch (e) {}

    const navBarHeight = statusBarHeight + navBarContentHeight
    this.setData({ statusBarHeight, navBarContentHeight, navBarHeight })

    const cakeId = options.id
    console.log('接收到的蛋糕ID:', cakeId)
    this.onUpdateCart()
    if (cakeId) {
      this.getCakeDetail(cakeId)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },
  
    getCakeDetail(cakeId) {
      wx.showLoading({
        title: '加载中...',
      })
      
      wx.cloud.callFunction({
        name: 'getCakeDetail',  // 云函数名称
        data: {
          id: cakeId           // 传递蛋糕id
        },
        success: (res) => {
          wx.hideLoading()
          console.log('蛋糕详情数据:', res)
          
          if (res.result.code === 0) {
            this.setData({
              cakeitems: res.result.data,
              loading: false
            })
          } else {
            wx.showToast({
              title: res.result.message || '获取详情失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('获取详情失败:', err)
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          })
        }
      })
    },
  cakesizeChoosed:function(e){
    let  cakeitems = this.data.cakeitems
    let selectedSizeIndex =this.data.selectedSizeIndex
    let index = e.currentTarget.dataset.index
    let cakeSizePrice = 0
    let Size =  this.data.Size
    for ( var k in cakeitems.cakeSize){
         if (cakeitems.cakeSize[k] ['size'] == e._relatedInfo.anchorTargetText){
          cakeSizePrice = cakeitems.cakeSize[k]['price']
          Size = cakeitems.cakeSize[k] ['size']
          this.setData({
            selectedSizeIndex: index,
            cakeSizePrice:cakeSizePrice,
            Size:Size,
            cakeitems:cakeitems
          })
         }
    }
    this.onSummary()
 },
 caketasteChoosed:function(e){
   
  let cakeitems = this.data.cakeitems
  let selectedTasteIndex =this.data.selectedTasteIndex
  let index = e.currentTarget.dataset.index
  let Taste = e._relatedInfo.anchorTargetText
  this.setData({
    selectedTasteIndex: index,
    Taste:Taste,
  })
  this.onSummary()
 },
 cakebagChoose:function(a){
   let Price = this.data.Price;
   let cakeBag=this.data.cakeBag;
   let cakeBagPrice = 0;
   let index =a.currentTarget.dataset.index;
   let selectedBagIndex = -1;
   let Bag =this.data.Bag
   
   for(var l in cakeBag){
    if (a._relatedInfo.anchorTargetText ===cakeBag[l]['name']) {
      cakeBagPrice = cakeBag[l]['price']
      Bag = a._relatedInfo.anchorTargetText
      this.setData({
        cakeBagPrice: cakeBagPrice,
        selectedBagIndex:a.currentTarget.dataset.index,
        Bag :Bag,
      })
   }
   }
   this.onSummary()
 },
 navigateToShoppingCart(){
  wx.switchTab({
    url: '/pages/shopping-cart/shopping-cart',
  })
 },
 onAddcart: function () {
    // 1. 获取用户输入的值
    const { phone, message } = this.data;
   wx.getStorage({
     key:"cart",
     success:res =>{  
          let cartitem =this.data.cakeitems
          cartitem["total"]=this.data.num
          cartitem["sizechoose"]=this.data.Size
          cartitem["tastechoose"]=this.data.Taste
          cartitem["bagchoose"]=this.data.Bag
          cartitem["Price"]=this.data.Price
          cartitem["phone"]=this.data.phone
          cartitem["message"]=this.data.message
          cartitem["cartId"]=Date.now() + Math.random().toString(36).substr(2, 9)
          res.data.push(this.data.cakeitems)
          
        wx.setStorage({
          data:res.data,
          key:'cart',
         })

         
         this.onUpdateCart()
         wx.showToast({
          title: '加入购物车成功',
          icon: 'success',
          duration: 1500,
          mask: true,
          success: () => {
            setTimeout(() => {
              this.navigateToShoppingCart()
            }, 1500)
          }
        })
         
     },
     fail:err=>{
       //本地内存没有cart数据
       let cartitem =this.data.cakeitems
          cartitem["total"]=this.data.num
          cartitem["sizechoose"]=this.data.Size
          cartitem["tastechoose"]=this.data.Taste
          cartitem["bagchoose"]=this.data.Bag
          cartitem["Price"]=this.data.Price
       let cart=[]
       cart.push(cartitem)
       wx.setStorage({
        data:cart,
        key:'cart',
       })
       this.onUpdateCart()
       wx.showToast({
        title: '加入购物车成功',
        icon: 'success',
        duration: 1500,
        mask: true,
        success: () => {
          setTimeout(() => {
            this.navigateToShoppingCart()
          }, 1500)
        }
      })
     
     }
   })
   
 },
 onUpdateCart:function () {
   wx.getStorage({
     key:"cart",
     success:res =>{
       this.setData({
         cart:res.data,
         num:1
       })
     }
   })
 },
 goToShoppingCart:function(){
   wx.switchTab({
     url: '/pages/shopping-cart/shopping-cart' 
   })
 },
 onSummary:function(){
   let Price = this.data.Price;
   let cakeSizePrice = this.data.cakeSizePrice;
   let cakeBagPrice = this.data.cakeBagPrice;
   let num = this.data.num;
  let total = (cakeSizePrice + cakeBagPrice)*num
  Price = total.toFixed(2);
   this.setData({
     Price:Price
   })
 }
 
})