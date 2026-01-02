# 辅警招聘报名平台

本项目提供个人报名、短信验证（模拟）、实名登记、后台筛选与通知发布功能，适用于辅警招聘报名流程展示与管理。

## 功能概览
- 个人报名登记与短信验证码验证（演示模式）
- 实名信息校验（身份证号规则校验）
- 报名进度查询与通知记录查看
- 后台管理：筛选报名、更新状态、发布笔试/面试通知

## 本地运行
```bash
npm install
npm run start
```

默认访问地址：`http://localhost:3000`

## 管理员账号
默认账号密码（请尽快修改）：
- 账号：`admin`
- 密码：`admin123`

可通过环境变量覆盖：
```bash
set ADMIN_USER=yourname
set ADMIN_PASS=yourpass
set SESSION_SECRET=yoursecret
```

## 短信验证码说明
- 默认处于演示模式，会在页面提示验证码。
- 可设置 `SMS_DEBUG=false` 关闭演示提示。

## 数据存储
- 报名数据保存在 `data/db.json`。
- 若需接入数据库或短信服务，请替换 `lib/store.js` 与 `lib/sms.js`。
