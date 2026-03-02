// cloudfunctions/autoCompleteOrders/index.js - 修正版
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const _ = db.command
    const now = new Date()
    
    // 计算24小时前的时间
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    console.log('当前时间:', now.toISOString());
    console.log('24小时前:', twentyFourHoursAgo.toISOString());
    
    // 使用正确的字段名：payTime
    const timeThreshold = formatTimeForQuery(twentyFourHoursAgo)
    
    // 修正查询条件 - 使用 payTime
    const query = {
      status: 'paid',
      payTime: _.lt(timeThreshold)  // ✅ 使用 payTime
    }
    
    console.log('📋 查询条件:', {
      状态: 'paid',
      支付时间阈值: timeThreshold,
      查询说明: '支付时间早于24小时前'
    })
    
    // 查询需要自动完成的订单
    const ordersToComplete = await db.collection('orders')
      .where(query)
      .get()
    
    console.log(`📊 找到 ${ordersToComplete.data.length} 个需要自动完成的订单`)
    
    // 详细输出找到的订单信息
    if (ordersToComplete.data.length > 0) {
      console.log('✅ 找到的超时订单详情:')
      ordersToComplete.data.forEach((order, index) => {
        const payTimeFormatted = order.payTime ? 
          `${order.payTime.substring(0, 8)} ${order.payTime.substring(8, 10)}:${order.payTime.substring(10, 12)}:${order.payTime.substring(12, 14)}` : 
          '无'
        
        console.log(`  订单 ${index + 1}:`, {
          订单号: order.orderNo,
          状态: order.status,
          支付时间: payTimeFormatted,
          金额: order.totalFee ? (order.totalFee / 100).toFixed(2) + '元' : '未知'
        })
      })
    } else {
      // 如果没有找到订单，检查数据库状态
      console.log('🔍 检查数据库中的订单样本...')
      
      const sampleOrders = await db.collection('orders')
        .where({
          status: 'paid'
        })
        .limit(5)
        .get()
      
      if (sampleOrders.data.length > 0) {
        console.log('📋 数据库中的已支付订单样本:')
        sampleOrders.data.forEach((order, index) => {
          const payTime = order.payTime || '无'
          const payTimeFormatted = payTime.length === 14 ? 
            `${payTime.substring(0, 8)} ${payTime.substring(8, 10)}:${payTime.substring(10, 12)}:${payTime.substring(12, 14)}` : 
            payTime
            
          console.log(`  样本 ${index + 1}:`, {
            订单号: order.orderNo,
            支付时间: payTimeFormatted,
            状态: order.status
          })
        })
      } else {
        console.log('💡 数据库中没有已支付的订单')
      }
    }
    
    let completedCount = 0
    
    if (ordersToComplete.data.length > 0) {
      const currentTimeFormatted = formatTimeForQuery(now)
      
      // 批量更新订单状态
      const updatePromises = ordersToComplete.data.map(order => {
        return db.collection('orders').doc(order._id).update({
          data: {
            status: 'completed',
            statusText: '已完成（自动）',
            completeTime: currentTimeFormatted,
            updatedAt: now,
            autoCompleted: true
          }
        })
      })
      
      const results = await Promise.all(updatePromises)
      completedCount = results.length
      console.log(`🎉 成功完成 ${completedCount} 个订单`)
    }
    
    return {
      success: true,
      completedCount: completedCount,
      checkedCount: ordersToComplete.data.length,
      message: `检查了 ${ordersToComplete.data.length} 个订单，自动完成了 ${completedCount} 个`,
      debugInfo: {
        时间阈值: timeThreshold,
        当前时间: formatTimeForQuery(now)
      }
    }
    
  } catch (error) {
    console.error('❌ 自动完成订单失败:', error)
    return {
      success: false,
      error: error.message,
      completedCount: 0
    }
  }
}

// 时间格式化函数
function formatTimeForQuery(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}