// 云函数：查询用户可用代金券
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { openid } = event

  if (!openid) {
    return { code: 1, msg: '缺少用户标识', vouchers: [] }
  }

  try {
    const db = cloud.database()
    const _ = db.command
    const now = new Date()

    const res = await db.collection('vouchers')
      .where({
        _openid: openid,
        used: false,
        expireTime: _.gt(now)
      })
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      vouchers: res.data
    }
  } catch (error) {
    console.error('查询代金券失败:', error)
    return {
      code: 1,
      msg: '查询失败: ' + error.message,
      vouchers: []
    }
  }
}
