// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk')
cloud.init()

// 生成手机号的多种可能格式（兼容微信 86 区号、纯 11 位等）
function getPhoneVariants(phone) {
  const p = (phone || '').trim().replace(/\s/g, '')
  if (!p) return []
  const set = new Set([p])
  if (/^\d{11}$/.test(p)) set.add('86' + p)
  if (/^86\d{11}$/.test(p)) set.add(p.slice(2))
  return [...set]
}

// 累计消费 = 该会员注册手机号所关联的所有 openid 登陆下单的已支付订单实际金额汇总
// 关联 openid = user 表中 phoneNumber 等于该手机号的所有 _openid（兼容 86 区号格式）
async function calcCumulativeSpending(db, phoneNumber, fallbackOpenid) {
  try {
    const _ = db.command
    const variants = getPhoneVariants(phoneNumber)
    let openids = []

    for (const p of variants) {
      const usersRes = await db.collection('user')
        .where({ phoneNumber: p })
        .get()
      for (const u of usersRes.data) {
        const oid = u._openid || u.openid
        if (oid) openids.push(oid)
      }
    }
    openids = [...new Set(openids)]
    if (openids.length === 0 && fallbackOpenid) openids = [fallbackOpenid]
    if (openids.length === 0) return 0

    // 2. 查询这些 openid 的已支付/已完成订单并汇总（云数据库 in 最多 20 个）
    let sum = 0
    const batchSize = 20
    for (let i = 0; i < openids.length; i += batchSize) {
      const batch = openids.slice(i, i + batchSize)
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

function calcUserType(spending) {
  if (spending >= 10000) return 'diamond'
  if (spending >= 5000) return 'blackGold'
  if (spending >= 3000) return 'platinum'
  if (spending >= 1000) return 'silver'
  return 'generalMember'
}

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const { openid } = event

    if (!openid) return {
      success: false,
      error: 'openid不能为空',
    }

    // 1. 先查用户基础信息（用于获取手机号，兼容 _openid / openid）
    let userResult = await db.collection('user').where({ _openid: openid }).get()
    if (userResult.data.length === 0) {
      userResult = await db.collection('user').where({ openid: openid }).get()
    }
    const userInfo = userResult.data[0] || null
    const phoneNumber = (userInfo && userInfo.phoneNumber) || ''

    // 2. 从订单实时计算累计消费（手机号关联的所有 openid 的订单汇总，无手机号时用 openid 兜底）
    const cumulativeSpending = await calcCumulativeSpending(db, phoneNumber, openid)
    const usertype = calcUserType(cumulativeSpending)

    let resultUser = userInfo || { cumulativeSpending, usertype: '' }
    resultUser.cumulativeSpending = cumulativeSpending
    resultUser.usertype = usertype
    if (userInfo) {
      await db.collection('user').doc(userInfo._id).update({
        data: {
          cumulativeSpending,
          usertype,
          updateTime: new Date()
        }
      }).catch(e => console.error('同步累计消费失败:', e))
    }

    return {
      success: true,
      message: '查询成功',
      userInfo: resultUser
    }
  } catch (error) {
    console.error('❌ 查询用户失败:', error)
    return {
      success: false,
      error: error.message,
      userInfo: null
    }
  }
}
