const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 管理员查看意见列表：密码校验 + 关键词搜索
// 密码常量，部署后可自行修改
const ADMIN_PWD = '123456789';

exports.main = async (event) => {
  if (event.password !== ADMIN_PWD) {
    return { error: '密码错误' };
  }

  const keyword = (event.keyword || '').trim();
  let res;
  if (keyword) {
    res = await db
      .collection('opinions')
      .where({
        content: db.RegExp({ regexp: keyword, options: 'i' })
      })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
  } else {
    res = await db
      .collection('opinions')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
  }

  const list = res.data.map((o) => ({
    _id: o._id,
    content: o.content,
    ts: o.createdAt instanceof Date ? o.createdAt.getTime() : Date.now()
  }));

  return { list };
};
