// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // 1. 如果已指定环境ID，请替换为您的环境ID
  // 2. 或者使用当前环境
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { code } = event
  
  try {
    // 方法1：使用云调用直接解密（推荐）
    // 注意：这个方法需要确保用户的session_key有效
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code, 
    })
    console.log('解密结果:', result)
    if (result.errCode == 0) {
      return {
        code: 0,
        msg: '解密成功',
        data: {
          phoneNumber: result.phoneInfo.phoneNumber,
          purePhoneNumber: result.phoneInfo.purePhoneNumber,
          countryCode: result.phoneInfo.countryCode
        }
      }
    } else {
      return {
        code: 1,
        msg: '解密失败: ' + result.errmsg
      }
    }
  } catch (error) {
    console.error('解密手机号错误:', error)
    return {
      code: 1,
      msg: '解密失败: ' + error.message
    }
  }
}