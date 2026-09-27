import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { addressFromValues, clean, emptyAddress, isBlankMark, phoneNational, splitBirthPlace } from "./pribytie-address.mjs";

const INK = rgb(0.05, 0.05, 0.05);
const FONT = path.resolve("public/fonts/LiberationSans-Regular.ttf");
const COORDS = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "pribytie-coords.json"), "utf8"),
);

function xs(page, top) {
  const rows = COORDS[String(page)];
  const key = Object.keys(rows).find((item) => Math.abs(Number(item) - top) < 0.051);
  if (!key) throw new Error(`Нет клеток бланка: страница ${page}, y=${top}`);
  return rows[key];
}

const PLACE_KIND = [132.7, 233.2, 337.3];
const HOST_KIND = [418.4, 507.7];

function cells(page, font, value, top, columns, upper = true) {
  let raw = clean(value);
  if (!raw || isBlankMark(raw) || !columns?.length) return;
  if (upper) raw = raw.toLocaleUpperCase("ru-RU");
  const bottom = top + 11.2;
  let index = 0;
  for (const ch of raw) {
    if (ch === " ") {
      index += 1;
      continue;
    }
    if (index >= columns.length) break;
    page.drawText(ch, {
      x: columns[index] + 1.6,
      y: page.getHeight() - (bottom - 2.2),
      size: 8.2,
      font,
      color: INK,
    });
    index += 1;
  }
}

function flowCells(page, font, value, rows) {
  let raw = clean(value).toLocaleUpperCase("ru-RU");
  for (const [top, columns] of rows) {
    if (!raw) return;
    const taken = Math.min(raw.length, columns.length);
    cells(page, font, raw.slice(0, taken), top, columns, false);
    raw = raw.slice(taken).trimStart();
  }
}

function dateParts(value) {
  const raw = clean(value);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const text = iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : raw;
  const match = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return match ? [match[1], match[2], match[3]] : null;
}

function writeDate(page, font, value, top, groups) {
  const parts = dateParts(value);
  if (!parts) return;
  parts.forEach((part, index) => cells(page, font, part, top, groups[index], false));
}

function cross(page, x0, y0, x1, y1) {
  const height = page.getHeight();
  page.drawLine({ start: { x: x0 + 1.4, y: height - y0 - 1.4 }, end: { x: x1 - 1.4, y: height - y1 + 1.4 }, thickness: 1, color: INK });
  page.drawLine({ start: { x: x0 + 1.4, y: height - y1 + 1.4 }, end: { x: x1 - 1.4, y: height - y0 - 1.4 }, thickness: 1, color: INK });
}

function tick(page, x, y) {
  cross(page, x, y, x + 11.2, y + 12.4);
}

function fitLine(page, font, value, y, x, maxX, size = 8) {
  const content = clean(value);
  if (!content) return;
  const width = maxX - x;
  let cut = content.length;
  while (cut > 1 && font.widthOfTextAtSize(content.slice(0, cut), size) > width) cut -= 1;
  page.drawText(content.slice(0, cut).trim().toLocaleUpperCase("ru-RU"), {
    x,
    y: page.getHeight() - (y - 2),
    size,
    font,
    color: INK,
  });
}

function splitGap(columns, gapAfter) {
  const left = columns.filter((x) => x <= gapAfter);
  const right = columns.filter((x) => x > gapAfter + 8);
  return [left, right];
}

function addressBoxes(parts) {
  return {
    house: parts.house ? `дом ${parts.house}` : "",
    corpus: parts.corpus ? `корп. ${parts.corpus}` : "",
    building: parts.building ? `стр. ${parts.building}` : "",
    flat: parts.flat ? `кв. ${parts.flat}` : "",
    room: parts.room ? `пом. ${parts.room}` : "",
  };
}

function writeAddress(page, font, parts, rowTops, pageNo, boxes) {
  const [region, settlement, city, street] = rowTops;
  cells(page, font, parts.region, region, xs(pageNo, region));
  cells(page, font, parts.settlement, settlement, xs(pageNo, settlement));
  cells(page, font, parts.city, city, xs(pageNo, city));
  cells(page, font, parts.street, street, xs(pageNo, street));
  const drawn = addressBoxes(parts);
  const slots = [
    [boxes.house, drawn.house],
    [boxes.corpus, drawn.corpus],
    [boxes.building, drawn.building],
    [boxes.flat, drawn.flat],
    [boxes.room, drawn.room],
  ];
  for (const [slot, text] of slots) {
    if (!slot || !text) continue;
    fitLine(page, font, text, slot[1] + 10.4, slot[0] + 3, slot[2] - 3, 8);
  }
}

function writePhone(page, font, value, top, columns) {
  const digits = phoneNational(value);
  if (!digits) return;
  cells(page, font, digits, top, columns, false);
}

function fio(value) {
  const parts = clean(value).split(" ").filter(Boolean);
  return [parts[0] || "", parts[1] || "", parts.slice(2).join(" ")];
}

export async function renderOfficialArrival(values) {
  const pdf = await PDFDocument.load(fs.readFileSync(path.resolve("server/blanks/pribytie-blank.pdf")));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fs.readFileSync(FONT), { subset: true });
  const pages = pdf.getPages();
  const page = pages[0];
  const back = pages[1];
  const host = pages[2];
  const slip = pages[3];

  cells(page, font, values.lastName, 147.4, xs(1, 147.4));
  cells(page, font, values.lastNameLat, 162.7, xs(1, 162.7));
  cells(page, font, values.firstName, 178.1, xs(1, 178.1));
  cells(page, font, values.firstNameLat, 193.4, xs(1, 193.4));
  cells(page, font, values.middleName, 208.8, xs(1, 208.8));
  cells(page, font, values.middleNameLat, 225, xs(1, 225));
  cells(page, font, values.citizenship, 245.3, xs(1, 245.3));

  const birthDate = xs(1, 262);
  writeDate(page, font, values.birthDate, 262, [birthDate.slice(0, 2), birthDate.slice(2, 4), birthDate.slice(4, 8)]);
  if (values.sex === "m") tick(page, birthDate[8], 262);
  if (values.sex === "f") tick(page, birthDate[9], 262);

  const birth = splitBirthPlace(values.birthPlace);
  cells(page, font, birth.country, 277.3, xs(1, 277.3));
  cells(page, font, birth.city, 299, xs(1, 299));

  cells(page, font, values.docType, 344.5, xs(1, 344.5));
  const [docSeries, docNumber] = splitGap(xs(1, 361.3), 165.5);
  cells(page, font, values.docSeries, 361.3, docSeries, false);
  cells(page, font, values.docNumber, 361.3, docNumber, false);
  const issued = dateParts(values.docIssued);
  const docDates = xs(1, 386.3);
  if (issued) writeDate(page, font, issued.join("."), 386.3, [docDates.slice(0, 2), docDates.slice(2, 4), docDates.slice(4, 8)]);
  writeDate(page, font, values.docUntil, 386.3, [docDates.slice(8, 10), docDates.slice(10, 12), docDates.slice(12, 16)]);

  const stay = clean(values.extraDoc).toLocaleLowerCase("ru-RU");
  const visa = xs(1, 534.5);
  if (stay.includes("виза")) tick(page, visa[0], 534.5);
  else if (stay.includes("жительств")) tick(page, visa[1], 534.5);
  else if (stay.includes("образован")) tick(page, visa[3], 534.5);
  else if (stay.includes("временн") || stay.includes("рвп")) tick(page, visa[2], 534.5);
  if (stay && !isBlankMark(stay)) {
    const [staySeries, stayNumber] = splitGap(xs(1, 566.8), 165.5);
    const seriesMatch = stay.match(/(?:серия|сер\.?)\s*([0-9a-zа-я-]+)/i);
    const numberMatch = stay.match(/(?:№|номер|ном\.?)\s*([0-9a-zа-я-]+)/i);
    cells(page, font, seriesMatch?.[1] || "", 566.8, staySeries, false);
    cells(page, font, numberMatch?.[1] || "", 566.8, stayNumber, false);
    const stayDates = xs(1, 591.7);
    const stayIssued = dateParts(stay);
    if (stayIssued) writeDate(page, font, stayIssued.join("."), 591.7, [stayDates.slice(0, 2), stayDates.slice(2, 4), stayDates.slice(4, 8)]);
  }

  const purpose = clean(values.purpose).toLocaleLowerCase("ru-RU");
  const purposeBoxes = xs(1, 614.2);
  const purposeIndex = [
    ["служеб", 0],
    ["туризм", 1],
    ["делов", 2],
    ["учеб", 3],
    ["работ", 4],
    ["част", 5],
    ["транзит", 6],
  ].find(([word]) => purpose.includes(word));
  const humanitarian = xs(1, 629.5).slice(0, 2);
  if (purposeIndex) tick(page, purposeBoxes[purposeIndex[1]], 614.2);
  else if (purpose.includes("гуманитар")) tick(page, humanitarian[0], 629.5);
  else if (purpose && !isBlankMark(purpose)) tick(page, humanitarian[1], 629.5);

  writePhone(page, font, values.foreignPhone, 629.5, xs(1, 629.5).filter((x) => x >= 350));
  cells(page, font, values.profession, 644.9, xs(1, 644.9));
  const trip = xs(1, 669.8);
  writeDate(page, font, values.entryDate, 669.8, [trip.slice(0, 2), trip.slice(2, 4), trip.slice(4, 8)]);
  writeDate(page, font, values.stayUntil, 669.8, [trip.slice(8, 10), trip.slice(10, 12), trip.slice(12, 16)]);
  if (!isBlankMark(values.migrationCard)) {
    const card = clean(values.migrationCard).replace(/\s+/g, "");
    const cardCells = xs(1, 685.2);
    cells(page, font, card.slice(0, 4), 685.2, cardCells.filter((x) => x <= 230), false);
    cells(page, font, card.slice(4), 685.2, cardCells.filter((x) => x >= 250), false);
  }

  if (values.personKind === "child") {
    const rep = [
      values.repLastName,
      values.repFirstName,
      values.repMiddleName,
      values.repRelation,
      values.repDoc,
      values.repAddress,
      phoneNational(values.repPhone),
    ].map(clean).filter((part) => part && !isBlankMark(part)).join(" ");
    flowCells(page, font, rep, [700.6, 715.9, 731.3, 746.6, 762].map((top) => [top, xs(1, top)]));
  }

  const stayAddress = addressFromValues(values, "address", "address");
  const previousAddress = addressFromValues(values, "previousAddress", "previous");
  const hostAddress = addressFromValues(values, "hostAddress", "host");
  const wide = {
    house: [47.2, 163.7, 192.2],
    corpus: [210.8, 163.7, 355.9],
    building: [374.5, 163.7, 504.7],
    flat: [47.2, 185.4, 192.2],
    room: [210.8, 185.4, 355.9],
  };
  writeAddress(back, font, previousAddress, [76.8, 98.5, 120.2, 142], 2, wide);
  writeAddress(back, font, stayAddress, [219.7, 241.4, 263.2, 284.9], 2, {
    house: [47.2, 306.6, 192.2],
    corpus: [210.8, 306.6, 355.9],
    building: [374.5, 306.6, 504.7],
    flat: [47.2, 328.3, 192.2],
    room: [210.8, 328.3, 355.9],
  });
  if (values.hostKind === "org") tick(back, PLACE_KIND[2], 350);
  else if (values.hostKind) tick(back, PLACE_KIND[0], 350);
  if (!isBlankMark(values.cadastral)) cells(back, font, clean(values.cadastral).replace(/\s+/g, ""), 449.4, xs(2, 449.4), false);

  if (values.hostKind === "org") tick(host, HOST_KIND[0], 62.5);
  if (values.hostKind === "person") tick(host, HOST_KIND[1], 62.5);
  const [hostLast, hostFirst, hostMiddle] = fio(values.hostName);
  if (values.hostKind === "org") {
    cells(slip, font, values.hostName, 78.5, xs(4, 78.5));
    cells(slip, font, values.hostName, 447.1, xs(4, 447.1));
  } else {
    cells(host, font, hostLast, 77.9, xs(3, 77.9));
    cells(host, font, hostFirst, 93.2, xs(3, 93.2));
    cells(host, font, hostMiddle, 108.6, xs(3, 108.6));
    cells(slip, font, hostLast, 398.9, xs(4, 398.9));
    cells(slip, font, hostFirst, 415, xs(4, 415));
    cells(slip, font, hostMiddle, 431, xs(4, 431));
  }
  const hostDocDate = dateParts(values.hostDoc);
  const hostDocCells = xs(3, 132.4);
  const docWords = clean(values.hostDoc);
  const hostSeriesMatch = docWords.match(/(?:серия|сер\.?)\s*([0-9a-zа-я-]+)/i) || docWords.match(/\b(\d{4})\b/);
  const hostNumberMatch = docWords.match(/(?:№|номер)\s*([0-9a-zа-я-]+)/i) || docWords.match(/\b(\d{6})\b/);
  const hostKindText = docWords.split(/\d/)[0].replace(/\b(?:выдан|выданного)\b.*$/i, "");
  cells(host, font, hostKindText, 132.4, hostDocCells.filter((x) => x <= 230));
  cells(host, font, hostSeriesMatch?.[1] || "", 132.4, hostDocCells.filter((x) => x >= 260 && x <= 320), false);
  cells(host, font, hostNumberMatch?.[1] || "", 132.4, hostDocCells.filter((x) => x >= 340), false);
  if (hostDocDate) {
    const hostDates = xs(3, 157.3);
    writeDate(host, font, hostDocDate.join("."), 157.3, [hostDates.slice(0, 2), hostDates.slice(2, 4), hostDates.slice(4, 8)]);
  }
  const hostWide = {
    house: [61.3, 277.1, 206.4],
    corpus: [225, 277.1, 370.1],
    building: [388.7, 277.1, 518.9],
    flat: [61.3, 298.8, 206.4],
    room: [225, 298.8, 370.1],
  };
  writeAddress(host, font, hostAddress, [190.2, 211.9, 233.6, 255.4], 3, hostWide);
  writePhone(slip, font, values.hostPhone, 60.4, xs(4, 60.4));
  const inn = clean(values.hostDoc).replace(/\D/g, "").match(/(\d{10}|\d{12})/);
  if (values.hostKind === "org" && inn) {
    cells(slip, font, inn[1], 463.2, xs(4, 463.2).filter((x) => x >= 320), false);
  }
  writeAddress(slip, font, values.hostKind === "org" ? hostAddress : emptyAddress(), [118.2, 139.9, 161.6, 183.4], 4, {
    house: [47.2, 205.1, 192.2],
    corpus: [210.8, 205.1, 355.9],
    building: [374.5, 205.1, 504.7],
    flat: [47.2, 226.8, 192.2],
    room: [210.8, 226.8, 355.9],
  });

  cells(host, font, values.lastName, 340.1, xs(3, 340.1));
  cells(host, font, values.firstName, 355.4, xs(3, 355.4));
  cells(host, font, values.middleName, 370.8, xs(3, 370.8));
  cells(host, font, values.citizenship, 387, xs(3, 387));
  const slipBirth = xs(3, 403.7);
  writeDate(host, font, values.birthDate, 403.7, [slipBirth.slice(0, 2), slipBirth.slice(2, 4), slipBirth.slice(4, 8)]);
  if (values.sex === "m") tick(host, slipBirth[8], 403.7);
  if (values.sex === "f") tick(host, slipBirth[9], 403.7);
  const slipDoc = xs(3, 428.9);
  cells(host, font, values.docType, 428.9, slipDoc.filter((x) => x <= 230));
  cells(host, font, values.docSeries, 428.9, slipDoc.filter((x) => x >= 260 && x <= 350), false);
  cells(host, font, values.docNumber, 428.9, slipDoc.filter((x) => x >= 370), false);
  const slipDates = xs(3, 453.8);
  if (issued) writeDate(host, font, issued.join("."), 453.8, [slipDates.slice(0, 2), slipDates.slice(2, 4), slipDates.slice(4, 8)]);
  writeDate(host, font, values.docUntil, 453.8, [slipDates.slice(8, 10), slipDates.slice(10, 12), slipDates.slice(12, 16)]);
  writeAddress(host, font, stayAddress, [488.6, 510.4, 532.1, 553.8], 3, {
    house: [61.3, 575.5, 206.4],
    corpus: [225, 575.5, 370.1],
    building: [388.7, 575.5, 518.9],
    flat: [61.3, 597.2, 206.4],
    room: [225, 597.2, 370.1],
  });
  if (!isBlankMark(values.cadastral)) cells(host, font, clean(values.cadastral).replace(/\s+/g, ""), 621.8, xs(3, 621.8), false);
  const until = xs(3, 772.3);
  writeDate(host, font, values.stayUntil, 772.3, [until.slice(0, 2), until.slice(2, 4), until.slice(4, 8)]);

  return { bytes: await pdf.save(), fileName: "uvedomlenie-o-pribytii.pdf" };
}
