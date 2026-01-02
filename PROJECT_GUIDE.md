# 项目说明书（结构与关联）

本说明书用于快速理解项目结构、模块关联、数据流转与后续扩展位置，便于后续调整与迭代。

## 项目定位
- 平台用途：辅警招聘报名登记与筛选通知平台（宣传信息通过其他渠道发布）
- 核心功能：个人报名、短信验证（模拟）、实名认证校验、进度查询、后台筛选与通知发布

## 目录结构概览
```
acheng/
├─ server.js                # 入口服务，路由、渲染、权限与业务调度
├─ package.json             # 依赖与脚本
├─ README.md                # 快速运行说明
├─ PROJECT_GUIDE.md         # 本说明书
├─ lib/
│  ├─ store.js              # 数据读写与统计
│  ├─ validators.js         # 表单校验（手机号/身份证）
│  └─ sms.js                # 短信发送与验证码（模拟）
├─ data/
│  └─ db.json               # 本地数据（运行时生成）
├─ views/                   # EJS 模板（页面）
│  ├─ index.ejs
│  ├─ apply.ejs
│  ├─ apply-success.ejs
│  ├─ status.ejs
│  ├─ admin/
│  │  ├─ login.ejs
│  │  ├─ applications.ejs
│  │  └─ application-detail.ejs
│  └─ partials/
│     ├─ shell-top.ejs
│     └─ shell-bottom.ejs
└─ public/
   ├─ css/main.css           # 样式与视觉系统
   ├─ js/apply.js            # 报名页短信验证码交互
   └─ favicon.svg
```

## 模块与职责
### 服务层
- `server.js`
  - Express 入口、路由定义、模板渲染
  - 后台登录与会话管理
  - 报名提交、查询、后台更新状态、通知发布
  - 短信验证码 API `/api/sms/send`

### 数据层
- `lib/store.js`
  - 负责 `data/db.json` 的读写
  - 提供报名创建、查询、更新与统计
  - 维护通知记录（与报名关联）

### 校验层
- `lib/validators.js`
  - 手机号与身份证号格式校验
  - 作为报名与查询的前置防线

### 短信层（模拟）
- `lib/sms.js`
  - 生成与验证短信验证码
  - 模拟发送通知短信（控制台输出）
  - 可替换为真实短信服务

### 视图层
- `views/`
  - `index.ejs`：首页（报名入口与统计）
  - `apply.ejs`：报名填写
  - `apply-success.ejs`：提交成功
  - `status.ejs`：进度查询
  - `admin/*`：后台登录、报名列表、详情与通知发布
  - `partials/*`：公共头部/底部

### 静态资源
- `public/css/main.css`：全站样式
- `public/js/apply.js`：短信验证码交互（发送、倒计时、错误提示）

## 关键业务流程与关联
### 报名流程
1. 用户在 `/apply` 填写报名信息。
2. 页面调用 `/api/sms/send` 获取验证码（`lib/sms.js`）。
3. 提交报名后：
   - `server.js` 校验手机号与身份证号（`lib/validators.js`）。
   - 校验短信验证码（`lib/sms.js`）。
   - 通过后写入 `lib/store.js`。
4. 成功页展示报名编号。

### 进度查询流程
1. 用户在 `/status` 输入手机号 + 身份证号。
2. `server.js` 通过 `lib/store.js` 查询匹配记录。
3. 返回状态与通知记录。

### 后台筛选与通知
1. 管理员登录 `/admin/login`。
2. 在 `/admin/applications` 查看/筛选报名。
3. 进入详情页更新状态并填写通知：
   - 更新报名状态（`lib/store.js`）
   - 记录通知并（可选）发送短信（`lib/sms.js`）
4. 前台 `/status` 同步显示通知记录。

## 状态与通知映射
状态值（`server.js`）：
- `pending`：待筛选
- `written`：笔试通知
- `interview`：面试通知
- `pass`：拟录用
- `reject`：未入选

通知记录字段（`lib/store.js`）：
- `applicationId`：对应报名记录
- `type`：状态类型
- `content`：通知内容
- `sentAt`：发送时间

## 后续扩展建议（对应位置）
- **真实短信服务**：替换 `lib/sms.js` 的 `sendCode` 与 `sendNotificationSms`
- **实名认证对接**：在 `server.js` 报名提交前接入外部实名 API
- **数据持久化**：将 `lib/store.js` 换为数据库驱动（MySQL/SQLite/PostgreSQL）
- **后台权限**：扩展 `server.js` 的登录逻辑与用户管理
- **字段扩展**：在 `views/apply.ejs`、`server.js`、`lib/store.js` 同步新增字段
- **通知模板**：在 `views/admin/application-detail.ejs` 中增加模板选择

## 环境变量与配置
位于 `server.js` 中读取：
- `ADMIN_USER` / `ADMIN_PASS`：管理员账号
- `SESSION_SECRET`：会话密钥
- `SMS_DEBUG`：短信验证码是否显示（开发演示用）

## 数据文件说明
`data/db.json` 是本地演示数据存储：
- `applications[]`：报名数据
- `notifications[]`：通知记录
- `meta`：自增 ID

可根据实际需要切换到数据库。
