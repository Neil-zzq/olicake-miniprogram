// cloudfunctions/getUserOrders/index.js - 简化版
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { openid, currentTab = 0, limit = 50 } = event // 限制返回数量
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    console.log('查询订单参数:', { openid, currentTab })
    
    // 构建查询条件
    let query = { openid: openid }
    
    // 根据Tab筛选订单状态
    if (currentTab === 0) {
      // 当前订单：已支付
      query.status = _.in(['paid'])
    } else {
      // 历史订单：已完成、已取消
      query.status = _.in(['completed'])
    }
    
    // ✅ 简化：只查询一次，不获取总数
    const result = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .limit(limit) // 限制返回数量，避免数据过多
      .get()
    
    console.log(`查询到 ${result.data.length} 条订单`)
    
    return {
      success: true,
      orders: result.data,
      // ❌ 去掉分页相关字段
      // total: total,
      // hasMore: hasMore,
      // page: page
    }
    
  } catch (error) {
    console.error('获取订单失败:', error)
    return {
      success: false,
      error: error.message,
      orders: []
    }
  }
}