// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const { openid } = event
    
    
    if (!openid) return {
        success: false,
        error: 'openid不能为空',
      }
    
    
    // 1. 从数据库查询订单基础信息
    const userResult = await db.collection('user')
      .where({
        _openid: openid
      })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在',
        userInfo: null
      }
    }
    
    const userInfo = userResult.data[0]
     // 4. 🔥 关键修复：返回数据
     return {
      success: true,
      message: '查询成功',
      userInfo: userInfo
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
