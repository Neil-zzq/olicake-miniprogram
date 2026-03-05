const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// ===== 会员等级工具函数 =====
function calcUserType(spending) {
  if (spending >= 10000) return 'diamond'
  if (spending >= 5000)  return 'blackGold'
  if (spending >= 3000)  return 'platinum'
  if (spending >= 1000)  return 'silver'
  return 'generalMember'
}

// 支付成功后更新会员消费金额与等级
async function updateMemberSpending(db, openid, paidAmountYuan, voucherId, orderNo) {
  if (!openid) return
  try {
    const userRes = await db.collection('user').where({ _openid: openid }).get()
    if (userRes.data.length === 0) return

    const user = userRes.data[0]
    const oldSpending = user.cumulativeSpending || 0
    const newSpending = parseFloat((oldSpending + paidAmountYuan).toFixed(2))
    const newUserType = calcUserType(newSpending)

    await db.collection('user').doc(user._id).update({
      data: {
        cumulativeSpending: newSpending,
        usertype: newUserType,
        updateTime: new Date()
      }
    })
    console.log(`会员消费更新：openid=${openid}，新增¥${paidAmountYuan}，累计¥${newSpending}，等级=${newUserType}`)

    // 如果使用了代金券，标记为已使用
    if (voucherId) {
      await db.collection('vouchers').doc(voucherId).update({
        data: {
          used: true,
          usedOrderId: orderNo,
          usedAt: new Date()
        }
      }).catch(e => console.error('核销代金券失败:', e))
    }
  } catch (e) {
    console.error('updateMemberSpending 失败:', e)
  }
}

// 修复的日期格式化函数
function formatDateForWeChat(dateString) {
  try {
    console.log('📅 原始日期:', dateString)
    
    let date
    if (!dateString) {
      // 如果没有提供日期，使用当前日期
      date = new Date()
    } else if (typeof dateString === 'string') {
      // 处理您的格式 "2025/11/30 14:00-15:00"
      if (dateString.includes('/')) {
        const datePart = dateString.split(' ')[0] // 取 "2025/11/30"
        const [year, month, day] = datePart.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else if (dateString.includes('-')) {
        // 处理 "2025-11-30" 格式
        date = new Date(dateString)
      } else {
        // 其他格式尝试解析
        date = new Date(dateString)
      }
    } else {
      date = new Date(dateString)
    }
    
    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期')
    }
    
    // 微信要求格式：YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    const formattedDate = `${year}-${month}-${day}`
    console.log('📅 格式化后日期:', formattedDate)
    
    return formattedDate
  } catch (error) {
    console.error('❌ 日期格式化错误:', error)
    // 使用当前日期作为默认值
    const now = new Date()
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    console.log('📅 使用默认日期:', defaultDate)
    return defaultDate
  }
}

// 将通知函数移到外部，避免重复定义
async function notifyCustomerBySubscribeMessage(orderInfo, customerOpenId) {
  console.log('📧 准备发送通知，orderInfo:', orderInfo)
  console.log('👤 客服OpenID:', customerOpenId)
  
  try {
    // 安全处理数据
    const messageData = {
      thing5: { 
        value: (orderInfo.productInfo || '蛋糕订单').substring(0, 20) 
      },
      amount12: { 
        value: `${(orderInfo.amount / 100).toFixed(2)}` // 只要数字，不要"元"
      },
      date13: { 
        value:formatDateForWeChat(orderInfo.selectedDateTime)  // 格式：YYYY-MM-DD
      },
      name15: { 
        value: (orderInfo.customerName || '客户').substring(0, 10) 
      },
      phone_number31: { 
        value: orderInfo.customerPhone || '未填写' 
      }
    }
    
    console.log('📦 消息数据:', messageData)
    
    const result = await cloud.openapi.subscribeMessage.send({
      touser: customerOpenId, // ✅ 修复：使用参数传入的OpenID
      templateId: 'bbArTvSArB8DEC4c3ai88Clodvbwx_vgYymDQK6UUwM', // ⚠️ 需要替换为真实模板ID
      page: 'pages/order/detail?orderNo=' + orderInfo.orderNo,
      data: messageData
    })
    
    console.log('✅ 订阅消息发送成功:', result)
    return true
  } catch (error) {
    console.error('❌ 订阅消息发送失败:', error)
    return false
  }
}
// 安全获取客户信息
function getCustomerInfo(dbOrder) { 
  // 安全访问嵌套属性
  const customerInfo = dbOrder.customerInfo || {}
  const selectedConsignee = customerInfo.selectedConsignee || {}
  const selectedAddress = customerInfo.selectedAddress || {}
  return {
    customerName: selectedConsignee.name || selectedAddress.name,
    customerPhone: selectedConsignee.code ||selectedAddress.phone, // 注意：您的数据中电话是 code 字段
    selectedDateTime: customerInfo.selectedDateTime || ''
  }
}
exports.main = async (event, context) => {
  console.log('💰 收到微信支付V2回调:', JSON.stringify(event, null, 2))
  
  try {
    // 1. 🔍 检查回调数据有效性
    if (!event.returnCode || event.returnCode !== 'SUCCESS') {
      console.log('通信标识失败:', event.returnMsg || '未知错误')
      return { code: 'FAIL', message: '通信失败' }
    }
    
    if (!event.resultCode || event.resultCode !== 'SUCCESS') {
      console.log('业务结果失败:', event.errCodeDes || '未知业务错误')
      return { code: 'FAIL', message: '业务失败' }
    }

    // 2. 📊 提取关键订单信息
    const orderNo = event.outTradeNo
    const wechatOrderNo = event.transactionId
    const totalFee = event.totalFee
    const cashFee = event.cashFee
    const timeEnd = event.timeEnd
    
    if (!orderNo) {
      console.error('订单号缺失')
      return { code: 'FAIL', message: '订单号缺失' }
    }

    console.log('处理支付成功订单:', { orderNo, wechatOrderNo, totalFee, cashFee, timeEnd })

    // 3. 🗄️ 获取数据库引用
    const db = cloud.database()
    const _ = db.command

    // 4. 🔄 幂等性检查
    const orderRes = await db.collection('orders')
      .where({ orderNo: orderNo })
      .get()

    let orderExists = false
    let currentStatus = ''

    if (orderRes.data.length > 0) {
      orderExists = true
      currentStatus = orderRes.data[0].status
      
      if (currentStatus === 'paid') {
        console.log('订单已处理，直接返回成功')
        return { code: 'SUCCESS', message: '订单已处理' }
      }
    }

    // 5. 📝 更新或创建订单记录
    if (orderExists) {
      const updateResult = await db.collection('orders')
        .where({ orderNo: orderNo })
        .update({
          data: {
            status: 'paid',
            wechatOrderNo: wechatOrderNo,
            payTime: timeEnd,
            cashFee: cashFee,
            bankType: event.bankType,
            tradeType: event.tradeType,
            updatedAt: new Date()
          }
        })
      
      console.log('订单更新结果:', updateResult)
    } else {
      const createResult = await db.collection('orders')
        .add({
          data: {
            orderNo: orderNo,
            wechatOrderNo: wechatOrderNo,
            totalFee: totalFee,
            cashFee: cashFee,
            status: 'paid',
            payTime: timeEnd,
            bankType: event.bankType,
            tradeType: event.tradeType,
            openid: event.subOpenid || event.openid,
            appid: event.subAppid || event.appid,
            mchId: event.subMchId || event.mchId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      
      console.log('新订单创建结果:', createResult)
    }

    // 6. 💰 更新会员消费金额与等级
    // 先获取完整订单以拿到 openid 和 voucherId
    const orderForMember = await db.collection('orders').where({ orderNo: orderNo }).get()
    if (orderForMember.data.length > 0) {
      const dbOrderForMember = orderForMember.data[0]
      const memberOpenid = dbOrderForMember.openid || event.subOpenid || event.openid
      const paidAmountYuan = (cashFee || totalFee || 0) / 100
      const voucherId = (dbOrderForMember.customerInfo || {}).voucherId || null
      await updateMemberSpending(db, memberOpenid, paidAmountYuan, voucherId, orderNo)
    }

    // 7. 🎯 构建 orderInfo 并调用通知函数
    console.log('🔍 开始构建 orderInfo...')
    
    // 从数据库获取完整订单信息（用于通知）
    const enhancedOrderRes = await db.collection('orders')
      .where({ orderNo: orderNo })
      .get()
    
    let orderInfo = {
      orderNo: orderNo,
      amount: totalFee,
      payTime: timeEnd,
      productInfo: '蛋糕订单', // 默认值
      customerName: '客户' ,    // 默认值
      
    }
    
    if (enhancedOrderRes.data.length > 0) {
      const dbOrder = enhancedOrderRes.data[0]
      const customerInfo = getCustomerInfo(dbOrder)
      // 补充数据库中的业务信息
      orderInfo = {
        ...orderInfo,
        productInfo: dbOrder.productInfo.title || dbOrder.productName || '定制蛋糕',
        customerName: customerInfo.customerName || '客户',
        customerPhone: customerInfo.customerPhone || '',
        selectedDateTime:customerInfo.selectedDateTime
      }
    }
    
    console.log('📦 构建的 orderInfo:', orderInfo)
    
    // 8. 📞 调用通知函数
    const customerOpenId = await getCustomerServiceOpenId() // 获取客服OpenID
    if (customerOpenId) {
      console.log('👤 获取到客服OpenID:', customerOpenId)
      await notifyCustomerBySubscribeMessage(orderInfo, customerOpenId)
    } else {
      console.log('⚠️ 未找到客服OpenID，跳过通知')
    }

    // 9. ✅ 返回成功响应
    console.log('✅ 支付回调处理完成')
    return { code: 'SUCCESS', message: '接收成功' }

  } catch (error) {
    console.error('❌ 回调处理异常:', error)
    return { code: 'SUCCESS', message: '处理完成' }
  }
}

// 获取客服OpenID的函数
async function getCustomerServiceOpenId() {
  try {
    // 方法1：从数据库获取
    const db = cloud.database()
    const serviceRes = await db.collection('customer_services')
      .where({ isActive: true })
      .limit(1)
      .get()
    
    if (serviceRes.data.length > 0) {
      return serviceRes.data[0].openId
    }
    
    // 方法2：从环境变量获取
    // return process.env.CUSTOMER_SERVICE_OPENID
    
    // 方法3：硬编码测试（临时方案）
    return 'oduMH46-IP4BGzWyXGFjZaDZbiGg' // 🔥 替换为真实客服OpenID
    
  } catch (error) {
    console.error('获取客服OpenID失败:', error)
    return null
  }
}