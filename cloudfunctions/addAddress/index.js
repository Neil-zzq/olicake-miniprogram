const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  try {
    console.log('用户ID', event.openid);
    const db = cloud.database()
    const wxContext = cloud.getWXContext()
    const addressData = {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      createTime: new Date(),
      updateTime: new Date(),
      address: event.newAddress,
    }
     // 2. 💾 将订单保存到数据库
     const addressRes = await db.collection('address').add({
      data: addressData
    })
     console.log('地址创建成功，ID:', addressRes._id)

  } catch (error) {
    console.error('地址创建失败:', error);
    return { errMsg: error.message };
  }
  }