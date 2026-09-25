import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderOfficialVnzh } from "./vnzh-official.mjs";
import { renderOfficialArrival, renderOfficialCitizenship, renderOfficialPatent } from "./official-fill.mjs";

const INK = rgb(0.1, 0.09, 0.08);
const MUTED = rgb(0.33, 0.3, 0.26);
const LINE = rgb(0.25, 0.22, 0.18);
const PAPER = rgb(1, 1, 1);
const HEAD = rgb(0.93, 0.91, 0.86);

const GROUNDS = {
  "rvp-year": "не менее года по РВП (п. 1 ст. 8)",
  rsfsr: "рождение в РСФСР, гражданство СССР (пп. 1 п. 2 ст. 8)",
  relative: "родитель, сын или дочь — граждане России (пп. 4 п. 2 ст. 8)",
  native: "носитель русского языка (пп. 7 п. 2 ст. 8)",
  crimea: "депортация из Крымской АССР (пп. 8 п. 2 ст. 8)",
  hqs: "высококвалифицированный специалист или член семьи (пп. 9 п. 2 ст. 8)",
  work: "работа для упрощённого гражданства (пп. 10 п. 2 ст. 8)",
  honors: "диплом с отличием (пп. 11 п. 2 ст. 8)",
  stopped: "прекращено гражданство России (пп. 12 п. 2 ст. 8)",
  cancelled: "отменено решение о гражданстве (пп. 13 п. 2 ст. 8)",
  art411: "ч. 1 или 3 ст. 41.1 закона о гражданстве (пп. 14 п. 2 ст. 8)",
  belarus: "гражданин Республики Беларусь",
  contest: "конкурс «Россия — страна возможностей» (пп. 15 п. 2 ст. 8)",
  it: "ИТ-специалист или член семьи (пп. 16 п. 2 ст. 8)",
  invest: "иностранный инвестор (пп. 17 п. 2 ст. 8)",
  kmu: "гражданин Казахстана, Молдовы или Украины (пп. 18 п. 2 ст. 8)",
  resettle: "переселенец по международному договору (пп. 19 п. 2 ст. 8)",
  other: "иное основание",
};
const MARITAL = { married: "женат (замужем)", single: "холост (незамужняя)", widowed: "вдовец (вдова)", divorced: "разведён(а)" };
const EDU_GENERAL = { none: "не отмечено", pre: "дошкольное", primary: "начальное общее", basic: "основное общее", secondary: "среднее общее" };
const EDU_PROF = { none: "не отмечено", vocational: "среднее профессиональное", bachelor: "бакалавриат", specialist: "специалитет, магистратура", postgrad: "высшая квалификация" };
const DEGREE = { none: "нет", candidate: "кандидат наук", doctor: "доктор наук" };
const BASIS = {
  a15: "часть 1 статьи 15",
  a16p1: "пункт 1 части 1 статьи 16",
  a16p2: "пункт 2 части 1 статьи 16",
  a16c2: "часть 2 статьи 16",
  a16c3: "часть 3 статьи 16",
  a16c4: "часть 4 статьи 16",
  a16c7: "часть 7 статьи 16",
  a16c8: "часть 8 статьи 16",
  a17: "статья 17",
  a44: "часть 1 статьи 44",
};
const CHILD_KIND = { child: "мой ребёнок", adopted: "усыновлённый ребёнок", ward: "ребёнок под опекой", incapable: "недееспособное лицо под опекой" };

const layouts = {
  pribytie: {
    fileName: "uvedomlenie-o-pribytii.pdf",
    kicker: "Приложение № 4 к приказу МВД России от 10.12.2020 № 856",
    title: "УВЕДОМЛЕНИЕ О ПРИБЫТИИ\nИНОСТРАННОГО ГРАЖДАНИНА ИЛИ ЛИЦА БЕЗ ГРАЖДАНСТВА\nВ МЕСТО ПРЕБЫВАНИЯ",
    sections: [
      {
        title: "1. Сведения о лице, подлежащем постановке на учёт",
        rows: [
          [
            { id: "lastName", label: "Фамилия" },
            { id: "lastNameLat", label: "Фамилия (латинскими буквами)" },
          ],
          [
            { id: "firstName", label: "Имя" },
            { id: "firstNameLat", label: "Имя (латинскими буквами)" },
          ],
          [
            { id: "middleName", label: "Отчество (при наличии)" },
            { id: "middleNameLat", label: "Отчество (латинскими буквами)" },
          ],
          [
            { id: "citizenship", label: "Гражданство" },
            { id: "birthDate", label: "Дата рождения", date: true },
            { id: "sex", label: "Пол", map: { m: "мужской", f: "женский" } },
          ],
          [{ id: "birthPlace", label: "Место рождения", h: 36 }],
          [
            { id: "docType", label: "Вид документа" },
            { id: "docSeries", label: "Серия" },
            { id: "docNumber", label: "Номер" },
          ],
          [
            { id: "docIssued", label: "Кем и когда выдан", h: 36 },
            { id: "docUntil", label: "Срок действия" },
          ],
          [{ id: "extraDoc", label: "Документ, подтверждающий право на пребывание (проживание)", h: 36 }],
          [
            { id: "purpose", label: "Цель въезда" },
            { id: "profession", label: "Профессия" },
          ],
          [
            { id: "entryDate", label: "Дата въезда", date: true },
            { id: "migrationCard", label: "Серия и номер миграционной карты" },
          ],
          [
            { id: "stayFrom", label: "Заявленный срок с", date: true },
            { id: "stayUntil", label: "Заявленный срок по", date: true },
          ],
          [{ id: "address", label: "Адрес места пребывания", h: 40 }],
          [{ id: "previousAddress", label: "Адрес прежнего места пребывания в Российской Федерации", h: 36 }],
          [{ id: "cadastral", label: "Кадастровый номер" }],
        ],
      },
      {
        title: "2. Сведения о принимающей стороне",
        rows: [
          [{ id: "hostKind", label: "Принимающая сторона", map: { person: "физическое лицо", org: "организация" } }],
          [{ id: "hostName", label: "Фамилия, имя, отчество или наименование организации" }],
          [{ id: "hostDoc", label: "Документ, удостоверяющий личность, или реквизиты организации", h: 40 }],
          [{ id: "hostAddress", label: "Адрес места жительства или адрес организации", h: 36 }],
          [{ id: "hostPhone", label: "Телефон принимающей стороны" }],
          [{ id: "foreignPhone", label: "Телефон иностранного гражданина" }],
        ],
      },
    ],
    tearOff: true,
  },
  patent: {
    fileName: "zayavlenie-o-patente.pdf",
    kicker: "Бланк заявления об оформлении патента, страница МВД",
    title: "ЗАЯВЛЕНИЕ\nОБ ОФОРМЛЕНИИ ПАТЕНТА",
    photo: "Место для фотографии 30×40 мм",
    sections: [
      {
        title: "Сведения о заявителе",
        rows: [
          [{ id: "office", label: "Территориальный орган МВД России" }],
          [
            { id: "lastName", label: "Фамилия" },
            { id: "firstName", label: "Имя" },
            { id: "middleName", label: "Отчество" },
          ],
          [{ id: "previous", label: "Сведения об изменении ФИО", h: 32 }],
          [{ id: "citizenship", label: "Гражданство (подданство) или государство проживания" }],
          [
            { id: "birthPlace", label: "Место рождения" },
            { id: "birthDate", label: "Дата рождения", date: true },
            { id: "sex", label: "Пол", map: { m: "М", f: "Ж" } },
          ],
          [{ id: "homeAddress", label: "Адрес постоянного проживания", h: 36 }],
          [
            { id: "docType", label: "Документ, вид" },
            { id: "docSeries", label: "Серия" },
            { id: "docNumber", label: "Номер" },
          ],
          [
            { id: "docIssued", label: "Дата выдачи", date: true },
            { id: "docWho", label: "Кем выдан" },
          ],
          [
            { id: "migrationCard", label: "Серия и номер миграционной карты" },
            { id: "migrationIssued", label: "Дата выдачи карты", date: true },
          ],
          [{ id: "purposeWork", label: "Цель визита изменена на «работа»", map: { yes: "да", no: "нет" } }],
          [{ id: "stayAddress", label: "Адрес постановки на учёт по месту пребывания", h: 36 }],
          [
            { id: "stayFrom", label: "Учёт с", date: true },
            { id: "stayUntil", label: "Учёт по", date: true },
            { id: "inn", label: "ИНН" },
          ],
          [{ id: "langType", label: "Документ о русском языке, истории и законодательстве", h: 32 }],
          [
            { id: "langSeries", label: "Серия" },
            { id: "langNumber", label: "Номер" },
            { id: "langIssued", label: "Дата выдачи", date: true },
          ],
          [{ id: "employer", label: "Трудовая деятельность планируется у", map: { org: "юридическое лицо или ИП", person: "физическое лицо — гражданин России" } }],
          [{ id: "profession", label: "Профессия (специальность, должность, вид деятельности)", h: 32 }],
          [{ id: "workUntil", label: "Предполагаемый срок работы до", date: true }],
          [{ id: "oldOffice", label: "Прежний патент выдан" }],
          [
            { id: "oldSeries", label: "Серия патента" },
            { id: "oldNumber", label: "Номер патента" },
          ],
          [
            { id: "oldBlankSeries", label: "Серия бланка" },
            { id: "oldBlankNumber", label: "Номер бланка" },
          ],
          [
            { id: "oldFrom", label: "Срок с", date: true },
            { id: "oldUntil", label: "Срок по", date: true },
          ],
          [
            { id: "phone", label: "Контактный телефон" },
            { id: "filedBy", label: "Заявление подаётся", map: { self: "лично", org: "через уполномоченную организацию" } },
          ],
        ],
      },
    ],
  },
  vnzh: {
    fileName: "zayavlenie-o-vnzh.pdf",
    kicker: "Заявление о выдаче вида на жительство, бланк со страницы МВД",
    title: "ЗАЯВЛЕНИЕ\nО ВЫДАЧЕ ВИДА НА ЖИТЕЛЬСТВО",
    photo: "Место для фотографии",
    sections: [
      {
        title: "Основание",
        rows: [
          [{ id: "office", label: "Подразделение" }],
          [{ id: "ground", label: "Основание подачи заявления", map: GROUNDS }],
          [{ id: "groundOther", label: "Иное основание" }],
        ],
      },
      {
        title: "1. Фамилия, имя, отчество",
        rows: [
          [
            { id: "lastName", label: "Фамилия (рус.)" },
            { id: "lastNameLat", label: "Фамилия (лат.)" },
          ],
          [
            { id: "firstName", label: "Имя (рус.)" },
            { id: "firstNameLat", label: "Имя (лат.)" },
          ],
          [
            { id: "middleName", label: "Отчество (рус.)" },
            { id: "middleNameLat", label: "Отчество (лат.)" },
          ],
          [{ id: "hadPrevious", label: "Имели другие фамилию, имя, отчество", map: { yes: "да", no: "нет" } }],
          [
            { id: "prevLast", label: "Прежняя фамилия" },
            { id: "prevFirst", label: "Прежнее имя" },
            { id: "prevMiddle", label: "Прежнее отчество" },
          ],
          [
            { id: "prevReason", label: "Причина" },
            { id: "prevDate", label: "Дата изменения" },
          ],
        ],
      },
      {
        title: "2–5. Рождение, гражданство, документ",
        rows: [
          [
            { id: "birthDate", label: "Дата рождения", date: true },
            { id: "birthCountry", label: "Страна рождения" },
          ],
          [{ id: "birthPlace", label: "Место рождения" }],
          [{ id: "citizenship", label: "3. Государство гражданства", h: 28 }],
          [
            { id: "citBasis", label: "Основание приобретения" },
            { id: "citDate", label: "Дата" },
            { id: "citPlace", label: "Место" },
          ],
          [{ id: "stateless", label: "Лицо без гражданства", map: { yes: "да", no: "нет" } }],
          [
            { id: "lossBasis", label: "Основание утраты" },
            { id: "lossPlace", label: "Место утраты" },
            { id: "lossDate", label: "Дата утраты" },
          ],
          [{ id: "sex", label: "4. Пол", map: { m: "мужской", f: "женский" } }],
          [
            { id: "docSeries", label: "5. Серия" },
            { id: "docNumber", label: "Номер" },
            { id: "docIssued", label: "Дата выдачи", date: true },
          ],
          [{ id: "docWho", label: "Орган, выдавший документ" }],
        ],
      },
      {
        title: "6–8. Семья, родственники, работа",
        rows: [
          [{ id: "marital", label: "6. Семейное положение", map: MARITAL }],
          [
            { id: "marryDoc", label: "Номер свидетельства" },
            { id: "marryDate", label: "Дата" },
            { id: "marryPlace", label: "Место выдачи" },
          ],
          {
            title: "7. Близкие родственники (приложение № 2)",
            repeat: "relatives",
            columns: [
              ["relation", "Родство"],
              ["fio", "ФИО"],
              ["birth", "Рождение"],
              ["citizenship", "Гражданство"],
              ["address", "Адрес"],
              ["work", "Работа"],
            ],
          },
          {
            title: "8. Трудовая деятельность за три года (приложение № 3)",
            repeat: "jobs",
            columns: [
              ["from", "Приём"],
              ["to", "Увольнение"],
              ["role", "Должность"],
              ["address", "Адрес"],
            ],
          },
        ],
      },
      {
        title: "9–13. Образование, доход, адрес",
        rows: [
          [
            { id: "eduGeneral", label: "Общее образование", map: EDU_GENERAL },
            { id: "eduProf", label: "Профессиональное", map: EDU_PROF },
            { id: "degree", label: "Степень", map: DEGREE },
          ],
          [
            { id: "hqsSeries", label: "10. Серия разрешения ВКС" },
            { id: "hqsNumber", label: "Номер" },
            { id: "hqsIssued", label: "Выдано" },
            { id: "hqsUntil", label: "До" },
          ],
          [
            { id: "inc1", label: "11.1 Работа" },
            { id: "inc2", label: "11.2 Иная деятельность" },
          ],
          [
            { id: "inc3", label: "11.3 Вклады" },
            { id: "inc4", label: "11.4 Ценные бумаги" },
          ],
          [
            { id: "inc5", label: "11.5 Пенсии и выплаты" },
            { id: "inc5note", label: "Какие" },
          ],
          [
            { id: "inc6", label: "11.6 Иные доходы" },
            { id: "inc6note", label: "Какие" },
          ],
          [{ id: "conviction", label: "12. Непогашенная судимость за пределами России", map: { yes: "да", no: "нет" } }],
          [
            { id: "convWhere", label: "Где" },
            { id: "convWhen", label: "Когда" },
            { id: "convTerm", label: "Срок" },
            { id: "convServed", label: "Отбытие" },
          ],
          [
            { id: "postIndex", label: "13. Индекс" },
            { id: "addrRegion", label: "Субъект" },
            { id: "addrDistrict", label: "Район" },
          ],
          [
            { id: "addrPlace", label: "Населённый пункт" },
            { id: "addrStreet", label: "Улица" },
          ],
          [
            { id: "addrHouse", label: "Дом" },
            { id: "addrBlock", label: "Корпус" },
            { id: "addrBuild", label: "Строение" },
            { id: "addrFlat", label: "Квартира" },
          ],
          [
            { id: "phone", label: "Телефон" },
            { id: "email", label: "Электронная почта" },
          ],
          [{ id: "attachments", label: "Вместе с заявлением представляю документы", h: 36 }],
        ],
      },
    ],
  },
  grazhdanstvo: {
    fileName: "zayavlenie-o-prieme-v-grazhdanstvo.pdf",
    kicker: "Приложение № 1 к Положению о порядке рассмотрения вопросов гражданства Российской Федерации",
    title: "ЗАЯВЛЕНИЕ\nО ПРИЁМЕ В ГРАЖДАНСТВО РОССИЙСКОЙ ФЕДЕРАЦИИ",
    photo: "Место для фотографии 3×4 см",
    sections: [
      {
        title: "Шапка",
        rows: [
          [{ id: "authority", label: "Наименование органа" }],
          [{ id: "basis", label: "Прошу принять на основании", map: BASIS }],
          [{ id: "basisDetail", label: "Уточнение основания", h: 32 }],
          [{ id: "motives", label: "Мотивы", h: 40 }],
        ],
      },
      {
        title: "Сведения о заявителе",
        rows: [
          [{ id: "fio", label: "1. Фамилия, имя, отчество" }],
          [{ id: "previous", label: "Прежние ФИО, причина и дата", h: 28 }],
          [
            { id: "birthDate", label: "2. Дата рождения", date: true },
            { id: "birthPlace", label: "Место рождения" },
            { id: "sex", label: "3. Пол", map: { m: "мужской", f: "женский" } },
          ],
          [{ id: "citizenship", label: "4. Гражданство иностранного государства", h: 32 }],
          [{ id: "ussr", label: "5. Гражданство СССР или Российской Федерации", h: 32 }],
          [{ id: "prior", label: "6. Прежние обращения", h: 28 }],
          [
            { id: "nationality", label: "7. Национальность" },
            { id: "religion", label: "8. Вероисповедание" },
          ],
          [{ id: "education", label: "9. Образование и квалификация", h: 32 }],
          [{ id: "degree", label: "10. Учёная степень, звание" }],
          [{ id: "marital", label: "11. Семейное положение", h: 28 }],
          {
            title: "12. Члены семьи и близкие родственники",
            repeat: "family",
            columns: [
              ["relation", "Родство"],
              ["fio", "ФИО"],
              ["birth", "Рождение"],
              ["citizenship", "Гражданство"],
              ["address", "Адрес"],
              ["work", "Работа, учёба"],
            ],
          },
          {
            title: "13. Трудовая деятельность за последние пять лет",
            repeat: "jobs",
            columns: [
              ["from", "Приём"],
              ["to", "Увольнение"],
              ["role", "Должность и организация"],
              ["address", "Адрес"],
            ],
          },
          [{ id: "income", label: "14. Источник средств", h: 28 }],
          [{ id: "inn", label: "15. ИНН" }],
          [{ id: "language", label: "16. Владение русским языком", h: 28 }],
          [{ id: "military", label: "17. Воинская обязанность", h: 28 }],
          [{ id: "lived", label: "18. Проживание в России или РСФСР", h: 28 }],
          [{ id: "trips", label: "19. Выезды", h: 32 }],
          [{ id: "unregistered", label: "20. Пребывание без регистрации", h: 28 }],
          [{ id: "status", label: "21. Особый статус", h: 28 }],
          [{ id: "expulsion", label: "22. Выдворение", h: 24 }],
          [{ id: "service", label: "23. Служба в иностранном государстве", h: 28 }],
          [{ id: "conflict", label: "24. Военные конфликты", h: 24 }],
          [{ id: "criminal", label: "25. Уголовная ответственность", h: 28 }],
          [{ id: "pursued", label: "26. Уголовное преследование", h: 24 }],
          [{ id: "address", label: "27. Адрес, почта, телефон", h: 32 }],
          [{ id: "actual", label: "28. Фактическое проживание" }],
          [{ id: "identity", label: "29. Документ, удостоверяющий личность", h: 32 }],
        ],
      },
      {
        title: "II. Вместе со мной",
        rows: [
          [
            { id: "withChild", label: "Принять вместе со мной", map: { yes: "да", no: "нет" } },
            { id: "childKind", label: "Кого", map: CHILD_KIND },
          ],
          [{ id: "cFio", label: "30. ФИО ребёнка или подопечного" }],
          [{ id: "cBirth", label: "31. Дата и место рождения" }],
          [{ id: "cSex", label: "32. Пол", map: { m: "мужской", f: "женский" } }],
          [{ id: "cCitizenship", label: "33. Гражданство", h: 24 }],
          [{ id: "cAddress", label: "34. Место жительства", h: 24 }],
          [{ id: "cBirthDoc", label: "35. Свидетельство о рождении", h: 24 }],
          [{ id: "cId", label: "36. Документ личности", h: 24 }],
          [{ id: "cAdopt", label: "37. Усыновление или опека", h: 24 }],
          [{ id: "parent2", label: "38. Другой родитель", h: 28 }],
        ],
      },
    ],
  },
};

function textOf(values, cell) {
  const raw = values[cell.id];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  if (cell.date && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}.${m}.${y}`;
  }
  if (cell.map && cell.map[value]) return cell.map[value];
  return value;
}

function wrap(text, font, size, width) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) <= width) line = trial;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

export function layoutFor(procedureId) {
  return layouts[procedureId] ?? null;
}

export async function renderFormPdf(procedureId, values, meta) {
  if (procedureId === "vnzh") return renderOfficialVnzh(values);
  if (procedureId === "pribytie") return renderOfficialArrival(values);
  if (procedureId === "patent") return renderOfficialPatent(values);
  if (procedureId === "grazhdanstvo") return renderOfficialCitizenship(values);
  const layout = layouts[procedureId];
  if (!layout) throw new Error("Нет макета бланка");
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fs.readFileSync(path.resolve("public/fonts/LiberationSans-Regular.ttf")), { subset: true });
  const bold = await pdf.embedFont(fs.readFileSync(path.resolve("public/fonts/LiberationSans-Bold.ttf")), { subset: true });
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 28;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    ruleText(meta.shortTitle, bold, 8, MUTED);
    y -= 6;
  };
  const ensure = (height) => {
    if (y - height < 46) newPage();
  };
  const ruleText = (text, face, size, color) => {
    const lines = wrap(text, face, size, pageWidth - margin * 2);
    for (const line of lines) {
      ensure(size + 2);
      page.drawText(line, { x: margin, y: y - size, size, font: face, color });
      y -= size + 2;
    }
  };

  page.drawText("Сверьте с бланком на сайте МВД перед подачей. Подпись — от руки. Печать ставит орган.", {
    x: margin,
    y: y - 8,
    size: 8,
    font: regular,
    color: MUTED,
  });
  y -= 16;
  ruleText(layout.kicker, regular, 8, MUTED);
  y -= 4;
  for (const line of layout.title.split("\n")) {
    const size = 12;
    const width = bold.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (pageWidth - width) / 2, y: y - size, size, font: bold, color: INK });
    y -= size + 3;
  }
  y -= 6;

  if (layout.photo) {
    const w = 78;
    const h = 96;
    page.drawRectangle({
      x: pageWidth - margin - w,
      y: y - h,
      width: w,
      height: h,
      borderColor: LINE,
      borderWidth: 0.8,
      color: PAPER,
    });
    const bits = wrap(layout.photo, regular, 7, w - 8);
    bits.forEach((line, index) => {
      page.drawText(line, { x: pageWidth - margin - w + 4, y: y - 16 - index * 9, size: 7, font: regular, color: MUTED });
    });
  }

  const contentWidth = pageWidth - margin * 2;

  const drawCell = (x, top, w, h, label, value) => {
    page.drawRectangle({ x, y: top - h, width: w, height: h, borderColor: LINE, borderWidth: 0.6, color: PAPER });
    page.drawText(label, { x: x + 3, y: top - 9, size: 6.5, font: regular, color: MUTED });
    const lines = wrap(value || " ", bold, 9, w - 6).slice(0, Math.max(1, Math.floor((h - 14) / 11)));
    lines.forEach((line, index) => {
      page.drawText(line, { x: x + 3, y: top - 20 - index * 11, size: 9, font: bold, color: INK });
    });
  };

  for (const section of layout.sections) {
    ensure(22);
    page.drawRectangle({ x: margin, y: y - 16, width: contentWidth, height: 16, color: HEAD, borderColor: LINE, borderWidth: 0.6 });
    page.drawText(section.title, { x: margin + 4, y: y - 11, size: 8, font: bold, color: INK });
    y -= 16;
    for (const row of section.rows) {
      if (row.repeat) {
        ensure(18);
        page.drawText(row.title, { x: margin, y: y - 10, size: 8, font: bold, color: INK });
        y -= 14;
        const list = Array.isArray(values[row.repeat]) ? values[row.repeat] : [];
        const filled = list.filter((item) => Object.values(item).some((cell) => String(cell).trim()));
        if (!filled.length) {
          ensure(16);
          drawCell(margin, y, contentWidth, 16, "Сведения", "нет");
          y -= 16;
          continue;
        }
        filled.forEach((item, index) => {
          const h = 28;
          ensure(h);
          const colW = contentWidth / row.columns.length;
          row.columns.forEach(([key, label], col) => {
            drawCell(margin + col * colW, y, colW, h, `${index + 1}. ${label}`, String(item[key] ?? ""));
          });
          y -= h;
        });
        continue;
      }
      const height = Math.max(...row.map((cell) => cell.h || 28));
      ensure(height);
      const width = contentWidth / row.length;
      row.forEach((cell, index) => {
        drawCell(margin + index * width, y, width, height, cell.label, textOf(values, cell));
      });
      y -= height;
    }
    y -= 8;
  }

  if (layout.tearOff) {
    ensure(70);
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.6,
      color: LINE,
      dashArray: [3, 2],
    });
    y -= 14;
    ruleText("ОТРЫВНАЯ ЧАСТЬ", bold, 9, INK);
    ruleText("О прибытии в место пребывания уведомление подано. Отметку о приёме ставит орган, МФЦ, гостиница или почта.", regular, 8, MUTED);
    const who = [values.lastName, values.firstName, values.middleName].filter(Boolean).join(" ");
    ruleText(`Лицо: ${who || "—"}`, regular, 9, INK);
    ruleText(`Адрес: ${values.address || "—"}`, regular, 9, INK);
    y -= 8;
  }

  ensure(48);
  page.drawText("Подпись заявителя (от руки):", { x: margin, y: y - 10, size: 9, font: regular, color: INK });
  page.drawLine({ start: { x: margin + 150, y: y - 12 }, end: { x: margin + 320, y: y - 12 }, thickness: 0.7, color: INK });
  page.drawText("Дата: «____» __________ 20____ г.", { x: margin + 330, y: y - 10, size: 9, font: regular, color: INK });
  y -= 22;
  page.drawText("М.П. — место печати органа. Не заполняется и не изображается.", { x: margin, y: y - 8, size: 8, font: regular, color: MUTED });

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawText(`Сверьте с официальным бланком МВД. ${index + 1} / ${pages.length}`, {
      x: margin,
      y: 18,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
  });

  pdf.setTitle(layout.title.replace(/\n/g, " "));
  pdf.setSubject(meta.blankPageUrl || "");
  return { bytes: await pdf.save(), fileName: layout.fileName };
}
