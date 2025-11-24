// pages/add-address/map-choose/map-choose.js
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min');// 引入腾讯地图小程序SDK
const qqmapsdk = new QQMapWX({
  key: 'OZCBZ-EAUCG-37TQM-Q3WC4-7ATSE-DWFB4'// 腾讯位置服务API Key
});

Page({
  data: {
    longitude: 113.324520,
    latitude: 23.099994,
    poiList: [],
    activeIndex: -1,
    selectedLocation: null
  },

  onLoad() {
    this.initLocation();
  },

  // 初始化位置
  async initLocation() {
    try {
      // 获取当前位置
      const { longitude, latitude } = await this.getUserLocation();
      
      // 更新地图中心
      this.setData({ longitude, latitude });
      
      // 加载周边POI
      this.loadNearbyPoi(longitude, latitude);
      
    } catch (error) {
      wx.showToast({ title: '获取位置失败', icon: 'none' });
    }
  },

  // 获取用户位置
  getUserLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: res => resolve(res),
        fail: err => reject(err)
      });
    });
  },

  // 地图移动事件
  onMapMove(e) {
    if (e.type === 'end' && e.centerLocation) {  // 添加安全校验
      const { longitude, latitude } = e.centerLocation;
      this.loadNearbyPoi(longitude, latitude);
    }
  },

  // 加载周边POI
  async loadNearbyPoi(longitude, latitude) {
    try {
      const { data } = await this.searchNearby(longitude, latitude);
      
      this.setData({
        poiList: data.map(item => ({
          id: item.id,
          title: item.title,
          address: item.address,
          location: item.location
        })),
        activeIndex: -1
      });
      
    } catch (error) {
      wx.showToast({ title: '加载周边失败', icon: 'none' });
    }
  },

  // 搜索周边
  searchNearby(longitude, latitude) {
    return new Promise((resolve, reject) => {
      qqmapsdk.search({
        keyword: '住宅小区',
        location: { latitude, longitude },
        page_size: 20,
        success: res => resolve(res),
        fail: err => {
          console.error('腾讯地图API错误:', err); // 打印详细错误
          reject(err);
        }
      });
    });
  },

  // 选择POI
  selectPoi(e) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.poiList[index];
    
    this.setData({
      activeIndex: index,
      longitude: selected.location.lng,
      latitude: selected.location.lat,
      selectedLocation: {
        name: selected.title,
        address: selected.address,
        ...selected.location
      }
    });
  },

  // 确认选择
  confirmLocation(e) {
    if (!this.data.selectedLocation) {
      return wx.showToast({ title: '请选择位置', icon: 'none' });
    }
    
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    prevPage.setData({
      'formData.region': this.data.selectedLocation.name,
      'formData.detail': this.data.selectedLocation.address,
      'formData.location': this.data.selectedLocation,
      'region':this.data.selectedLocation.name,
      'detail': this.data.selectedLocation.address,
    });
    
    wx.navigateBack();
    console.log(this.data.selectedLocation)
  }
});