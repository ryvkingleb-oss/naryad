# Статус бланков documentmigrant.ru

Аудит на живом сервисе (прогон API: регистрация → документ → тестовая оплата → PDF).

| URL | Мастер | Пустой бланк | PDF после оплаты | Статус | PDF |
|-----|--------|--------------|------------------|--------|-----|
| `/dokument/pribytie` | да (+ ребёнок) | `/api/blanks/pribytie` | да | **ready** | official blank, 4 стр., приказ № 856 в ред. № 628 |
| `/dokument/ubytie` | да | `/api/blanks/ubytie` | да | **ready** | layout |
| `/dokument/patent` | да | `/api/blanks/patent` | да | **ready** | official blank |
| `/dokument/rvp` | да (взрослый) | `/api/blanks/rvp` | да | **ready** | layout |
| `/dokument/vnzh` | да | `/api/blanks/vnzh` | да | **ready** | official blank |
| `/dokument/grazhdanstvo` | да | `/api/blanks/grazhdanstvo` | да | **ready** | official blank |
| `/dokument/vnzh-podtverzhdenie` | да | `/api/blanks/vnzh-podtverzhdenie` | да | **ready** | layout |
| `/dokument/rvp-podtverzhdenie` | да | `/api/blanks/rvp-podtverzhdenie` | да | **ready** | layout |
| `/dokument/rabotodatel-td-zaklyuchenie` | нет | — | — | **stub** | — |
| `/dokument/rabotodatel-td-rastorzhenie` | нет | — | — | **stub** | — |
| `/dokument/patent-prodlenie` | нет | — | — | **stub** | — |
| `/dokument/rvp-rebenok` | нет | — | — | **stub** | — |
| `/dokument/vnzh-rebenok` | нет | — | — | **stub** | — |
| `/dokument/grazhdanstvo-rebenok` | нет | — | — | **stub** | — |

Источник правды в коде: `server/catalog.mjs`.

## Замечания

- **official** — заполняется файл из `server/blanks/*-blank.pdf` клетками.
- **layout** — PDF по макету полей сервиса; перед подачей нужно сверить с актуальной формой на сайте МВД. Отдельного скана бланка МВД в репозитории нет.
- Файл в МВД / на Госуслуги **не отправляется**.
- Оплата — тестовая заглушка 490 ₽, не госпошлина.
- Патент на работу ≠ патент ИП.
- Юрстраницы — заглушки «для юриста».
