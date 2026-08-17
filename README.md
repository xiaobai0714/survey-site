# 用户体验调查问卷网站

美观简约的问卷调查站点，带管理员后台。普通用户**无需登录**直接填问卷；只有管理员登录后才能查看每一份已提交的问卷（标注时间、姓名等）。

- 用户页：`/`（首页填问卷）
- 管理后台：`/admin.html`（目录表格，按姓名搜索 / 导出 CSV / 退出）
- 管理员账号：`admin`　密码：`123456789`（在 `server.js` 顶部常量修改）

---

## 一、本地运行（开发 / 试用）

需要 Node.js 18+。在本目录执行：

```bash
node server.js
```

然后浏览器打开：

- 填问卷：http://localhost:3000
- 管理后台：http://localhost:3000/admin.html

数据保存在 `data/submissions.json`。

---

## 二、长期部署到公网（Render，免费，推荐）

这个网站带一个 Node 后端（负责接收问卷、存数据、管理员鉴权），所以必须部署到**能运行 Node 的平台**，纯静态托管（如只传 HTML）无法保存数据。

最省事、长期稳定的方案是 **Render**（免费额度足够个人问卷）：

### 方式 A：一键部署（最简单）

1. 先把本项目推送到你自己的 GitHub 仓库（仓库里包含 `server.js`、`package.json`、`public/`）。
2. 打开 https://render.com ，用 GitHub 登录 → New → Blueprint → 选择该仓库。
3. Render 会自动读取本项目的 `render.yaml`，点击 Create 即可。
4. 部署完成后会得到一个固定公网地址（如 `https://xxx.onrender.com`），**长期有效**，别人打开就能填。

### 方式 B：手动新建 Web Service

- Environment: `Node`
- Build Command: 留空（无依赖）
- Start Command: `node server.js`
- 实例类型：Free

> ⚠️ **数据持久化提醒**：Render 免费版的磁盘在每次重新部署/重启时会重置，JSON 文件里的历史问卷可能被清空。
> 解决：① 定期在后台点「导出 CSV」备份；② 或让我帮你把存储换成 SQLite（挂持久磁盘）/ 云数据库，这样数据永久保存。

### 以后怎么“继续修改网站内容”

改完本项目的文件后：

- 如果已连 GitHub + Render：把改动 `git push` 上去，Render 会**自动重新部署**，公网地址不变。
- 或者告诉我你想改什么（标题、问题、配色、加题目…），我改完帮你重新部署。

---

## 三、只想快速分享“长什么样”（纯静态预览）

如果只是想发个链接让别人看看界面/填着玩（**不能真正保存数据**），可以把 `public/` 目录直接传到任意静态托管（CloudStudio / GitHub Pages / Vercel 静态）。
前端会自动识别：检测不到后端时会显示「预览版」提示，不会点提交没反应。

---

## 四、常见修改点（给想自己动手的你）

| 想改的东西 | 改哪个文件 |
| --- | --- |
| 网站标题 / 副标题 / 品牌名 | `public/index.html`、`public/admin.html` |
| 问卷题目（姓名/年龄/职业/满意度/使用效果/意见） | `public/index.html`（表单部分）+ `server.js`（校验与字段）+ `public/admin.html`（表格列）+ `public/js/admin.js`（导出列） |
| 配色（主色、背景、圆角） | `public/css/style.css` 顶部的 `:root` 变量 |
| 管理员账号密码 | `server.js` 顶部 `ADMIN_USER` / `ADMIN_PASS` |

> 小提示：改题目时记得四处同步（用户页表单 → 后端校验 → 后台表格 → 导出 CSV），否则可能存不进或显示不全。懒得同步就直接让我改。

---

## 五、目录结构

```
.
├── server.js            # Node 后端：接口 + 静态托管 + 数据存储
├── package.json         # 启动脚本 / Node 版本要求
├── render.yaml          # Render 一键部署配置
├── public/
│   ├── index.html       # 用户填问卷页
│   ├── admin.html       # 管理员后台（登录 + 目录表格）
│   ├── css/style.css    # 样式（简约渐变风）
│   └── js/
│       ├── index.js     # 用户页逻辑（含预览版自动检测）
│       └── admin.js     # 后台逻辑（登录 / 列表 / 搜索 / 导出）
└── data/
    └── submissions.json # 问卷数据（程序自动读写）
```
