// 云函数：保存用户信息
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

function getPhoneVariants(phone) {
  const p = (phone || '').trim().replace(/\s/g, '')
  if (!p) return []
  const set = new Set([p])
  if (/^\d{11}$/.test(p)) set.add('86' + p)
  if (/^86\d{11}$/.test(p)) set.add(p.slice(2))
  return [...set]
}

// 累计消费 = 该手机号关联的所有 openid 的已支付订单金额汇总
async function calcCumulativeSpending(db, phoneNumber) {
  try {
    const _ = db.command
    const variants = getPhoneVariants(phoneNumber)
    const openids = []
    for (const p of variants) {
      const usersRes = await db.collection('user').where({ phoneNumber: p }).get()
      for (const u of usersRes.data) {
        const oid = u._openid || u.openid
        if (oid) openids.push(oid)
      }
    }
    const uniqueOpenids = [...new Set(openids)]
    if (uniqueOpenids.length === 0) return 0
    let sum = 0
    const batchSize = 20
    for (let i = 0; i < uniqueOpenids.length; i += batchSize) {
      const batch = uniqueOpenids.slice(i, i + batchSize)
      const ordersRes = await db.collection('orders')
        .where(_.and([
          { openid: _.in(batch) },
          { status: _.in(['paid', 'completed']) }
        ]))
        .get()
      for (const order of ordersRes.data) {
        sum += (order.cashFee || order.totalFee || 0) / 100
      }
    }
    return parseFloat(sum.toFixed(2))
  } catch (e) {
    console.error('计算累计消费失败:', e)
    return 0
  }
}

// 重算并更新该手机号关联的所有用户的累计消费
async function recalcAndUpdateUsersByPhone(db, phoneNumber) {
  const variants = getPhoneVariants(phoneNumber)
  if (variants.length === 0) return
  try {
    const cumulativeSpending = await calcCumulativeSpending(db, phoneNumber)
    const usertype = calcUserType(cumulativeSpending)
    const seen = new Set()
    for (const p of variants) {
      const usersRes = await db.collection('user').where({ phoneNumber: p }).get()
      for (const u of usersRes.data) {
        if (seen.has(u._id)) continue
        seen.add(u._id)
        await db.collection('user').doc(u._id).update({
          data: { cumulativeSpending, usertype, updateTime: new Date() }
        })
      }
    }
    console.log(`手机号 ${phoneNumber} 关联用户累计消费重算：¥${cumulativeSpending}，等级=${usertype}`)
  } catch (e) {
    console.error('recalcAndUpdateUsersByPhone 失败:', e)
  }
}

exports.main = async (event) => {
  const { openid, userData } = event

  if (!openid) {
    return { code: 1, msg: '缺少用户标识' }
  }

  try {
    const db = cloud.database()

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

      await db.collection('user')
        .doc(existingUser._id)
        .update({
          data: {
            ...safeUpdateData,
            updateTime: new Date()
          }
        })

      // 绑定/变更手机号后，重算该手机号关联用户的累计消费
      if (userData.phoneNumber) {
        await recalcAndUpdateUsersByPhone(db, userData.phoneNumber)
      }
      if (existingUser.phoneNumber && existingUser.phoneNumber !== userData.phoneNumber) {
        await recalcAndUpdateUsersByPhone(db, existingUser.phoneNumber)
      }
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

      if (userData.phoneNumber) {
        await recalcAndUpdateUsersByPhone(db, userData.phoneNumber)
      }

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
