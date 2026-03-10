// 云函数：获取当前用户的收藏列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    if (!openid) {
      return { code: 1, message: '未登录', data: [] }
    }

    const res = await db.collection('user_favorites')
      .where({ _openid: openid })
      .get()

    const cakeIds = res.data[0] ? (res.data[0].cakeIds || []) : []
    return { code: 0, message: 'success', data: cakeIds }
  } catch (e) {
    console.error('getFavorites 失败:', e)
    return { code: -1, message: e.message || '获取失败', data: [] }
  }
}
