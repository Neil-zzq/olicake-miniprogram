// cloudfunctions/deleteAddress/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const addressId = event.addressId
  console.log('删除地址参数:', addressId)
  const openid = wxContext.OPENID  // 获取当前用户的openid
  try {
    if (!addressId) {
      return {
        success: false,
        error: '缺少地址ID参数',
        code: 'MISSING_ADDRESS_ID'
      }
    }
    // 1. 先查询地址是否存在
    const queryResult = await db.collection('address')
      .where({
        _id: addressId,
        openid:openid
      })
      .get()
    
    console.log('查询结果:', queryResult)
    
    if (queryResult.data.length === 0) {
      return {
        success: false,
        error: '地址不存在或无权限删除',
        code: 'ADDRESS_NOT_FOUND_OR_NO_PERMISSION'
      }
    }
    
    const addressToDelete = queryResult.data[0]
    console.log('要删除的地址:', addressToDelete)
    
    // 2. 执行删除
    const deleteResult = await db.collection('address')
      .doc(addressId)
      .remove()
    
    console.log('删除结果:', deleteResult)
    
    return {
      success: true,
      deletedCount: deleteResult.stats.removed,
      addressId: addressId,
      data: addressToDelete,
      message: '地址删除成功'
    }
    
  } catch (error) {
    console.error('删除地址失败:', error)
    return {
      success: false,
      error: error.message,
      code: 'DELETE_FAILED'
    }
  }
}