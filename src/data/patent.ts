import type { Procedure } from "../types";

export const patent: Procedure = {
  id: "patent",
  shortTitle: "Заявление на патент",
  title: "Заявление об оформлении патента",
  summary: "Первый бланк, если приехали без визы и хотите работать. Его обычно заполняют у юриста.",
  official: {
    pageUrl: "https://балахта.24.мвд.рф/folder/35266596",
    pageTitle: "Бланки и образцы заявлений",
    blankTitle: "Бланк заявления об оформлении патента",
    blankPageUrl: "https://балахта.24.мвд.рф/folder/35266596",
    checkedOn: "2026-09-25",
  },
  about: [
    "Патент нужен иностранцу, который въехал без визы и собирается работать у компании, предпринимателя или гражданина России.",
    "Поля ниже — клетки бланка заявления об оформлении патента. На сайте МВД рядом лежит образец заполнения.",
    "Переоформление, дубликат и исправление уже выданного патента — другие бланки. Здесь их нет.",
  ],
  whereTitle: "Куда подают",
  where: [
    "В подразделение по вопросам миграции МВД того региона, где будете работать.",
    "Лично или через организацию, которую уполномочил этот регион. На бланке это отдельная отметка.",
    "Этот сервис заявление в МВД не отправляет. Вы печатаете файл и несёте его сами.",
  ],
  timing: [
    "Срок подачи и срок изготовления на открытой странице бланков не указаны. Сверьте их в подразделении. Это отметка «нужна сверка».",
  ],
  blank: {
    title: "Бланк заявления об оформлении патента",
    sourceUrl: "https://балахта.24.мвд.рф/folder/35266596",
    blankNote:
      "Кнопка «Скачать бланк» отдаёт пустое заявление об оформлении патента со страницы «Бланки и образцы заявлений». Ваших ответов в нём нет. Фото 30×40 мм наклеиваете сами. Подпись — от руки. Служебные графы «документы принял» пустые.",
  },
  sources: [
    {
      title: "Бланки и образцы заявлений, балахта.24.мвд.рф",
      url: "https://балахта.24.мвд.рф/folder/35266596",
      note: "Бланк заявления об оформлении патента и образец. Проверено 25.09.2026.",
    },
    {
      title: "Административный регламент по патентам",
      url: "https://балахта.24.мвд.рф/folder/35266453",
      note: "На странице лежит файл регламента. Текст перечня в этой проверке не разбирался.",
    },
    {
      title: "Госпошлина за патент",
      url: "https://балахта.24.мвд.рф/folder/35266781",
      note: "На странице указаны 4 200 рублей за выдачу или переоформление и 2 100 за дубликат или изменение сведений. Сверьте квитанцию перед оплатой в казну.",
    },
  ],
  checkedOn: "2026-09-25",
  checklist: [
    {
      id: "blank",
      title: "Сам бланк",
      items: [
        {
          id: "application",
          title: "Заявление об оформлении патента",
          what: "Бланк со страницы «Бланки и образцы заявлений». Заполняется по-русски. Фотография 30×40 мм — на бланке.",
          who: "Иностранец, который просит патент впервые в этом регионе.",
          exceptions: "Переоформление, дубликат и изменение сведений — отдельные бланки на той же странице. Этот сервис их не собирает.",
          need: "always",
        },
      ],
    },
    {
      id: "pack",
      title: "Что приложить",
      items: [
        {
          id: "list",
          title: "Остальной перечень",
          what: "Рядом с бланком МВД выложило административный регламент услуги. В этой проверке текст регламента не открылся, поэтому построчный список копий здесь не пересказывается.",
          who: "Тот, кто подаёт заявление.",
          exceptions: "Сверьте комплект по файлу регламента на странице МВД и в окне. Это отметка «нужна сверка».",
          need: "check",
        },
        {
          id: "duty",
          title: "Госпошлина",
          what: "На странице реквизитов МВД указано 4 200 рублей за выдачу либо переоформление патента. Это не плата сервиса.",
          who: "Заявитель, если подразделение просит квитанцию.",
          exceptions: "Сумму сверьте перед оплатой в казну: страница могла обновиться.",
          need: "check",
        },
      ],
    },
  ],
  steps: [
    {
      id: "who",
      title: "1. Куда и кто",
      lead: "Шапка бланка и отметки, которые на нём стоят отдельно.",
      groups: [
        {
          id: "who-main",
          fields: [
            { id: "office", label: "Территориальный орган МВД", type: "text", required: true },
            { id: "lastName", label: "Фамилия", type: "text", required: true },
            { id: "firstName", label: "Имя", type: "text", required: true },
            { id: "middleName", label: "Отчество", hint: "Если нет, напишите «нет».", type: "text", required: true },
            { id: "previous", label: "Прежние фамилия, имя, отчество", hint: "Причина и дата. Если не менялись, напишите «нет».", type: "textarea", required: true },
            { id: "citizenship", label: "Гражданство или государство проживания", type: "text", required: true },
            { id: "birthPlace", label: "Место рождения", hint: "Государство и населённый пункт.", type: "text", required: true },
            { id: "birthDate", label: "Дата рождения", type: "date", required: true },
            {
              id: "sex",
              label: "Пол",
              type: "radio",
              required: true,
              options: [
                { value: "m", label: "Мужской" },
                { value: "f", label: "Женский" },
              ],
            },
            { id: "homeAddress", label: "Адрес постоянного проживания", type: "textarea", required: true },
          ],
        },
      ],
    },
    {
      id: "docs",
      title: "2. Документ, карта и учёт",
      lead: "Клетки документа, миграционной карты и постановки на учёт.",
      groups: [
        {
          id: "docs-main",
          fields: [
            { id: "docType", label: "Вид документа", type: "text", required: true, placeholder: "Паспорт" },
            { id: "docSeries", label: "Серия", hint: "Если серии нет, напишите «нет».", type: "text", required: true },
            { id: "docNumber", label: "Номер", type: "text", required: true },
            { id: "docIssued", label: "Дата выдачи", type: "date", required: true },
            { id: "docWho", label: "Кем выдан", type: "text", required: true },
            { id: "migrationCard", label: "Серия и номер миграционной карты", type: "text", required: true },
            { id: "migrationIssued", label: "Дата выдачи миграционной карты", type: "date", required: true },
            {
              id: "purposeWork",
              label: "Цель визита в карте изменена на «работа»",
              type: "radio",
              required: true,
              options: [
                { value: "yes", label: "Да" },
                { value: "no", label: "Нет" },
              ],
            },
            { id: "stayAddress", label: "Адрес постановки на учёт по месту пребывания", type: "textarea", required: true },
            { id: "stayFrom", label: "Учёт с", type: "date", required: true },
            { id: "stayUntil", label: "Учёт по", type: "date", required: true },
            { id: "inn", label: "ИНН", hint: "Если нет, напишите «нет».", type: "text", required: true },
          ],
        },
      ],
    },
    {
      id: "work",
      title: "3. Язык и работа",
      lead: "Документ о языке и у кого планируете работать.",
      groups: [
        {
          id: "work-main",
          fields: [
            { id: "langType", label: "Вид документа о русском языке, истории и законодательстве", type: "text", required: true },
            { id: "langSeries", label: "Серия", hint: "Если серии нет, напишите «нет».", type: "text", required: true },
            { id: "langNumber", label: "Номер", type: "text", required: true },
            { id: "langIssued", label: "Дата выдачи", type: "date", required: true },
            {
              id: "employer",
              label: "Трудовая деятельность планируется у",
              type: "radio",
              required: true,
              options: [
                { value: "org", label: "Юридическое лицо или индивидуальный предприниматель" },
                { value: "person", label: "Физическое лицо — гражданин России" },
              ],
            },
            { id: "profession", label: "Профессия, специальность или вид работы", type: "textarea", required: true },
            { id: "workUntil", label: "Предполагаемый срок работы до", type: "date", required: true },
          ],
        },
      ],
    },
    {
      id: "old",
      title: "4. Прежний патент и подача",
      lead: "Нижний блок бланка. Заполняйте прежний патент, только если просите патент в другом регионе.",
      groups: [
        {
          id: "old-switch",
          fields: [
            {
              id: "hasOld",
              label: "Уже есть патент другого региона",
              type: "radio",
              required: true,
              options: [
                { value: "no", label: "Нет" },
                { value: "yes", label: "Да" },
              ],
            },
          ],
        },
        {
          id: "old-main",
          showIf: { field: "hasOld", equals: "yes" },
          fields: [
            { id: "oldOffice", label: "Кто выдал прежний патент", type: "text", required: true },
            { id: "oldSeries", label: "Серия патента", type: "text", required: true },
            { id: "oldNumber", label: "Номер патента", type: "text", required: true },
            { id: "oldBlankSeries", label: "Серия бланка патента", type: "text", required: true },
            { id: "oldBlankNumber", label: "Номер бланка патента", type: "text", required: true },
            { id: "oldFrom", label: "Срок действия с", type: "date", required: true },
            { id: "oldUntil", label: "Срок действия по", type: "date", required: true },
          ],
        },
        {
          id: "file-main",
          fields: [
            { id: "phone", label: "Контактный телефон", type: "text", required: true },
            {
              id: "filedBy",
              label: "Заявление подаётся",
              type: "radio",
              required: true,
              options: [
                { value: "self", label: "Лично" },
                { value: "org", label: "Через уполномоченную организацию региона" },
              ],
            },
            {
              id: "ack",
              label: "Понимаю: файл сверю с бланком МВД, подпись поставлю от руки.",
              type: "checkbox",
              required: true,
            },
          ],
        },
      ],
    },
  ],
  pdf: {
    fileName: "zayavlenie-o-patente.pdf",
    draftTitle: "Заявление об оформлении патента",
    formReference: "Бланк со страницы балахта.24.мвд.рф, папка бланков патента.",
    photoCaption: "Место для фотографии 30×40 мм",
    authorityNote: "Дата приёма, регистрационный номер и подпись сотрудника не заполняются.",
    signatureCaption: "Подпись заявителя (от руки):",
    closingLines: [],
  },
};
