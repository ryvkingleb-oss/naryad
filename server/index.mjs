import express from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import {
  addEmail,
  closeSession,
  createDocument,
  createUser,
  getDocument,
  listDocuments,
  markPaid,
  openSession,
  updateDocument,
  userByToken,
  verifyUser,
} from "./store.mjs";
import { paymentProvider } from "./payment.mjs";
import { mailer } from "./mailer.mjs";
import { layoutFor, renderFormPdf } from "./form-pdf.mjs";

const app = express();
const port = Number(process.env.PORT || 8787);
const procedures = new Set(["pribytie", "patent", "vnzh", "grazhdanstvo"]);
const titles = {
  pribytie: "Уведомление о прибытии",
  patent: "Заявление на патент",
  vnzh: "Заявление на вид на жительство",
  grazhdanstvo: "Заявление на гражданство",
};

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function sessionUser(req) {
  return userByToken(req.cookies.naryad);
}

function requireUser(req, res) {
  const user = sessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Войдите в кабинет" });
    return null;
  }
  return user;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  res.json({ user: sessionUser(req) });
});

app.post("/api/register", (req, res) => {
  const { email, name, password } = req.body ?? {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Укажите почту" });
  if (!name || name.trim().length < 2) return res.status(400).json({ error: "Укажите, как к вам обращаться" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Пароль — не короче 8 знаков" });
  try {
    const user = createUser({ email, name, password });
    const token = openSession(user.id);
    res.cookie("naryad", token, { httpOnly: true, sameSite: "lax", path: "/" });
    res.json({ user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Не удалось зарегистрироваться" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = verifyUser(email || "", password || "");
  if (!user) return res.status(401).json({ error: "Почта или пароль не подходят" });
  const token = openSession(user.id);
  res.cookie("naryad", token, { httpOnly: true, sameSite: "lax", path: "/" });
  res.json({ user });
});

app.post("/api/logout", (req, res) => {
  closeSession(req.cookies.naryad);
  res.clearCookie("naryad", { path: "/" });
  res.json({ ok: true });
});

app.get("/api/documents", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  res.json({ documents: listDocuments(user.id).map(withTitle) });
});

app.post("/api/documents", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const procedureId = req.body?.procedureId;
  if (!procedures.has(procedureId)) return res.status(400).json({ error: "Такой процедуры нет" });
  res.json({ document: withTitle(createDocument(user.id, procedureId)) });
});

app.get("/api/documents/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const document = getDocument(user.id, req.params.id);
  if (!document) return res.status(404).json({ error: "Документ не найден" });
  res.json({ document: withTitle(document) });
});

app.put("/api/documents/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const document = updateDocument(user.id, req.params.id, {
    values: req.body?.values,
    step: req.body?.step,
  });
  if (!document) return res.status(404).json({ error: "Документ не найден" });
  res.json({ document: withTitle(document) });
});

app.get("/api/documents/:id/quote", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const document = getDocument(user.id, req.params.id);
  if (!document) return res.status(404).json({ error: "Документ не найден" });
  res.json({ ...(await paymentProvider.quote()), paid: document.paid });
});

app.post("/api/documents/:id/checkout", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (req.body?.confirm !== true) return res.status(400).json({ error: "Подтвердите тестовую оплату" });
  const existing = getDocument(user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Документ не найден" });
  const result = await paymentProvider.confirm();
  const document = markPaid(user.id, req.params.id);
  res.json({ document: withTitle(document), payment: result });
});

app.get("/api/documents/:id/file.pdf", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const document = getDocument(user.id, req.params.id);
  if (!document) return res.status(404).json({ error: "Документ не найден" });
  if (!document.paid) return res.status(402).json({ error: "Файл откроется после оплаты" });
  try {
    const { bytes, fileName } = await renderFormPdf(document.procedureId, document.values, {
      shortTitle: titles[document.procedureId],
      blankPageUrl: "",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${req.query.disposition === "inline" ? "inline" : "attachment"}; filename="${fileName}"`);
    res.send(Buffer.from(bytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Не удалось собрать файл" });
  }
});

app.post("/api/documents/:id/email", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const document = getDocument(user.id, req.params.id);
  if (!document) return res.status(404).json({ error: "Документ не найден" });
  if (!document.paid) return res.status(402).json({ error: "Письмо с файлом — после оплаты" });
  const to = String(req.body?.to || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) return res.status(400).json({ error: "Укажите почту получателя" });
  const layout = layoutFor(document.procedureId);
  const message = await mailer.send({
    to,
    subject: titles[document.procedureId],
    fileName: layout.fileName,
  });
  const saved = addEmail(user.id, req.params.id, message);
  res.json({ document: withTitle(saved), email: message });
});

function withTitle(document) {
  return { ...document, title: titles[document.procedureId] || "Документ" };
}

const dist = path.resolve("dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`api http://${host}:${port}`);
});
