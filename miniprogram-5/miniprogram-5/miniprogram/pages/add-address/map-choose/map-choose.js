const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min');
const qqmapsdk = new QQMapWX({
  key: 'OZCBZ-EAUCG-37TQM-Q3WC4-7ATSE-DWFB4'
});

Page({
  data: {
    longitude: 113.324520,
    latitude: 23.099994,
    mapHeight: 300,      // 地图高度
    listHeight: 200,     // 列表高度
    poiList: [],
    activeIndex: -1,
    selectedLocation: null,
    searchKeyword: '',
    mapContext: null,
    searchTimer: null,     // 防抖定时器
    isSearching: false,    // 是否正在搜索
    lastSearchTime: 0,     // 上次搜索时间
  },

  onLoad() {
    this.calculateLayout();
    this.initLocation();
    
    // 创建地图上下文
    this.setData({
      mapContext: wx.createMapContext('myMap')
    });
  },

  // 计算布局高度
  calculateLayout() {
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;
    const windowWidth = systemInfo.windowWidth;
    
    // 地图占屏幕的40%
    const mapHeight = windowHeight * 0.4;
    
    // 计算列表可用高度：总高度 - 地图 - 搜索栏 - 底部按钮
    const searchBarHeight = 80; // 搜索栏大约高度
    const footerHeight = 100;   // 底部按钮大约高度
    const listHeight = windowHeight - mapHeight - searchBarHeight - footerHeight;
    
    this.setData({
      mapHeight: mapHeight,
      listHeight: listHeight > 0 ? listHeight : 200
    });
  },

  // 初始化位置
  async initLocation() {
    // 先开启位置监听
  wx.startLocationUpdate({
    success: () => {
      console.log('开始位置监听');
      wx.onLocationChange((res) => {
        console.log('GPS位置变化:', res);
        // 如果这里频繁触发，说明GPS在漂移
      });
    }
  });
    try {
      // 显示加载中
      wx.showLoading({ title: '定位中...' });
      
      // 获取当前位置
      const { longitude, latitude } = await this.getUserLocation();
      
      // 更新地图中心
      this.setData({ 
        longitude, 
        latitude 
      });
      
      // 将地图移动到当前位置
      if (this.data.mapContext) {
        this.data.mapContext.moveToLocation({
          longitude: longitude,
          latitude: latitude
        });
      }
      
      // 加载周边POI
      await this.loadNearbyPoi(longitude, latitude);
      
      wx.hideLoading();
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取位置失败:', error);
      
      // 使用默认位置
      wx.showToast({ 
        title: '使用默认位置', 
        icon: 'none',
        duration: 2000
      });
      
      // 使用默认位置加载POI
      this.loadNearbyPoi(this.data.longitude, this.data.latitude);
    }
  },

  // 获取用户位置
  getUserLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: res => resolve(res),
        fail: err => {
          // 用户拒绝授权或其他错误
          wx.showModal({
            title: '位置授权提示',
            content: '需要您的位置信息来提供更好的服务，请在设置中开启位置权限',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting(); // 打开设置页面
              }
              reject(err);
            }
          });
        }
      });
    });
  },

  // 地图移动事件
  onMapMove(e) {
    if (e.type === 'end' && e.detail && e.detail.centerLocation) {
      const { longitude, latitude } = e.detail.centerLocation;
      
      // 更新地图中心
      this.setData({ 
        longitude, 
        latitude 
      });
      
      // 防抖：清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      // 设置新的定时器，800毫秒后执行搜索
      this.searchTimer = setTimeout(() => {
        this.loadNearbyPoi(longitude, latitude);
      }, 1000);
    }
  },

  // 加载周边POI
  async loadNearbyPoi(longitude, latitude) {
    try {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });
      
      const res = await this.searchNearby(longitude, latitude);
      
      this.setData({
        poiList: res.data.map((item, index) => ({
          id: item.id || index,
          title: item.title,
          address: item.address,
          location: item.location
        })),
        activeIndex: -1,
        selectedLocation: null
      });
      
      wx.hideLoading();
      
    } catch (error) {
      wx.hideLoading();
      console.error('加载周边失败:', error);
      
      // 使用模拟数据
      this.setData({
        poiList: [
          {id: 1, title: '海尚国际丰华阁', address: '广东省深圳市南山区公园南路1号', location: {lng: 113.9251, lat: 22.4863}},
          {id: 2, title: '海昌社区', address: '广东省深圳市南山区公园南路与海昌街交叉口西北方向51米左右', location: {lng: 113.9252, lat: 22.4864}},
          {id: 3, title: '海徽阁', address: '广东省深圳市南山区公园南路与望海路交叉口西北方向40米左右', location: {lng: 113.9253, lat: 22.4865}},
          {id: 4, title: '海尚国际丰华阁11E', address: '广东省深圳市南山区蛇口街道', location: {lng: 113.9254, lat: 22.4866}},
          {id: 5, title: '海尚国际丰润阁', address: '广东省深圳市南山区商乐街与海昌街交叉口正南方向60米左右', location: {lng: 113.9255, lat: 22.4867}}
        ]
      });
    }
  },

  // 搜索周边
  searchNearby(longitude, latitude) {
    return new Promise((resolve, reject) => {
      qqmapsdk.search({
        keyword: this.data.searchKeyword || '住宅小区,写字楼,商铺', // 多种关键词
        location: { 
          latitude, 
          longitude 
        },
        page_size: 20,
        success: res => {
          console.log('搜索成功:', res);
          resolve(res);
         }
         
        ,
        fail: err => {
          console.error('腾讯地图API错误:', err);
          reject(err);
        }
      });
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    if (keyword) {
      // 有搜索关键词时，使用关键词搜索
      this.searchByKeyword(keyword);
    } else {
      // 没有关键词时，加载周边POI
      this.loadNearbyPoi(this.data.longitude, this.data.latitude);
    }
  },
  
  // 关键词搜索
  searchByKeyword(keyword) {
    qqmapsdk.search({
      keyword: keyword,
      location: { 
        latitude: this.data.latitude, 
        longitude: this.data.longitude
      },
      page_size: 20,
      success: (res) => {
        this.setData({
          poiList: res.data.map((item, index) => ({
            id: item.id || index,
            title: item.title,
            address: item.address,
            location: item.location
          })),
          activeIndex: -1,
          selectedLocation: null
        });
      },
      fail: (err) => {
        console.error('关键词搜索失败:', err);
        wx.showToast({ 
          title: '搜索失败', 
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 选择POI
  selectPoi(e) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.poiList[index];
    
    this.setData({
      activeIndex: index,
      selectedLocation: {
        name: selected.title,
        address: selected.address,
        lng: selected.location.lng,
        lat: selected.location.lat
      }
    });
    
    // 将地图移动到选中的位置
    if (this.data.mapContext) {
      this.data.mapContext.moveToLocation({
        longitude: selected.location.lng,
        latitude: selected.location.lat
      });
    }
  },

  // 确认选择
  confirmLocation() {
    if (!this.data.selectedLocation) {
      wx.showToast({ 
        title: '请先选择位置', 
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const pages = getCurrentPages();
    if (pages.length < 2) {
      wx.showToast({ 
        title: '页面错误', 
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const prevPage = pages[pages.length - 2];
    
    // 将选择的位置信息传递给上一页
    prevPage.setData({
      'region': this.data.selectedLocation.name,
      'detail': this.data.selectedLocation.address,
      'selectedLocation': this.data.selectedLocation
    });
    
    console.log('选择的位置:', this.data.selectedLocation);
    
    wx.navigateBack({
      success: () => {
        // 可选：在上一页显示成功提示
        wx.showToast({
          title: '地址已选择',
          icon: 'success',
          duration: 1500
      })
    }
  })
  },

  // 页面显示时重新计算布局
  onShow() {
    this.calculateLayout();
  }
});