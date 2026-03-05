// 云函数：保存用户信息
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// ===== 会员等级工具函数（与 wxpayOrderCallback 保持一致）=====
function calcUserType(spending) {
  if (spending >= 10000) return 'diamond'
  if (spending >= 5000)  return 'blackGold'
  if (spending >= 3000)  return 'platinum'
  if (spending >= 1000)  return 'silver'
  return 'generalMember'
}

exports.main = async (event) => {
  const { openid, userData } = event

  if (!openid) {
    return { code: 1, msg: '缺少用户标识' }
  }

  try {
    const db = cloud.database()
    const _ = db.command

    // 1. 查询用户是否已存在
    const queryRes = await db.collection('user')
      .where({ _openid: openid })
      .get()

    if (queryRes.data.length > 0) {
      // ===== 用户已存在，执行更新 =====
      const existingUser = queryRes.data[0]

      // 保护会员等级和累计消费，不允许前端覆盖
      const safeUpdateData = { ...userData }
      delete safeUpdateData.usertype
      delete safeUpdateData.cumulativeSpending

      // 检测是否首次绑定手机号（之前无手机或手机号变了）
      const isNewPhone = userData.phoneNumber &&
        (!existingUser.phoneNumber || existingUser.phoneNumber !== userData.phoneNumber)

      if (isNewPhone) {
        // 查询以该手机号下单（非本 openid）的已支付订单，合并消费金额
        const phoneOrders = await db.collection('orders')
          .where(_.or([
            { 'customerInfo.selectedConsignee.code': userData.phoneNumber, status: 'paid' },
            { 'customerInfo.selectedAddress.phone': userData.phoneNumber, status: 'paid' }
          ]))
          .get()

        let additionalSpending = 0
        phoneOrders.data.forEach(order => {
          // 排除已属于该 openid 的订单（避免重复计算）
          if (order.openid !== openid) {
            additionalSpending += (order.cashFee || order.totalFee || 0) / 100
          }
        })

        if (additionalSpending > 0) {
          const newSpending = parseFloat(
            ((existingUser.cumulativeSpending || 0) + additionalSpending).toFixed(2)
          )
          safeUpdateData.cumulativeSpending = newSpending
          safeUpdateData.usertype = calcUserType(newSpending)
          console.log(`手机号合并消费：新增 ¥${additionalSpending}，累计 ¥${newSpending}，等级 ${safeUpdateData.usertype}`)
        }
      }

      await db.collection('user')
        .doc(existingUser._id)
        .update({
          data: {
            ...safeUpdateData,
            updateTime: new Date()
          }
        })

      console.log('用户信息更新成功')
      return { code: 0, msg: '更新成功' }

    } else {
      // ===== 用户不存在，创建新用户 =====
      const newUser = {
        _openid: openid,
        ...userData,
        usertype: 'generalMember',
        cumulativeSpending: 0,
        createTime: new Date(),
        updateTime: new Date()
      }

      const addRes = await db.collection('user').add({ data: newUser })
      console.log('用户创建成功，ID:', addRes._id)

      // 发放 20 元注册代金券
      const now = new Date()
      const expireTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1年有效期
      await db.collection('vouchers').add({
        data: {
          _openid: openid,
          amount: 20,
          minSpend: 0,
          used: false,
          usedOrderId: null,
          createTime: now,
          expireTime: expireTime,
          source: 'register_gift',
          desc: '注册会员礼包'
        }
      })
      console.log('注册代金券发放成功')

      return { code: 0, msg: '创建成功', isNewUser: true }
    }

  } catch (error) {
    console.error('保存用户信息失败:', error)
    return {
      code: 1,
      msg: '保存失败: ' + error.message
    }
  }
}
