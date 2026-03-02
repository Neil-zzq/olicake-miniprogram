// cloudfunctions/getCakeItems/index.js - 简化版
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取数据库引用
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 查询 cakeitems 集合中的所有数据
    const result = await db.collection('cakeitems').get()
    
    return {
      code: 0,
      message: 'success',
      data: result.data
    }
  } catch (err) {
    console.error('云函数执行失败：', err)
    return {
      code: -1,
      message: err.message || '获取数据失败',
      data: []
    }
  }
}