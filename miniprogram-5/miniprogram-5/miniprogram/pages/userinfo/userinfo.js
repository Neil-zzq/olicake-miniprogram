// pages/userinfo/userinfo.js
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    btntext:'用户注册',
    openid:'',
    avatarUrl: '', // 头像URL
    nickName:'',
    phoneNumber:null,
    genderId:null,
    birthday: '', // 生日，格式：2000-01-01
    region: [], // 地区数组，如：['内蒙古自治区', '呼和浩特市', '新城区']
    regionText: '', // 地区文本，如：'内蒙古自治区-呼和浩特市-新城区'
    genderOptions:[
      {id: 1 , name:"男"},
      {id: 0 , name:"女"}
    ],
    // 自定义生日选择器相关
    showBirthdayModal: false,
    years: [],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    days: [],
    birthdayIndex: [99, 0, 0], // 默认选中的索引
    today: '', // 今天日期，用于限制最大选择日期
    
    // 地区选择器相关
    regionPickerVisible: false
  },
  // 保存用户信息
  async saveUserInfo() {
    const {openid,avatarUrl,nickName,phoneNumber,genderId,birthday,region,regionText}=this.data;
    if (!avatarUrl||!nickName||!phoneNumber||!genderId||!birthday||!regionText) {
      wx.showToast({
        title: '信息不完整',
        icon:'error'
      })
      return
    }
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    try {
      if (!openid) {
        throw new Error('获取用户标识失败');
      }

      // 2. 准备用户数据
      const userData = {
        avatarUrl: avatarUrl || '',
        nickName: nickName || '',
        phoneNumber:phoneNumber || '',
        gender: genderId|| '' ,
        birthday: birthday || '',
        region: region || [],
        regionText: regionText || '',
        updateTime: new Date(),
        usertype:'generalMember',
        cumulativeSpending:0
      };
      
      console.log('保存的用户数据:', userData);

      // 3. 调用云函数保存到数据库
      const saveRes = await wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          openid: openid,
          userData: userData
        }
      });

      console.log('保存结果:', saveRes);

      if (saveRes.result.code === 0) {
        const isNewUser = saveRes.result.isNewUser

        // 更新本地缓存中的会员信息
        const cached = wx.getStorageSync('userInfo') || {}
        wx.setStorageSync('userInfo', {
          ...cached,
          usertype: 'generalMember',
          cumulativeSpending: 0
        })

        wx.showToast({
          title: isNewUser ? '注册成功！已赠 20 元券' : '保存成功',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(saveRes.result.msg || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: '保存失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    } finally {
      wx.hideLoading();
    }
  },
  genderSelected(e){
    console.log(e)
    this.setData({
      genderId:e.currentTarget.dataset.id
    })
    
  },
  onGetPhoneNumber: function(e) {
    console.log(e)
    if (e.detail.code) {
      const { code } = e.detail;
      
      // 调用云函数解密手机号
      wx.cloud.callFunction({
        name: 'decryptPhone',
        data: {
          code: code,
        },
        success: (res) => {
          console.log('手机号:', res);
          this.setData({
            phoneNumber: res.result.data.phoneNumber
          })
        }
      });
    }
  },
   initUserInfo(){
    wx.getStorage({
      key:"userInfo",
      success:res =>{
          let avatarUrl = res.data.avatarUrl;
          let nickName = res.data.nickName;
          let openid = res.data.openid;
          this.setData({
            avatarUrl:avatarUrl,
            nickName:nickName,
            openid:openid
          })
          wx.cloud.callFunction({
            name:'getUserInfo',
            data:{
              openid:this.data.openid
            },
            success : res =>{
                 if(!res.result.userInfo){
                   wx.showToast({
                     title: '未找到注册信息',
                     icon:"error",
                     duration:2000
                   })
                   return
                 }
              console.log(res.result.userInfo)
              const userInfo = res.result.userInfo
             
              this.setData({
                avatarUrl:userInfo.avatarUrl, // 头像URL
                nickName:userInfo.nickName,
                phoneNumber:userInfo.phoneNumber,
                genderId:userInfo.gender,
                regionText:userInfo.regionText,
                birthday:userInfo.birthday,
                btntext:'数据更新'
              })
            }

          })
       }
      
    })
     
  },
  chooseAvatar(){
    const that = this;
    // 弹出选择框
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success(res) {
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera'];
        that.chooseImage(sourceType);
      },
      fail(err) {
        console.error('选择失败:', err);
      }
    });
  },
  chooseImage: function(sourceType) {
    const that = this;
    
    wx.chooseImage({
      count: 1, // 默认只能选一张
      sizeType: ['compressed'], // 压缩图
      sourceType: sourceType, // 来源：相册或相机
      success(res) {
        // tempFilePath可以作为img的src显示
        const tempFilePaths = res.tempFilePaths;
        
        // 预览图片
        wx.previewImage({
          current: tempFilePaths[0],
          urls: tempFilePaths
        });

        // 询问用户是否确定使用此图片
        wx.showModal({
          title: '提示',
          content: '确定使用这张图片作为头像吗？',
          success: function(modalRes) {
            if (modalRes.confirm) {
              // 用户确认，更新头像显示
              that.setData({
                avatarUrl: tempFilePaths[0]
              });
            }
          }
        });
      },
      fail(err) {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择失败',
          icon: 'none'
        }); 
      }
    });
  },
  // 初始化生日选择器数据
  initBirthdayData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    // 设置今天日期，用于限制最大选择
    const todayStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 初始化天数（根据当前月份）
    
    this.setData({
      today: todayStr,

    });
  },

  // 更新天数
  updateDays(month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = new Array(daysInMonth).fill(0).map((_, i) => i + 1);
    this.setData({ days });
  },

  // 显示生日选择器
  showBirthdayPicker() {
    // 方法1：使用系统默认的picker（简单）
    this.selectComponent('#birthdayPicker').onClick();
    
    // 方法2：使用自定义弹窗（更美观）
    // this.showCustomBirthdayPicker();
  },



  // 自定义生日选择器值变化
  onBirthdayPickerChange(e) {
    const index = e.detail.value;
    this.setData({ birthdayIndex: index });
    
    // 更新天数
    const year = this.data.years[index[0]];
    const month = this.data.months[index[1]];
    this.updateDays(month, year);
  },

  // 确认生日选择
  confirmBirthday() {
    const index = this.data.birthdayIndex;
    const year = this.data.years[index[0]];
    const month = this.data.months[index[1]];
    const day = this.data.days[index[2]];
    
    const birthday = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    this.setData({
      birthday,
      showBirthdayModal: false
    });
    
  },

  // 系统生日选择器值变化
  onBirthdayChange(e) {
    const birthday = e.detail.value;
    this.setData({ birthday });
    
  },

  // 显示地区选择器
  showRegionPicker() {
    this.selectComponent('#regionPicker').onClick();
  },

  // 地区选择器值变化
  onRegionChange(e) {
    const region = e.detail.value; // 数组，如：['内蒙古自治区', '呼和浩特市', '新城区']
    const regionText = region.join('-'); // 字符串，如：'内蒙古自治区-呼和浩特市-新城区'
    
    console.log('选择的地区:', region, regionText);
    
    this.setData({
      region,
      regionText
    });
    
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initUserInfo();
    this.initBirthdayData();
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