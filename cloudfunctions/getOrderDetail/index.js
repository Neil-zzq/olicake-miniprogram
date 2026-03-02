// cloudfunctions/getOrderDetail/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const { orderNo } = event
    
    console.log('📋 查询订单详情，订单号:', orderNo)
    
    if (!orderNo) return {
        success: false,
        error: '订单号不能为空',
        orderDetail: null
      }
    
    
    // 1. 从数据库查询订单基础信息
    const orderResult = await db.collection('orders')
      .where({
        orderNo: orderNo
      })
      .get()
    
    if (orderResult.data.length === 0) {
      return {
        success: false,
        error: '订单不存在',
        orderDetail: null
      }
    }
    
    const order = orderResult.data[0]
    console.log('📦 查询到订单数据:', order)
     // 4. 🔥 关键修复：返回数据
     return {
      success: true,
      message: '查询成功',
      order: order
    }
  } catch (error) {
    console.error('❌ 查询订单详情失败:', error)
    return {
      success: false,
      error: error.message,
      orderDetail: null
    }
  }
}
