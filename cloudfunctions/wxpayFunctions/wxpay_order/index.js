const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  try {
    console.log('收到支付请求，金额:', event.total_fee, '分');
    
    if (event.total_fee <= 0) {
      return { errMsg: '金额错误' };
    }
    const db = cloud.database()
    const wxContext = cloud.getWXContext()
    const orderData = {
      orderNo: 'OLI' + Date.now() + Math.random().toString(36).substr(2, 5),
      totalFee: event.total_fee,
      status: 'pending', // 待支付
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      createTime: new Date(),
      updateTime: new Date(),
      // 其他业务字段...
      productInfo: event.product_info || '定制蛋糕',
      customerInfo: event.customer_info || {},
    }
     // 2. 💾 将订单保存到数据库
     const orderRes = await db.collection('orders').add({
      data: orderData
    })
     console.log('订单创建成功，ID:', orderRes._id)


     // 安全的IP获取方式
     const clientIP = (wxContext && wxContext.CLIENTIP) ? wxContext.CLIENTIP : '127.0.0.1'
    // 3. 💳 然后调用微信支付
    const payResult = await cloud.cloudPay.unifiedOrder({
      body: 'Oli Cake 蛋糕订单'+ orderData.orderNo,
      outTradeNo: orderData.orderNo,
      spbillCreateIp: clientIP,
      subMchId: '1732049926',
      totalFee: event.total_fee,
      envId: 'cloud1-0gggau3xd319b71f',
      functionName: 'wxpayOrderCallback'
    });

    console.log('支付下单成功');
    return { 
      errMsg: 'ok', 
      orderId: orderRes._id, // 返回订单ID
      orderNo: orderData.orderNo, // 返回订单号
      payment: payResult.payment
    };
    
  } catch (error) {
    console.error('支付下单失败:', error);
    return { errMsg: error.message };
  }
};