// 云函数：保存当前用户的收藏列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    if (!openid) {
      return { code: 1, message: '未登录' }
    }

    const cakeIds = Array.isArray(event.cakeIds) ? event.cakeIds : []

    const res = await db.collection('user_favorites')
      .where({ _openid: openid })
      .get()

    const now = new Date()
    if (res.data.length > 0) {
      await db.collection('user_favorites')
        .doc(res.data[0]._id)
        .update({
          data: { cakeIds, updateTime: now }
        })
    } else {
      await db.collection('user_favorites').add({
        data: {
          _openid: openid,
          cakeIds,
          updateTime: now
        }
      })
    }
    return { code: 0, message: 'success' }
  } catch (e) {
    console.error('saveFavorites 失败:', e)
    return { code: -1, message: e.message || '保存失败' }
  }
}
