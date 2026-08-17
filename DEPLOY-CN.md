# 部署到国内云服务器（轻量应用服务器 / Ubuntu）

适用场景：长期对外收问卷、不想让本机一直开着。
推荐：腾讯云 / 阿里云「轻量应用服务器」，系统选 **Ubuntu 22.04**，配置 1核2G 起步即可。

---

## 一、在腾讯云买「轻量应用服务器」（手机/电脑浏览器都能操作）

1. 打开 https://cloud.tencent.com → 顶部搜「**轻量应用服务器**」→ 进入产品页点「**立即购买**」
2. 按下面选（别选错镜像，其它默认即可）：
   - **地域**：选离你近的，如「上海」「广州」「北京」
   - **镜像**：选 **系统镜像 → Ubuntu → 22.04 LTS**
   - **套餐**：入门就行，**2核2G**（或 1核2G，价格更低，约 ¥60–100/年）；带宽选默认的「按套餐」即可
   - **购买时长**：选 **1年**（长期用划算）
   - **实例名称**：随便填，如 `survey`
3. 点「**立即购买**」→ **登录/注册腾讯云账号** → **完成实名认证**（按提示刷脸，几分钟，法律规定必须）
4. **支付**（微信/银行卡都行，首年很便宜）
5. 支付后在「**控制台 → 轻量应用服务器**」能看到你的实例：
   - 记下页面上的 **公网 IP**（形如 `1.2.3.4`）← 这就是别人访问你网站的地址前缀
   - 点进实例 → 「**防火墙**」→ 「**添加规则**」：
     - 应用类型：自定义
     - 协议：TCP
     - 端口：`3000`
     - 策略：允许
     - 确定
6. 实例页点「**登录**」→ 会弹出**网页终端**（不用装任何软件），后面第三节的命令就贴在这里

> 仅用 `IP:端口` 访问（如 `http://1.2.3.4:3000`）**无需备案**，直接能用，发链接给别人填完全没问题。
> 只有想用「自定义域名 + https(443)」才需 ICP 备案（免费，约 1–2 周）。做问卷先用 IP 就行。

---

## 二、登录服务器（两种方式任选）

- 腾讯云/阿里云控制台都有「登录」按钮，点开就是网页终端，直接粘贴命令即可，不用装任何软件。

---

## 三、在服务器终端里粘贴以下命令（一次性）

```bash
# 1) 安装 Node.js 22（项目需要）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2) 下载项目代码（从 GitHub 仓库，自动打包下载，免 git 协议）
cd ~
curl -L -o survey.zip https://github.com/xiaobai0714/survey-site/archive/refs/heads/main.zip
sudo apt-get install -y unzip
unzip -o survey.zip
mv survey-site-main survey-site
cd survey-site

# 3) 用 pm2 让网站 24 小时常驻（关掉终端也不停）
sudo npm install -g pm2
pm2 start server.js --name survey
pm2 save
pm2 startup   # 按它提示再粘贴一条命令，实现开机自启

# 4) 验证
curl -s -o /dev/null -w "本地 HTTP %{http_code}\n" http://localhost:3000/
```

> 第 2 步如果 `github.com` 下载慢，可在本机把 `survey-site` 文件夹压缩成 `survey.zip`，
> 用控制台/scp 传到服务器后 `unzip` 即可，效果一样。

---

## 四、访问

- 填问卷：`http://你的公网IP:3000`
- 管理后台：`http://你的公网IP:3000/admin.html`（账号 `admin` / 密码 `123456789`）

---

## 五、以后改网站内容怎么办

告诉我你要改什么（加题目、换配色、改文案），我改完后：
- 推到 GitHub（`git push`），你在服务器上 `cd ~/survey-site && pm2 restart survey` 即可生效；
- 或我直接把新文件发你，你覆盖上传后 `pm2 restart survey`。

---

## 六、数据备份（重要）

数据存在服务器 `~/survey-site/data/submissions.json`。
- 简单备份：在后台点「导出 CSV」；
- 或定期 `cp ~/survey-site/data/submissions.json ~/backup-日期.json`。
（服务器硬盘是持久化的，不像 Render 免费盘会清空，正常不开重启不会丢。）

---

## 七、换 SQLite 永久存储（可选，按需让我做）

当前用 JSON 文件在持久化服务器上已足够稳定。若你想要"更正规"的数据库存储（并发写入更稳），
让我把存储层换成 SQLite（用 Node 内置 `node:sqlite`，零额外依赖），再按上面步骤重新部署一次即可。
