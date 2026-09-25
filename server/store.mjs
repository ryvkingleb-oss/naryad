import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("data");
const file = path.join(root, "app-store.json");

function empty() {
  return { users: [], sessions: [], documents: [] };
}

function read() {
  fs.mkdirSync(root, { recursive: true });
  if (!fs.existsSync(file)) return empty();
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return empty();
  }
}

function write(db) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

export function createUser({ email, name, password }) {
  const db = read();
  const normalized = email.trim().toLowerCase();
  if (db.users.some((user) => user.email === normalized)) {
    const error = new Error("Такой адрес уже зарегистрирован");
    error.status = 409;
    throw error;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, salt, 32).toString("hex");
  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    name: name.trim(),
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  write(db);
  return publicUser(user);
}

export function verifyUser(email, password) {
  const db = read();
  const user = db.users.find((item) => item.email === email.trim().toLowerCase());
  if (!user) return null;
  const hash = crypto.scryptSync(password, user.salt, 32).toString("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"))) return null;
  return publicUser(user);
}

export function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

export function openSession(userId) {
  const db = read();
  const token = crypto.randomBytes(24).toString("hex");
  db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  write(db);
  return token;
}

export function userByToken(token) {
  if (!token) return null;
  const db = read();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export function closeSession(token) {
  const db = read();
  db.sessions = db.sessions.filter((item) => item.token !== token);
  write(db);
}

export function listDocuments(userId) {
  return read()
    .documents.filter((item) => item.userId === userId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map(publicDocument);
}

export function getDocument(userId, id) {
  const doc = read().documents.find((item) => item.id === id && item.userId === userId);
  return doc ? publicDocument(doc) : null;
}

export function createDocument(userId, procedureId) {
  const db = read();
  const now = new Date().toISOString();
  const doc = {
    id: crypto.randomUUID(),
    userId,
    procedureId,
    values: {},
    step: 0,
    paid: false,
    paidAt: null,
    emails: [],
    createdAt: now,
    updatedAt: now,
  };
  db.documents.push(doc);
  write(db);
  return publicDocument(doc);
}

export function updateDocument(userId, id, patch) {
  const db = read();
  const doc = db.documents.find((item) => item.id === id && item.userId === userId);
  if (!doc) return null;
  if (patch.values) doc.values = patch.values;
  if (Number.isFinite(patch.step)) doc.step = patch.step;
  doc.updatedAt = new Date().toISOString();
  write(db);
  return publicDocument(doc);
}

export function markPaid(userId, id) {
  const db = read();
  const doc = db.documents.find((item) => item.id === id && item.userId === userId);
  if (!doc) return null;
  doc.paid = true;
  doc.paidAt = new Date().toISOString();
  doc.updatedAt = doc.paidAt;
  write(db);
  return publicDocument(doc);
}

export function addEmail(userId, id, message) {
  const db = read();
  const doc = db.documents.find((item) => item.id === id && item.userId === userId);
  if (!doc) return null;
  doc.emails.push(message);
  doc.updatedAt = new Date().toISOString();
  write(db);
  return publicDocument(doc);
}

function publicDocument(doc) {
  const { userId, ...rest } = doc;
  return rest;
}
