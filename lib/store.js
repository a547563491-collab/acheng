const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      meta: { lastApplicationId: 0, lastNotificationId: 0 },
      applications: [],
      notifications: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function createApplication(data) {
  const db = readDb();
  const id = db.meta.lastApplicationId + 1;
  db.meta.lastApplicationId = id;
  const application = {
    id,
    name: data.name,
    phone: data.phone,
    idNumber: data.idNumber.toUpperCase(),
    region: data.region,
    education: data.education,
    major: data.major,
    experience: data.experience,
    note: data.note,
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
  };
  db.applications.push(application);
  writeDb(db);
  return application;
}

function listApplications({ status, query }) {
  const db = readDb();
  let apps = db.applications.slice();
  if (status) {
    apps = apps.filter((item) => item.status === status);
  }
  if (query) {
    const lower = query.toLowerCase();
    apps = apps.filter((item) => {
      return (
        (item.name && item.name.toLowerCase().includes(lower)) ||
        (item.phone && item.phone.includes(query)) ||
        (item.idNumber && item.idNumber.toLowerCase().includes(lower))
      );
    });
  }
  return apps.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function getApplicationById(id) {
  const db = readDb();
  return db.applications.find((item) => item.id === id) || null;
}

function findApplicationByPhoneAndId(phone, idNumber) {
  const db = readDb();
  const normalized = idNumber.toUpperCase();
  return (
    db.applications.find(
      (item) => item.phone === phone && item.idNumber === normalized
    ) || null
  );
}

function updateApplicationStatus(id, status) {
  const db = readDb();
  const application = db.applications.find((item) => item.id === id);
  if (!application) {
    return null;
  }
  application.status = status;
  application.updatedAt = new Date().toISOString();
  writeDb(db);
  return application;
}

function addNotification(applicationId, type, content) {
  const db = readDb();
  const id = db.meta.lastNotificationId + 1;
  db.meta.lastNotificationId = id;
  const notification = {
    id,
    applicationId,
    type,
    content,
    sentAt: new Date().toISOString(),
  };
  db.notifications.push(notification);
  writeDb(db);
  return notification;
}

function listNotificationsForApplication(applicationId) {
  const db = readDb();
  return db.notifications
    .filter((item) => item.applicationId === applicationId)
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
}

function getStats() {
  const db = readDb();
  const counts = {
    total: db.applications.length,
    pending: 0,
    written: 0,
    interview: 0,
    pass: 0,
    reject: 0,
  };
  db.applications.forEach((item) => {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  });
  return counts;
}

module.exports = {
  createApplication,
  listApplications,
  getApplicationById,
  findApplicationByPhoneAndId,
  updateApplicationStatus,
  addNotification,
  listNotificationsForApplication,
  getStats,
};
