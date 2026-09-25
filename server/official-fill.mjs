import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const INK = rgb(0.05, 0.05, 0.05);
const FONT = path.resolve("public/fonts/LiberationSans-Regular.ttf");

const NAME = [106.8, 122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7];
const FROM_MID = NAME.slice(3);
const FROM_CIT = NAME.slice(2);
const DATE_A = [[87.4, 102.9], [153.4, 168.9], [200, 215.5, 231.1, 246.6]];
const DATE_B = [[308.7, 324.3], [370.9, 386.4], [417.5, 433, 448.5, 464.1]];

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function dateText(value) {
  const raw = clean(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : raw;
}

function dateParts(value) {
  const match = dateText(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? [match[1], match[2], match[3]] : null;
}

function rowsOf(value) {
  return Array.isArray(value) ? value.filter((item) => item && Object.values(item).some((cell) => clean(cell))) : [];
}

async function openBlank(file) {
  const pdf = await PDFDocument.load(fs.readFileSync(path.resolve("server/blanks", file)));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fs.readFileSync(FONT), { subset: true });
  return { pdf, font, pages: pdf.getPages() };
}

function cells(page, font, value, bottom, xs, upper = true) {
  let raw = clean(value);
  if (!raw || !xs?.length) return;
  if (upper) raw = raw.toLocaleUpperCase("ru-RU");
  let index = 0;
  for (const ch of raw) {
    if (ch === " ") {
      index += 1;
      continue;
    }
    if (index >= xs.length) break;
    page.drawText(ch, {
      x: xs[index] + 1.7,
      y: page.getHeight() - (bottom - 2.2),
      size: 8.5,
      font,
      color: INK,
    });
    index += 1;
  }
}

function flowCells(page, font, value, rows) {
  let raw = clean(value).toLocaleUpperCase("ru-RU");
  for (const [bottom, xs] of rows) {
    if (!raw) return;
    let taken = 0;
    let count = 0;
    for (const ch of raw) {
      if (count >= xs.length) break;
      taken += 1;
      count += 1;
    }
    cells(page, font, raw.slice(0, taken), bottom, xs, false);
    raw = raw.slice(taken).trimStart();
  }
}

function writeDate(page, font, value, bottom, groups) {
  const parts = dateParts(value);
  if (!parts) return;
  parts.forEach((part, index) => cells(page, font, part, bottom, groups[index], false));
}

function cross(page, x0, y0, x1, y1) {
  const height = page.getHeight();
  page.drawLine({ start: { x: x0 + 2, y: height - y0 - 2 }, end: { x: x1 - 2, y: height - y1 + 2 }, thickness: 1.05, color: INK });
  page.drawLine({ start: { x: x0 + 2, y: height - y1 + 2 }, end: { x: x1 - 2, y: height - y0 - 2 }, thickness: 1.05, color: INK });
}

function strike(page, x0, x1, y) {
  const baseline = page.getHeight() - y;
  page.drawLine({ start: { x: x0, y: baseline }, end: { x: x1, y: baseline }, thickness: 0.9, color: INK });
}

function fitLine(page, font, value, y, x, maxX, size = 10) {
  const content = clean(value);
  if (!content) return "";
  const width = maxX - x;
  let cut = content.length;
  while (cut > 1 && font.widthOfTextAtSize(content.slice(0, cut), size) > width) cut -= 1;
  if (cut < content.length) {
    const space = content.lastIndexOf(" ", cut);
    if (space > 12) cut = space;
  }
  const shown = content.slice(0, cut).trim();
  if (shown) {
    page.drawText(shown, { x, y: page.getHeight() - (y - 3), size, font, color: INK });
  }
  return content.slice(cut).trim();
}

function lines(page, font, value, slots, size = 10) {
  let rest = clean(value);
  for (const slot of slots) {
    if (!rest) return;
    rest = fitLine(page, font, rest, slot[0], slot[1], slot[2], slot[3] || size);
  }
}

export async function renderOfficialArrival(values) {
  const { pdf, font, pages } = await openBlank("pribytie-blank.pdf");
  const page = pages[0];
  cells(page, font, values.lastName, 227.8, NAME);
  cells(page, font, values.firstName, 246.6, NAME);
  cells(page, font, values.middleName, 265.3, FROM_MID);
  cells(page, font, values.citizenship, 292.2, FROM_CIT);
  writeDate(page, font, values.birthDate, 325.2, [[168.9, 184.4], [231.1, 246.6], [277.7, 293.2, 308.7, 324.3]]);
  if (values.sex === "m") cross(page, 401.9, 311.2, 416, 325.2);
  if (values.sex === "f") cross(page, 464.1, 311.2, 478.2, 325.2);
  const birth = clean(values.birthPlace).split(",").map((part) => part.trim()).filter(Boolean);
  if (birth.length > 1) {
    cells(page, font, birth[0], 343.9, FROM_MID);
    cells(page, font, birth[1], 362.6, FROM_MID);
    cells(page, font, birth.slice(2).join(", "), 381.3, FROM_MID);
  } else {
    flowCells(page, font, values.birthPlace, [[343.9, FROM_MID], [362.6, FROM_MID], [381.3, FROM_MID]]);
  }
  const docRow = [91.2, 106.8, 122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1, 277.7, 293.2, 308.7, 324.3, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7];
  cells(page, font, values.docType, 410.5, docRow.slice(0, 10));
  cells(page, font, values.docSeries, 410.5, docRow.slice(10, 14));
  cells(page, font, values.docNumber, 410.5, docRow.slice(14));
  const issued = dateText(values.docIssued).match(/(\d{2}\.\d{2}\.\d{4})/);
  if (issued) writeDate(page, font, issued[1], 440.5, DATE_A);
  writeDate(page, font, values.docUntil, 440.5, DATE_B);

  const stay = clean(values.extraDoc).toLowerCase();
  if (stay.includes("виза")) cross(page, 83.5, 488, 97, 501.9);
  else if (stay.includes("жительств")) cross(page, 192.2, 488, 206, 501.9);
  else if (stay.includes("образован")) cross(page, 471.8, 488, 486, 501.9);
  else if (stay.includes("временн") || stay.includes("рвп")) cross(page, 332, 488, 346, 501.9);
  const stayRow = [91.2, 106.8, 122.3, 137.8, 168.9, 184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4];
  cells(page, font, values.extraDoc, 549, stayRow);
  const purpose = clean(values.purpose).toLowerCase();
  const purposeBox = [
    ["служеб", 168.9],
    ["туризм", 219.4],
    ["делов", 269.9],
    ["учеб", 312.6],
    ["работ", 359.2],
    ["част", 409.7],
    ["транзит", 464.1],
  ].find(([word]) => purpose.includes(word));
  if (purposeBox) cross(page, purposeBox[1], 593.5, purposeBox[1] + 14, 607.5);
  else if (purpose.includes("гуманитар")) cross(page, 168.9, 612, 183, 626.2);
  else if (purpose) cross(page, 215.5, 612, 229.5, 626.2);
  cells(page, font, values.foreignPhone, 626.2, [370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  cells(page, font, values.profession, 644.9, [122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  writeDate(page, font, values.entryDate, 677.1, DATE_A);
  writeDate(page, font, values.stayUntil, 677.1, DATE_B);
  const card = clean(values.migrationCard).replace(/\s+/g, "");
  cells(page, font, card.slice(0, 4), 695.8, [215.5, 231.1, 246.6, 262.1], false);
  cells(page, font, card.slice(4), 695.8, [293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5], false);

  const back = pages[1];
  flowCells(back, font, values.previousAddress, [[90.8, FROM_MID], [109.5, FROM_MID], [128.2, FROM_MID], [146.9, [60.2, 75.7, 91.2, ...NAME]]]);
  flowCells(back, font, values.address, [
    [193.4, FROM_CIT],
    [212.1, FROM_CIT],
    [241.3, FROM_CIT],
    [260, FROM_MID],
    [282.5, FROM_CIT],
    [301.2, [168.9, 184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 324.3, 339.8, 355.3, 370.9, 386.4, 448.5, 464.1, 479.6, 495.1]],
  ]);
  flowCells(back, font, values.cadastral, [
    [614.7, [184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]],
    [633.4, [184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]],
  ]);

  const host = pages[2];
  if (values.hostKind === "org") cross(host, 417.5, 74.5, 431.5, 88.3);
  if (values.hostKind === "person") cross(host, 510.7, 74.5, 524.7, 88.3);
  const hostParts = clean(values.hostName).split(" ");
  cells(host, font, hostParts[0], 107, NAME);
  cells(host, font, hostParts[1], 125.7, NAME);
  cells(host, font, hostParts.slice(2).join(" "), 144.5, [184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  cells(host, font, values.hostDoc, 173.7, [75.7, 91.2, 106.8, 122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1, 277.7, 293.2, 308.7, 324.3, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  flowCells(host, font, values.hostAddress, [[246.3, FROM_MID], [265, FROM_MID], [294.3, FROM_CIT], [313, FROM_MID], [335.3, FROM_CIT]]);
  cells(host, font, values.lastName, 396.9, NAME);
  cells(host, font, values.firstName, 415.6, NAME);
  cells(host, font, values.middleName, 434.3, [184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  cells(host, font, values.citizenship, 459.8, [122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1, 246.6, 262.1, 277.7, 293.2, 308.7, 324.3, 339.8, 355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  writeDate(host, font, values.birthDate, 486.7, [[157.3, 172.8], [219.4, 234.9], [266, 281.5, 297.1, 312.6]]);
  if (values.sex === "m") cross(host, 401.9, 472.7, 416, 486.7);
  if (values.sex === "f") cross(host, 464.1, 472.7, 478.2, 486.7);
  flowCells(host, font, values.birthPlace, [[505.4, FROM_MID], [524.1, FROM_MID], [542.8, FROM_MID]]);
  cells(host, font, values.docType, 572.1, [75.7, 91.2, 106.8, 122.3, 137.8, 153.4, 168.9, 184.4, 200, 215.5, 231.1]);
  cells(host, font, values.docSeries, 572.1, [277.7, 293.2, 308.7, 324.3]);
  cells(host, font, values.docNumber, 572.1, [355.3, 370.9, 386.4, 401.9, 417.5, 433, 448.5, 464.1, 479.6, 495.1, 510.7]);
  if (issued) writeDate(host, font, issued[1], 602, DATE_A);
  writeDate(host, font, values.docUntil, 602, DATE_B);
  flowCells(host, font, values.address, [[643.9, FROM_MID], [662.7, FROM_MID], [691.9, FROM_CIT], [710.6, FROM_MID], [732.9, FROM_CIT]]);

  return { bytes: await pdf.save(), fileName: "uvedomlenie-o-pribytii.pdf" };
}

export async function renderOfficialPatent(values) {
  const { pdf, font, pages } = await openBlank("patent-blank.pdf");
  const page = pages[0];
  lines(page, font, values.office, [[88.9, 274, 550], [117.5, 274, 550], [131.8, 274, 550], [146.1, 274, 550]], 10);
  lines(page, font, values.lastName, [[277, 128, 550]], 12);
  lines(page, font, values.firstName, [[319.5, 128, 550]], 12);
  lines(page, font, values.middleName, [[362, 128, 550]], 12);
  lines(page, font, values.previous, [[391.3, 258, 550], [420.6, 58, 550], [441.9, 58, 550]], 10);
  lines(page, font, values.citizenship, [[463.1, 230, 550]], 11);
  lines(page, font, values.birthPlace, [[534.9, 172, 550]], 11);
  lines(page, font, dateText(values.birthDate), [[585.5, 158, 318]], 10);
  if (values.sex === "m") cross(page, 364.5, 567.2, 380.7, 585.5);
  if (values.sex === "f") cross(page, 414.7, 567.2, 430.9, 585.5);
  lines(page, font, values.homeAddress, [[615.9, 258, 550], [637.2, 58, 550], [658.4, 58, 550], [679.7, 58, 550]], 10);
  lines(page, font, values.docType, [[700.9, 300, 550]], 11);
  lines(page, font, values.docSeries, [[751.5, 96, 160]], 11);
  lines(page, font, values.docNumber, [[751.5, 190, 348]], 11);
  lines(page, font, dateText(values.docIssued), [[751.5, 360, 548]], 10);
  lines(page, font, values.docWho, [[783.8, 132, 550]], 10);

  const next = pages[1];
  const card = clean(values.migrationCard);
  const cardMatch = card.match(/^(.*?)\s+(\d+.*)$/);
  lines(next, font, cardMatch ? cardMatch[1] : card, [[96.7, 176, 348]], 11);
  lines(next, font, dateText(values.migrationIssued), [[96.7, 420, 548]], 10);
  if (values.purposeWork === "yes") cross(next, 55.3, 166.8, 70.9, 185.2);
  if (values.purposeWork === "no") cross(next, 108.3, 166.8, 123.8, 185.2);
  lines(next, font, values.stayAddress, [[206.5, 344, 550], [227.7, 58, 550], [249, 58, 550], [270.2, 58, 550]], 10);
  lines(next, font, dateText(values.stayFrom), [[291.5, 232, 366]], 9);
  lines(next, font, dateText(values.stayUntil), [[291.5, 400, 548]], 9);
  lines(next, font, values.inn, [[321.9, 184, 434]], 11);
  lines(next, font, values.langType, [[372.5, 58, 550], [393.7, 58, 540]], 10);
  lines(next, font, values.langSeries, [[444.3, 96, 160]], 11);
  lines(next, font, values.langNumber, [[444.3, 190, 348]], 11);
  lines(next, font, dateText(values.langIssued), [[444.3, 420, 548]], 10);
  if (values.employer === "org") cross(next, 55.3, 486, 69.4, 506.4);
  if (values.employer === "person") cross(next, 55.3, 524.2, 69.4, 544.5);
  lines(next, font, values.profession, [[602.3, 58, 550], [623.5, 58, 550], [644.8, 58, 550]], 10);
  lines(next, font, dateText(values.workUntil), [[678.5, 82, 234]], 10);
  if (values.hasOld === "yes") lines(next, font, values.oldOffice, [[749.2, 180, 550]], 10);

  const last = pages[2];
  if (values.hasOld === "yes") {
    lines(last, font, values.oldSeries, [[96.7, 190, 276]], 11);
    lines(last, font, values.oldNumber, [[96.7, 312, 530]], 11);
    lines(last, font, values.oldBlankSeries, [[118, 190, 276]], 11);
    lines(last, font, values.oldBlankNumber, [[118, 312, 530]], 11);
    lines(last, font, dateText(values.oldFrom), [[139.2, 190, 336]], 9);
    lines(last, font, dateText(values.oldUntil), [[139.2, 386, 530]], 9);
  }
  lines(last, font, values.phone, [[171.6, 226, 550]], 11);
  if (values.filedBy === "self") cross(last, 55.3, 193, 69.5, 216);
  if (values.filedBy === "org") cross(last, 188.6, 193.5, 202.8, 215.5);

  return { bytes: await pdf.save(), fileName: "zayavlenie-o-patente.pdf" };
}

function markBasis(page, basis) {
  const articles = { 15: [518, 531, 351], 16: [536, 549, 351], 17: [554, 566, 351], 44: [164, 178, 365] };
  const keep = String(basis || "").startsWith("a15") ? "15"
    : String(basis || "").startsWith("a16") ? "16"
      : basis === "a17" ? "17"
        : basis === "a44" ? "44"
          : "";
  for (const [key, box] of Object.entries(articles)) {
    if (keep && key !== keep) strike(page, box[0], box[1], box[2]);
  }
}

export async function renderOfficialCitizenship(values) {
  const { pdf, font, pages } = await openBlank("grazhdanstvo-blank.pdf");
  const page = pages[0];
  lines(page, font, values.authority, [[88.9, 60, 364]], 10);
  markBasis(page, values.basis);
  lines(page, font, [values.motives, values.basisDetail].filter(Boolean).join(". "), [[399.4, 406, 562], [421.8, 60, 560]], 10);
  lines(page, font, values.fio, [[501.9, 278, 560]], 11);
  lines(page, font, values.previous, [[528.7, 60, 560], [555.6, 60, 560]], 10);
  lines(page, font, `${dateText(values.birthDate)} ${clean(values.birthPlace)}`.trim(), [[592.4, 266, 560], [617.6, 60, 548]], 10);
  lines(page, font, values.sex === "m" ? "мужской" : values.sex === "f" ? "женский" : "", [[642.6, 102, 280]], 11);
  lines(page, font, values.citizenship, [[703.2, 60, 560]], 10);

  const bio = pages[1];
  lines(bio, font, values.ussr, [[155.1, 430, 560], [179.7, 60, 560]], 10);
  lines(bio, font, values.prior, [[253, 60, 560], [276, 60, 560]], 10);
  lines(bio, font, values.nationality, [[301.7, 164, 560]], 10);
  lines(bio, font, values.religion, [[329, 230, 560]], 10);
  lines(bio, font, values.education, [[393, 60, 560], [416, 60, 560, 10], [439, 60, 560, 10]], 10);
  lines(bio, font, values.degree, [[478, 320, 560], [502.6, 60, 560]], 10);
  lines(bio, font, values.marital, [[529.5, 196, 560], [556.3, 60, 560]], 10);
  rowsOf(values.family).slice(0, 6).forEach((row, index) => {
    const y = [664.2, 684.9, 706.1, 727, 748, 768.9][index];
    lines(bio, font, row.relation, [[y, 58, 108]], 7);
    lines(bio, font, row.fio, [[y, 112, 222]], 7);
    lines(bio, font, row.birth, [[y, 226, 296]], 7);
    lines(bio, font, row.citizenship, [[y, 300, 372]], 7);
    lines(bio, font, row.address, [[y, 376, 482]], 7);
    lines(bio, font, row.work, [[y, 488, 570]], 7);
  });

  const work = pages[2];
  rowsOf(values.jobs).slice(0, 4).forEach((row, index) => {
    const y = [201.1, 224.4, 245.9, 266.4][index];
    lines(work, font, row.from, [[y, 58, 112]], 8);
    lines(work, font, row.to, [[y, 116, 186]], 8);
    lines(work, font, row.role, [[y, 192, 410]], 8);
    lines(work, font, row.address, [[y, 416, 568]], 8);
  });
  lines(work, font, values.income, [[304, 60, 560], [330, 60, 560]], 10);
  lines(work, font, values.inn, [[356.2, 406, 550]], 10);
  lines(work, font, values.language, [[395, 280, 560], [423, 60, 560]], 10);
  lines(work, font, values.military, [[473.4, 60, 560]], 10);
  lines(work, font, values.lived, [[557.9, 60, 560], [584.8, 60, 560]], 10);
  lines(work, font, values.trips, [[715, 60, 548, 9]], 9);

  const past = pages[3];
  lines(past, font, values.unregistered, [[196.8, 60, 560], [230, 60, 560, 10], [256, 60, 560, 10]], 10);
  lines(past, font, values.status, [[378, 60, 560, 10], [400, 60, 560, 10]], 10);
  lines(past, font, values.expulsion, [[420, 60, 560, 10], [450, 60, 560, 10]], 10);
  lines(past, font, values.service, [[493.5, 360, 560], [529.7, 60, 560]], 10);
  lines(past, font, values.conflict, [[603.6, 60, 560], [620, 60, 560, 10]], 10);
  lines(past, font, values.criminal, [[643.4, 340, 560], [665.6, 60, 560], [689, 60, 560]], 10);

  const now = pages[4];
  lines(now, font, [values.address, values.email, values.phone].map(clean).filter(Boolean).join(", "), [[173.4, 168, 560], [185.6, 60, 560]], 10);
  lines(now, font, values.actual, [[241.6, 60, 560]], 10);
  lines(now, font, values.identity, [[297.7, 280, 560], [324.5, 60, 560]], 10);
  if (values.withChild === "yes") {
    const childMark = { child: 400, adopted: 441, ward: 483, incapable: 524 }[values.childKind];
    if (childMark) cross(now, 70, childMark - 2, 84, childMark + 12);
    lines(now, font, [values.cFio, values.cPrevious].filter(Boolean).join(", "), [[778.4, 60, 560]], 10);
    lines(now, font, values.cBirth, [[822.8, 266, 560]], 10);
  }

  if (values.withChild === "yes") {
    const child = pages[5];
    lines(child, font, values.cSex === "m" ? "мужской" : values.cSex === "f" ? "женский" : "", [[148, 100, 270]], 11);
    lines(child, font, values.cCitizenship, [[204, 60, 560, 10], [222, 60, 560, 10]], 10);
    lines(child, font, values.cAddress, [[253.3, 172, 560], [281.3, 60, 560]], 10);
    lines(child, font, values.cBirthDoc, [[314.2, 218, 560], [340, 60, 560, 10]], 10);
    lines(child, font, values.cId, [[397, 60, 560, 10], [434, 60, 560, 10]], 10);
    lines(child, font, values.cAdopt, [[466, 60, 560, 10], [497.1, 60, 560]], 10);
    lines(child, font, values.parent2, [[548, 300, 560, 10], [575.8, 60, 560], [598.3, 270, 560]], 10);
  }

  return { bytes: await pdf.save(), fileName: "zayavlenie-o-prieme-v-grazhdanstvo.pdf" };
}
