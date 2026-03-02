const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  try {
    console.log('用户ID', event.openid);
    const db = cloud.database()
    const wxContext = cloud.getWXContext()
    const consigneeData = {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      createTime: new Date(),
      updateTime: new Date(),
      name: event.name,
      code: event.code,
    }
     // 2. 💾 将订单保存到数据库
     const consigneeRes = await db.collection('consignee').add({
      data: consigneeData
    })
     console.log('提货人创建成功，ID:', consigneeRes._id)

  } catch (error) {
    console.error('提货人创建失败:', error);
    return { errMsg: error.message };
  }
  }