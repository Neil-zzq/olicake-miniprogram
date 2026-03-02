// cloudfunctions/getConsigneeList/index.js - 简化版
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { openid } = event 
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    console.log('查询订单参数:', openid )
    
    // 构建查询条件
    let query = { openid: openid }
    // ✅ 简化：只查询一次，不获取总数
    const result = await db.collection('consignee')
      .where(query)
      .orderBy('createTime', 'desc')
      .get()
    
    console.log(`查询到 ${result.data.length} 条订单`)
    
    return {
      success: true,
      consigneeList: result.data,
    }
    
  } catch (error) {
    console.error('获取提货人失败:', error)
    return {
      success: false,
      error: error.message,
      orders: []
    }
  }
}