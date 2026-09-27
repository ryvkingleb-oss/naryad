import assert from "node:assert/strict";
import {
  indexablePages,
  injectIndexHtml,
  metaForPath,
  pageByPath,
  redirectTarget,
  robotsTxt,
  sitemapXml,
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
  const blob = JSON.stringify(page);
  assert.ok(!/\d{2}\s?\d{3}/.test(blob), `looks like a search volume on ${page.path}`);
  assert.ok(!/запросов/i.test(blob), `search volume wording on ${page.path}`);
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
console.log(`seo ok: ${pages.length} indexable pages`);
