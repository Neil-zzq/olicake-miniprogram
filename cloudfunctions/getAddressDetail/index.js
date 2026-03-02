// cloudfunctions/getAddressDetail/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const { addressId } = event
    
    console.log('📋 查询地址详情，地址id:', addressId)
    
    if (!addressId) return {
        success: false,
        error: '地址id不能为空',
        addressDetail: null
      }
    
    
    // 1. 从数据库查询订单基础信息
    const addressResult = await db.collection('address')
      .where({
        _id: addressId
      })
      .get()
    
    if (addressResult.data.length === 0) {
      return {
        success: false,
        error: '地址不存在',
        orderDetail: null
      }
    }
    
    const address = addressResult.data[0]
    console.log('📦 查询到地址数据:', address)
     // 4. 🔥 关键修复：返回数据
     return {
      success: true,
      message: '查询成功',
      address: address
    }
  } catch (error) {
    console.error('❌ 查询地址详情失败:', error)
    return {
      success: false,
      error: error.message,
      address: null
    }
  }
}
