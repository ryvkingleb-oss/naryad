import fs from "node:fs";
import path from "node:path";

const sources = JSON.parse(fs.readFileSync(path.resolve("src/data/mvd-sources.json"), "utf8"));
const today = new Date().toISOString().slice(0, 10);
const reportDir = path.resolve("reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `mvd-check-${today}.md`);

const lines = [
  `# Сверка страниц МВД ${today}`,
  "",
  "Скрипт только сравнивает открытые страницы с ожидаемыми названиями. Данные процедур он не меняет.",
  "",
];
let failed = 0;

for (const page of sources.pages) {
  let status = "не подтверждено";
  let detail = "";
  try {
    const response = await fetch(page.url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    const text = await response.text();
    const folded = text.toLowerCase();
    const missing = page.markers.filter((marker) => !folded.includes(marker.toLowerCase()));
    if (!response.ok) {
      status = "не подтверждено";
      detail = `HTTP ${response.status}. Страница не открылась, бланк в сервисе не обновлялся.`;
      failed += 1;
    } else if (missing.length) {
      status = "расхождение";
      detail = `На странице не нашлись маркеры: ${missing.join(", ")}. Бланк в сервисе не обновлялся, смотрите diff.`;
      failed += 1;
    } else if (!folded.includes(String(page.title).toLowerCase().slice(0, 24))) {
      status = "расхождение";
      detail = "Маркеры есть, заголовок страницы не совпал с сохранённым. Бланк в сервисе не обновлялся.";
      failed += 1;
    } else {
      status = "без изменений";
      detail = "Ожидаемые слова на странице есть.";
    }
  } catch (error) {
    status = "не подтверждено";
    detail = `Запрос не удался (${error instanceof Error ? error.message : "ошибка"}). Бланк в сервисе не обновлялся.`;
    failed += 1;
  }
  lines.push(`## ${page.id}`, "", `- Процедура: ${page.procedureId}`, `- Адрес: ${page.url}`, `- Ожидали: ${page.title}`, `- Итог: ${status}`, `- ${detail}`, "");
}

lines.push("Автопубликации нет. Если итог не «без изменений», правьте бланк вручную и оставляйте этот отчёт.");
fs.writeFileSync(reportPath, lines.join("\n"));
console.log(reportPath);
console.log(failed ? `unconfirmed ${failed}` : "ok");
process.exit(failed ? 2 : 0);
