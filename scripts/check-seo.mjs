import assert from "node:assert/strict";
import fs from "node:fs";
import {
  indexablePages,
  injectIndexHtml,
  metaForPath,
  pageByPath,
  redirectTarget,
  robotsTxt,
  sitemapXml,
  SELLER_EMAIL,
  SELLER_INN,
  SELLER_NAME,
  SELLER_PHONE,
  SELLER_PHONE_TEL,
  SITE_NAME,
} from "../server/seo-pages.mjs";

const pages = indexablePages();
const titles = new Set();
const descriptions = new Set();
for (const page of pages) {
  assert.ok(page.title.length > 10, page.path);
  assert.ok(page.description.length > 40, page.path);
  assert.ok(!titles.has(page.title), `duplicate title ${page.title}`);
  assert.ok(!descriptions.has(page.description), `duplicate description ${page.path}`);
  titles.add(page.title);
  descriptions.add(page.description);
  assert.equal(pageByPath(page.path)?.path, page.path);
  const blob = JSON.stringify(page).split(SELLER_INN).join("").split(SELLER_PHONE).join("").split(SELLER_PHONE_TEL).join("");
  assert.ok(!/\d{2}\s?\d{3}/.test(blob), `looks like a search volume on ${page.path}`);
  assert.ok(!/запросов/i.test(blob), `search volume wording on ${page.path}`);
  assert.doesNotMatch(blob, /не действует|не списыва|тестов|заглушк/i, page.path);
}

const required = [
  "/",
  "/uslugi",
  "/blanki",
  "/ceny",
  "/kak-eto-rabotaet",
  "/kontakty",
  "/oferta",
  "/politika",
  "/migracionnyj-uchet",
  "/registraciya-inostrannogo-grazhdanina",
  "/statyi",
  "/statyi/kak-zapolnit-uvedomlenie-o-pribytii",
  "/statyi/sroki-migracionnogo-ucheta",
  "/statyi/dokumenty-na-patent-dlya-inostrannyh-grazhdan",
  "/dokument/pribytie",
  "/dokument/patent",
  "/dokument/vnzh",
  "/dokument/grazhdanstvo",
];
for (const path of required) assert.ok(pageByPath(path), path);

assert.equal(redirectTarget("/uslugi/pribytie"), "/dokument/pribytie");
assert.equal(redirectTarget("/uslugi/patent"), "/dokument/patent");
assert.equal(redirectTarget("/uslugi/vnzh"), "/dokument/vnzh");
assert.equal(redirectTarget("/uslugi/grazhdanstvo"), "/dokument/grazhdanstvo");
assert.equal(redirectTarget("/statyi/"), "/statyi");
assert.equal(redirectTarget("/dokument/pribytie"), null);

const patent = pageByPath("/statyi/dokumenty-na-patent-dlya-inostrannyh-grazhdan");
const patentText = JSON.stringify(patent);
assert.match(patentText, /ИП/);
assert.match(patentText, /налогов/);
assert.match(patentText, /взнос/);

const pribytie = pageByPath("/dokument/pribytie");
const pribytieText = JSON.stringify(pribytie?.supplements);
assert.match(pribytieText, /Бланк уведомления о прибытии/);
assert.match(pribytieText, /Образец/);
assert.match(pribytieText, /Заполнить онлайн/);

const xml = sitemapXml();
for (const path of required) {
  const loc = path === "/" ? "https://documentmigrant.ru/" : `https://documentmigrant.ru${path}`;
  assert.ok(xml.includes(`<loc>${loc}</loc>`), loc);
}
assert.ok(!xml.includes("/zayavlenie"));
assert.ok(!xml.includes("/uslugi/pribytie"));
assert.ok(!xml.includes("/kabinet"));

const robots = robotsTxt();
assert.match(robots, /Sitemap: https:\/\/documentmigrant\.ru\/sitemap\.xml/);
assert.match(robots, /Disallow: \/api/);

const template = `<!doctype html><html><head><title>old</title><meta name="description" content="old" /></head><body><div id="root"></div></body></html>`;
const html = injectIndexHtml(template, "/dokument/pribytie");
assert.match(html, /<title>Уведомление о прибытии: бланк, образец и заполнить онлайн<\/title>/);
assert.match(html, /rel="canonical" href="https:\/\/documentmigrant\.ru\/dokument\/pribytie"/);
assert.match(html, /Бланк уведомления о прибытии/);
assert.equal(metaForPath("/kabinet").robots, "noindex, nofollow");
assert.equal(metaForPath("/").title, "МиграФорма — бланки МВД онлайн: уведомление о прибытии, патент, РВП, ВНЖ");
assert.equal(metaForPath("/kabinet").title, `${SITE_NAME} — кабинет`);
assert.equal(metaForPath("/missing").title, `${SITE_NAME} — страница не найдена`);
assert.match(html, /property="og:site_name" content="МиграФорма"/);

const seen = new Set(pages.map((page) => page.path));
assert.equal(seen.size, pages.length);

const legalExpect = {
  "/oferta": ["<h1>Договор на заполненный PDF-бланк за 490 ₽</h1>", SELLER_NAME, SELLER_INN, "кабинет", "Публичная оферта"],
  "/kontakty": ["<h1>Контакты</h1>", SELLER_NAME, SELLER_INN, "Самозанятый"],
  "/ceny": ["<h1>490 ₽ за один заполненный бланк</h1>", "фиксирован", "кабинет"],
  "/kak-eto-rabotaet": ["<h1>От пустого бланка к файлу в кабинете</h1>", "490", "электронн"],
  "/politika": ["<h1>Политика в отношении данных кабинета</h1>", SELLER_NAME, SELLER_INN, "Оператор"],
};
for (const [path, parts] of Object.entries(legalExpect)) {
  const html = injectIndexHtml(template, path);
  for (const part of parts) assert.match(html, new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${path} missing ${part}`);
  if (path === "/oferta" || path === "/kontakty" || path === "/politika") {
    assert.match(html, new RegExp(`mailto:${SELLER_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), path);
    assert.match(html, new RegExp(`tel:${SELLER_PHONE_TEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), path);
    assert.match(html, new RegExp(SELLER_PHONE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), path);
  }
  assert.doesNotMatch(html, /не действует|не списыва|тестов|заглушк/i, path);
  assert.doesNotMatch(html, /<h1>Уведомление о прибытии и бланки МВД/, path);
}

const appSource = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
for (const path of ["/ceny", "/kak-eto-rabotaet", "/kontakty", "/oferta", "/politika"]) {
  assert.match(appSource, new RegExp(`path="${path}"`));
}
assert.equal(SELLER_EMAIL, "support@documentmigrant.ru");
assert.equal(SELLER_PHONE, "+7 999 529-44-65");
assert.equal(SELLER_PHONE_TEL, "+79995294465");
assert.match(appSource, /SELLER_PHONE_TEL/);
assert.match(appSource, /SELLER_EMAIL/);
assert.doesNotMatch(appSource, /info@documentmigrant/);
assert.doesNotMatch(fs.readFileSync(new URL("../server/seo-pages.mjs", import.meta.url), "utf8"), /info@documentmigrant/);
for (const file of ["src/App.tsx", "src/pages/Home.tsx", "src/pages/PayPage.tsx", "src/pages/Cabinet.tsx", "index.html"]) {
  const text = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.doesNotMatch(text, /не действует|не списыва|тестов|заглушк/i, file);
}

console.log(`seo ok: ${pages.length} indexable pages`);
