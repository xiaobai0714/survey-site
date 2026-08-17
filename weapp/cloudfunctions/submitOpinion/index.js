const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 提交一条意见（匿名，内容选填）
exports.main = async (event) => {
  const content = (event.content || '').toString().slice(0, 500);
  await db.collection('opinions').add({
    data: {
      content,
      createdAt: new Date()
    }
  });
  return { ok: true };
};
