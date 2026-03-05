// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk')
cloud.init()

// 从已完成/已支付订单实时计算累计消费
async function calcCumulativeSpending(db, openid) {
  try {
    const _ = db.command
    const ordersRes = await db.collection('orders')
      .where({
        openid: openid,
        status: _.in(['paid', 'completed'])
      })
      .get()
    let sum = 0
    for (const order of ordersRes.data) {
      const fee = (order.cashFee || order.totalFee || 0) / 100
      sum += fee
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

    // 1. 从订单实时计算累计消费
    const cumulativeSpending = await calcCumulativeSpending(db, openid)
    const usertype = calcUserType(cumulativeSpending)

    // 2. 查询用户基础信息
    const userResult = await db.collection('user')
      .where({ _openid: openid })
      .get()

    let userInfo = userResult.data[0] || null
    if (userInfo) {
      userInfo.cumulativeSpending = cumulativeSpending
      userInfo.usertype = usertype
      await db.collection('user').doc(userInfo._id).update({
        data: {
          cumulativeSpending,
          usertype,
          updateTime: new Date()
        }
      }).catch(e => console.error('同步累计消费失败:', e))
    } else {
      // 无用户记录 = 未注册，不赋予等级，仅返回累计消费
      userInfo = { cumulativeSpending, usertype: '' }
    }

    return {
      success: true,
      message: '查询成功',
      userInfo
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
