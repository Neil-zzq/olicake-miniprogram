'use strict';
// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到微信支付回调:', event)
  
  // 1. 判断支付是否成功
  if (event.event_type === "TRANSACTION.SUCCESS") {
    console.log('支付成功回调确认')
    
    // 2. 从回调数据中获取重要信息
    const paymentData = event.resource
    const orderNo = paymentData.out_trade_no        // 你的订单号
    const wechatOrderNo = paymentData.transaction_id // 微信订单号
    const paidAmount = paymentData.amount.payer_total // 实际支付金额（分）
    const payTime = paymentData.success_time       // 支付成功时间
    
    console.log('订单信息:', {
      订单号: orderNo,
      微信订单号: wechatOrderNo,
      支付金额: paidAmount,
      支付时间: payTime
    })
    
    try {
      // 3. 更新数据库中的订单状态（重要！）
      const updateResult = await db.collection('orders').where({
        orderNo: orderNo  // 根据订单号找到对应订单
      }).update({
        data: {
          status: 'paid',           // 将状态改为"已支付"
          payTime: payTime,         // 记录支付时间
          wechatOrderNo: wechatOrderNo, // 保存微信订单号
          updatedAt: new Date()     // 更新时间
        }
      })
      
      console.log('数据库更新结果:', updateResult)
      
      // 4. 这里可以添加其他业务逻辑
      // 比如：发送支付成功通知、更新库存、记录日志等
      
    } catch (error) {
      console.error('更新订单状态失败:', error)
      // 即使更新失败，也要返回成功，否则微信会重复通知
    }
    
    // 5. 返回成功响应（必须返回，否则微信会重复发送通知）
    return {
      code: 'SUCCESS',
      message: '处理成功'
    }
  }
  
  // 如果不是支付成功通知，也返回成功
  return {
    code: 'SUCCESS', 
    message: '接收成功'
  }
}