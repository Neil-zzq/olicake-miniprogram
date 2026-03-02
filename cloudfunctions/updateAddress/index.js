// cloudfunctions/updateAddress/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const _ = db.command
  
  const { 
    addressId,  // 数据库的 _id
    newAddress
  } = event
  
  const openid = wxContext.OPENID
  const updateTime = new Date()
  
  try {
    if (!addressId) {
      return {
        success: false,
        error: '缺少地址ID参数'
      }
    }
    
    // 检查地址是否存在
    const checkResult = await db.collection('address')
      .where({
        _id: addressId,
        openid:openid
      })
      .get()
    
    if (checkResult.data.length === 0) {
      return {
        success: false,
        error: '地址不存在或无权限更新'
      }
    }
    
  
    
    // 更新数据
    const updateResult = await db.collection('address')
      .doc(addressId)
      .update({
        data: {
          ...newAddress,
          updateTime
        }
      })
    
    return {
      success: true,
      data: updateResult
    }
    
  } catch (error) {
    console.error('更新地址失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}