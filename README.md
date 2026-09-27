# МиграФорма

Онлайн-заполнение бланков МВД для [documentmigrant.ru](https://documentmigrant.ru): уведомление о прибытии, заявление на патент на работу, вид на жительство, гражданство. В подразделение файл несёте сами.

Список и заполнение бесплатны. Готовый файл открывается после тестовой оплаты 490 ₽. Деньги не списываются. Это не госпошлина. Живая касса не подключена: `PAYMENT_MODE` по умолчанию `stub` (допустимо ещё `test`). Любое другое значение живое списание не включает.

Ветка `main` этого репозитория — другой продукт: сайт заявок на ремонт (masterprorab.ru, docker Compose). Его не пересобирать и не перезапускать вместе с этим сервисом.

## Запуск

```bash
npm install
npm run dev
```

Сайт: http://127.0.0.1:5173 . API: http://127.0.0.1:8787 .

Проверка карты страниц без сборки:

```bash
npm run check:seo
```

Продакшен локально:

```bash
npm run build
HOST=127.0.0.1 PORT=8787 npm start
```

Сервер отдаёт `dist` и API. Кабинет лежит в `data/app-store.json` (в git не входит).

## Постановка на /opt/documentmigrant

Юнит systemd называется `documentmigrant` и слушает `172.18.0.1:8787`. Caddy уже проксирует на него `documentmigrant.ru`. Docker сайта ремонта (`naryad` / masterprorab) не трогать: не запускать `docker compose` и не перезапускать контейнеры ремонта.

На машине, где собрали фронт:

```bash
npm ci
npm run build
```

На VPS в каталог `/opt/documentmigrant` копируют `dist/`, `server/` (там же `seo-pages.mjs` и бланки PDF), `package.json` и `package-lock.json`. Каталог `data/` с кабинетом не затирать. Затем:

```bash
cd /opt/documentmigrant
npm ci --omit=dev
systemctl restart documentmigrant
```

Команды `systemctl restart naryad` и пересборка docker masterprorab к этому сайту не относятся.

Публичные адреса форм остаются `/dokument/pribytie`, `/dokument/patent`, `/dokument/vnzh`, `/dokument/grazhdanstvo`. Короткие `/uslugi/pribytie` и соседние имена отдают 301 на эти адреса. Карта: `sitemap.xml`, правила робота: `robots.txt`.

## Сверка с МВД

Раз в две недели, 1-го и 15-го числа:

```bash
npm run check:mvd
```

Скрипт заново открывает страницы из `src/data/mvd-sources.json`, пишет `reports/mvd-check-ДАТА.md` и не меняет бланки. Если страница не открылась или текст разъехался, команда завершается с кодом 2. Первый отчёт: `reports/mvd-check-2026-09-25.md`.

## Домен

Снаружи приложение отдаёт уже работающий Caddy. Голый адрес и `masterprorab.ru` остаются сайтом заявок на ремонт.

Публичный адрес: https://documentmigrant.ru/ . Имя `www.documentmigrant.ru` открывает то же приложение. HTTP на этих именах переходит на HTTPS, сертификат выпускает Caddy. Временный адрес: http://109.172.37.155:8080/ .

На странице каждого документа кнопка «Скачать бланк» отдаёт пустой бланк МВД, без ответов. Заполненный файл скачивается после тестовой оплаты.

Фрагмент блока Caddy: `deploy/documentmigrant.caddy`.
