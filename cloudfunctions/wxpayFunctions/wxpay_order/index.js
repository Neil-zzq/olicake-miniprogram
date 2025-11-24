/**
 * 微信支付 - 下单
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到支付请求，金额:', event.total_fee, '分'); // 添加这行
  
  // 检查金额是否正确
  if (event.total_fee <= 0) {
    console.log('错误：金额不能为0或负数');
    return { errMsg: '金额错误' };
  }
  try {
  const wxContext = cloud.getWXContext();

  // 商户自行生成商户订单号，此处仅为代码示例
  const outTradeNo ='OLI' + Date.now() + Math.round(Math.random() * 1000);

  // 商户存储订单号到数据库，便于后续与微信侧订单号关联。例如使用云开发云存储能力：
  // db.collection('orders').add({ data: { outTradeNo } });
  // 初始化微信支付SDK
  const { WxPay } = require('wx-js-utils');
  const wxpay = new WxPay({
    appid:'wx6b35d64021d0f2ab',
    mchid:'1732049926',
    serialNo:'460FD24D246667B97AB93BB8E947C999826D928C',
    key: 'abC123def456ghi789jkl012mno345pQ',
    privateKey:`-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1w9my0rQeO2N0
viRcWSpoaTPTmbey5FXWW0haTRikCr+sCzv0WNjHt+J9Njc3HREABLUIf1/SymT/
4T95OD5uEaHpHLc6uTKFF59CeXuhb/bfobsJV22OdXKMiA+2UfbtGnbKd+7RscnM
122ilB92ehZ6WtzfJpxVj06HTtBujF14DwHCY88FuuXekeHgZtvU3soHB+agBIGx
uS55yt5YOsR0mDvyLzBuLiQ+f6wEaPXKUf6zGnjZK2fn+Ev7bR2NU/kfqu1+OjSr
DhHCPm9wqlaY6TyTFlfmYeQxLTTEYC1t26N/G0y8Wtl7o1ZXnhiNJagPSkdLG4Pr
oRd9VhD7AgMBAAECggEAS0tSBu2Zh1x6moWZclfNZWsO+PyYSBamKCGwGxgMuQdq
1s3gjBux0SmvPMcUoFP+Es/gXiDFhQAqToT0UjamRdowA+zNSholf1SFuHeyavGC
hqjsXbZFv9mPFf/W4mOZsiZgRwbfeyX2vlAPLmXFksKIRS8Wh6nq4NZ4ZTyUwvXX
WRAxU/HRF1W3ZmzQmpF1s4jdyiw8AUjSBQCv4PXE46MPsLMw4GK9+Z+JC23CWWpg
QCMRR/z0iiVrmpbnfIA31pxrb7hiUUCtYjc6d01ecNGL5OIuZsjTts5MlUqyf+Bk
cacZqNDYsix9Guz60DFH53hRENGFO3bZh0tkBRgEYQKBgQDjm7CrOmz1iSYDAcka
XBSEPj0vSEgA6C85+IX7J76DLyLu6mLPXpElgzH7NA+SVXfuZbDaIBq/UH7luSTX
ElZ4mAp7ZTi/jBfeIM9TdA/Ts5Kbte+qCKwtLweliVMgzE64qKQpXJ+5SFwyNMQz
AK0KHYsMKid1i8rF+2kbXG+irQKBgQDMcDtjNBW7VpJonP/IdzaxAtxvE0wA5jhM
r2e8Jm3rC7+Aj5NK0mxhyB5FYKzZYUVabU+xnXa5R0AWTlXoX95wih/eGXZY2tVK
Z6adlDpl5IwMmeSuyIH7WCsGry0ZkJ1tz45Zz2bHSdnr+A5/NmObzOGhDUhUn6Fp
9Iw33wEfRwKBgQDBic6lGu4xruhKoEcPigLMHFxMi0rmsogN5DyRPs9pnzg2LcnN
iR0k57UlZLRk+xYa+g9yut/jlCADWPZxhx9ONgKbwIuLnSVidUW2MbePjV951i+v
xuYZGaeH5AhymCfML2I/5YnPtC7pZiL7N3TsaAinVGTvN+o5hTlv0Z7/lQKBgEb9
LdIL0wQDUsGaysLsioQ6zxqO49RoHOKcAfR2j7KPmMbmlCnmGZZ2q/RBVqQBP9jf
nk25tPEvSZS1TOVs7Mu9WsV/p/XAv1Gf3l5Xi1O4Yd06TwtWOrRxcDdY+tsmuVPZ
P7/14eWPwmlK8JXB6CLAqRSIjTY9XApzzYDVIgmfAoGABtX5asAs+Zk0DyfABvkJ
0FYC3MP3c0rvhV7rwMnYtRlbnhZ5yVWIstwVI9AskWB5xHtji5GIS29DKXTCYkgW
p0RF/8xIsT6rlOJMYAar0c1sa/A6pdu4euxlr6YUgMUHrP/M8LMbR+OlDkCgJmVA
1pjHdRN9OcXMQhPv0AHjK1E=
-----END PRIVATE KEY-----`
  });


const result = await wxpay.v3.transactions.jsapi({
  description: 'Oli Cake 蛋糕订单', // 商品描述
  out_trade_no: outTradeNo, // 您的订单号
  amount: {
    total: event.total_fee, // 金额，单位：分
    currency: 'CNY',
  },
  payer: {
    openid: wxContext.OPENID, // 用户openid
  },
  // ！！！最重要的配置：支付结果通知回调地址！！！
  notify_url: 'https://api.weixin.qq.com/tcb/invokecloudfunction?env=cloud1-0gggau3xd319b71f&name=wxpayOrderCallback',
});
 console.log('支付下单成功，金额:', event.total_fee, '分');
    return { errMsg: 'ok', data: result };
  } catch (error) {
    console.error('支付下单失败:', error);
    return { errMsg: error.message };
  }
};