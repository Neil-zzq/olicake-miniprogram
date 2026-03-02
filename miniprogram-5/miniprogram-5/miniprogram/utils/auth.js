// utils/auth.js
/**
 * 授权管理工具
 */

// 检查是否需要显示隐私协议弹窗
function checkNeedShowPrivacyModal() {
  try {
    // 检查是否已经同意过
    const privacyAgreed = wx.getStorageSync('privacyAgreed');
    
    if (privacyAgreed === true) {
      // 已经同意过
      return false;
    }
    
    // 检查是否拒绝过，如果拒绝超过3天，可以再次询问
    const rejectTime = wx.getStorageSync('privacyRejectTime');
    if (rejectTime) {
      const now = new Date().getTime();
      const threeDays = 3 * 24 * 60 * 60 * 1000; // 3天的毫秒数
      
      if (now - rejectTime < threeDays) {
        // 3天内拒绝过，不显示
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('检查隐私协议状态失败:', error);
    return true; // 出错时默认显示
  }
}

// 获取用户信息
async function getUserInfo() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

// 获取用户手机号
function getPhoneNumber(e) {
  return new Promise(async (resolve, reject) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const { encryptedData, iv } = e.detail;
      
      try {
        // 调用云函数解密手机号
        const result = await wx.cloud.callFunction({
          name: 'auth',
          data: {
            action: 'decryptPhone',
            encryptedData,
            iv
          }
        });
        
        if (result.result.code === 0) {
          resolve(result.result.data.phoneNumber);
        } else {
          reject(new Error(result.result.msg || '获取手机号失败'));
        }
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error('用户拒绝了手机号授权'));
    }
  });
}

// 获取用户OpenID
async function getUserOpenId() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'getOpenId'
      }
    });
    
    if (result.result.code === 0) {
      return result.result.data.openid;
    } else {
      throw new Error(result.result.msg || '获取OpenID失败');
    }
  } catch (error) {
    console.error('获取OpenID失败:', error);
    throw error;
  }
}

// 保存用户信息到Storage
function saveUserInfoToStorage(userData) {
  try {
    wx.setStorageSync('userInfo', userData.userInfo);
    wx.setStorageSync('openid', userData.openid);
    wx.setStorageSync('phoneNumber', userData.phoneNumber);
    wx.setStorageSync('hasUserInfo', true);
    wx.setStorageSync('userInfoUpdateTime', new Date().getTime());
    
    return true;
  } catch (error) {
    console.error('保存用户信息到Storage失败:', error);
    return false;
  }
}

// 检查用户信息是否完整
function checkUserInfoComplete() {
  try {
    const hasUserInfo = wx.getStorageSync('hasUserInfo');
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    
    return !!(hasUserInfo && userInfo && openid);
  } catch (error) {
    return false;
  }
}

// 清除用户信息
function clearUserInfo() {
  try {
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('openid');
    wx.removeStorageSync('phoneNumber');
    wx.removeStorageSync('hasUserInfo');
    wx.removeStorageSync('userInfoUpdateTime');
    return true;
  } catch (error) {
    console.error('清除用户信息失败:', error);
    return false;
  }
}

// 更新用户信息
async function updateUserInfo(userData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'updateUserInfo',
        userData: userData
      }
    });
    
    return result.result;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      code: 1,
      msg: '更新用户信息失败'
    };
  }
}

module.exports = {
  checkNeedShowPrivacyModal,
  getUserInfo,
  getPhoneNumber,
  getUserOpenId,
  saveUserInfoToStorage,
  checkUserInfoComplete,
  clearUserInfo,
  updateUserInfo
};