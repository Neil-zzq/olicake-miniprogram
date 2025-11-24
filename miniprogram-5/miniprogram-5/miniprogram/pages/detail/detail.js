// pages/detail/detail.ts 
const items2 = require('../../utils/items.js')
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
    selectedTasteIndex : -1,
    selectedSizeIndex:-1,
    Price:0,
    cakeSizePrice:0,
    cakeBagPrice:0,
    Size:'尺寸',
    Taste:'口味',
    Bag:'保温袋',
    cakeBag:[
      {name:'需要',price:10},
      {name:'不需要',price:0}
    ],
    cakeitems:{},
    img:{},
    cart:{},
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
    num:1,
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
    this.onUpdateCart()
     for(var i in items2){
      for ( var j in items2[i].list){
        if  (items2[i].list[j] ['id'] == options.id ){
          this.setData ({
            cakeitems:items2[i].list[j],
            Price:0,
             })
             
        }
      }
    }
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
   console.log(e)
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
          res.data.push(this.data.cakeitems)
          
        wx.setStorage({
          data:res.data,
          key:'cart',
         })

         
         this.onUpdateCart()
         wx.showToast({
           title: '加入购物车成功',
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
   Price = (cakeSizePrice + cakeBagPrice)*num
   this.setData({
     Price:Price
   })
 }
 
})