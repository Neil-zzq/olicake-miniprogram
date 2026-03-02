// 云函数：保存用户信息
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { openid, userData } = event
  
  if (!openid) {
    return { code: 1, msg: '缺少用户标识' }
  }
  
  try {
    const db = cloud.database()
    
    // 1. 查询用户是否存在
    const queryRes = await db.collection('user')
      .where({ _openid: openid })
      .get()
    
    if (queryRes.data.length > 0) {
      // 2. 用户存在，更新数据
      await db.collection('user')
        .doc(queryRes.data[0]._id)
        .update({
          data: {
            ...userData,
            updateTime: new Date()
          }
        })
      
      console.log('用户信息更新成功')
      return { code: 0, msg: '更新成功' }
    } else {
      // 3. 用户不存在，创建新用户
      await db.collection('user').add({
        data: {
          _openid: openid,
          ...userData,
          createTime: new Date(),
          updateTime: new Date()
        }
      })
      
      console.log('用户创建成功')
      return { code: 0, msg: '创建成功' }
    }
  } catch (error) {
    console.error('保存用户信息失败:', error)
    return { 
      code: 1, 
      msg: '保存失败: ' + error.message 
    }
  }
}