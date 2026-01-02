const path = require("path");
const express = require("express");
const session = require("express-session");
const {
  createApplication,
  listApplications,
  getApplicationById,
  findApplicationByPhoneAndId,
  updateApplicationStatus,
  listNotificationsForApplication,
  addNotification,
  getStats,
} = require("./lib/store");
const { isValidPhone, isValidIdCard } = require("./lib/validators");
const { sendCode, verifyCode, sendNotificationSms } = require("./lib/sms");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const STATUS_LABELS = {
  pending: "待筛选",
  written: "笔试通知",
  interview: "面试通知",
  pass: "拟录用",
  reject: "未入选",
};

const STATUS_DESCRIPTIONS = {
  pending: "已提交，等待后台筛选。",
  written: "已发布笔试通知，请按时参加。",
  interview: "已发布面试通知，请携带材料参加。",
  pass: "拟录用阶段，等待进一步安排。",
  reject: "暂未入选，感谢关注。",
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 6 },
  })
);

app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session && req.session.admin);
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.currentPath = req.path;
  next();
});

function shouldShowSmsCode() {
  return process.env.SMS_DEBUG === "true" || process.env.NODE_ENV !== "production";
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.redirect("/admin/login");
}

app.get("/", (req, res) => {
  const stats = getStats();
  res.render("index", {
    title: "辅警招聘报名平台",
    stats,
    statusLabels: STATUS_LABELS,
  });
});

app.get("/apply", (req, res) => {
  res.render("apply", {
    title: "个人报名",
    errors: [],
    form: {},
    smsDebug: shouldShowSmsCode(),
  });
});

app.post("/apply", (req, res) => {
  const form = {
    name: (req.body.name || "").trim(),
    phone: (req.body.phone || "").trim(),
    smsCode: (req.body.smsCode || "").trim(),
    idNumber: (req.body.idNumber || "").trim(),
    region: (req.body.region || "").trim(),
    education: (req.body.education || "").trim(),
    major: (req.body.major || "").trim(),
    experience: (req.body.experience || "").trim(),
    note: (req.body.note || "").trim(),
  };

  const errors = [];
  if (!form.name) {
    errors.push("请填写姓名。");
  }
  if (!isValidPhone(form.phone)) {
    errors.push("请填写有效的手机号。");
  }
  if (!form.smsCode) {
    errors.push("请填写短信验证码。");
  } else if (!verifyCode(form.phone, form.smsCode)) {
    errors.push("短信验证码无效或已过期。");
  }
  if (!isValidIdCard(form.idNumber)) {
    errors.push("请填写有效的身份证号码。");
  }

  if (errors.length > 0) {
    return res.render("apply", {
      title: "个人报名",
      errors,
      form,
      smsDebug: shouldShowSmsCode(),
    });
  }

  const application = createApplication({
    name: form.name,
    phone: form.phone,
    idNumber: form.idNumber,
    region: form.region,
    education: form.education,
    major: form.major,
    experience: form.experience,
    note: form.note,
    status: "pending",
  });

  return res.render("apply-success", {
    title: "报名已提交",
    application,
  });
});

app.get("/status", (req, res) => {
  res.render("status", {
    title: "报名进度查询",
    errors: [],
    result: null,
    statusLabels: STATUS_LABELS,
    statusDescriptions: STATUS_DESCRIPTIONS,
  });
});

app.post("/status", (req, res) => {
  const phone = (req.body.phone || "").trim();
  const idNumber = (req.body.idNumber || "").trim();
  const errors = [];

  if (!isValidPhone(phone)) {
    errors.push("请填写有效的手机号。");
  }
  if (!isValidIdCard(idNumber)) {
    errors.push("请填写有效的身份证号码。");
  }

  if (errors.length > 0) {
    return res.render("status", {
      title: "报名进度查询",
      errors,
      result: null,
      statusLabels: STATUS_LABELS,
      statusDescriptions: STATUS_DESCRIPTIONS,
    });
  }

  const application = findApplicationByPhoneAndId(phone, idNumber);
  if (!application) {
    return res.render("status", {
      title: "报名进度查询",
      errors: ["未找到匹配的报名记录，请核对信息。"],
      result: null,
      statusLabels: STATUS_LABELS,
      statusDescriptions: STATUS_DESCRIPTIONS,
    });
  }

  const notifications = listNotificationsForApplication(application.id);
  return res.render("status", {
    title: "报名进度查询",
    errors: [],
    result: {
      application,
      notifications,
    },
    statusLabels: STATUS_LABELS,
    statusDescriptions: STATUS_DESCRIPTIONS,
  });
});

app.post("/api/sms/send", (req, res) => {
  const phone = (req.body.phone || "").trim();
  if (!isValidPhone(phone)) {
    return res.status(400).json({ ok: false, message: "手机号格式不正确。" });
  }

  const code = sendCode(phone);
  const response = { ok: true, expiresIn: 300 };
  if (shouldShowSmsCode()) {
    response.debugCode = code;
  }
  return res.json(response);
});

app.get("/admin/login", (req, res) => {
  res.render("admin/login", { title: "后台登录", error: null });
});

app.post("/admin/login", (req, res) => {
  const username = (req.body.username || "").trim();
  const password = (req.body.password || "").trim();
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = { username };
    return res.redirect("/admin/applications");
  }
  return res.render("admin/login", {
    title: "后台登录",
    error: "账号或密码错误。",
  });
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  res.redirect("/admin/applications");
});

app.get("/admin/applications", requireAdmin, (req, res) => {
  const status = (req.query.status || "all").trim();
  const query = (req.query.q || "").trim();
  const apps = listApplications({
    status: status === "all" ? null : status,
    query,
  });
  const stats = getStats();

  res.render("admin/applications", {
    title: "报名管理",
    apps,
    status,
    query,
    stats,
    statusLabels: STATUS_LABELS,
  });
});

app.get("/admin/applications/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const application = getApplicationById(id);
  if (!application) {
    return res.status(404).send("未找到该报名记录。");
  }
  const notifications = listNotificationsForApplication(id);
  return res.render("admin/application-detail", {
    title: `报名详情 #${id}`,
    application,
    notifications,
    statusLabels: STATUS_LABELS,
  });
});

app.post("/admin/applications/:id/status", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = (req.body.status || "").trim();
  const message = (req.body.message || "").trim();
  const sendSms = req.body.sendSms === "on";

  if (!STATUS_LABELS[status]) {
    req.session.flash = { type: "error", message: "状态值不合法。" };
    return res.redirect(`/admin/applications/${id}`);
  }

  const application = updateApplicationStatus(id, status);
  if (!application) {
    req.session.flash = { type: "error", message: "报名记录不存在。" };
    return res.redirect("/admin/applications");
  }

  if (message) {
    addNotification(id, status, message);
    if (sendSms) {
      sendNotificationSms(application.phone, message);
    }
  }

  req.session.flash = { type: "success", message: "状态已更新并记录通知。" };
  return res.redirect(`/admin/applications/${id}`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
