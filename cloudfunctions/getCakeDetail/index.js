// 云函数 getCakeDetail
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { id } = event  // 获取传递的蛋糕id
    
    if (!id) {
      return {
        code: -1,
        message: '缺少蛋糕ID参数',
        data: null
      }
    }
    
    // 根据id查询单个蛋糕信息
    const result = await db.collection('cakeitems').doc(id).get()
    
    if (result.data) {
      return {
        code: 0,
        message: 'success',
        data: result.data
      }
    } else {
      return {
        code: 404,
        message: '蛋糕不存在',
        data: null
      }
    }
  } catch (err) {
    console.error('云函数执行失败：', err)
    
    // 如果是文档不存在的错误
    if (err.errCode === -502002) {
      return {
        code: 404,
        message: '蛋糕不存在',
        data: null
      }
    }
    
    return {
      code: -1,
      message: err.message || '获取蛋糕详情失败',
      data: null
    }
  }
}