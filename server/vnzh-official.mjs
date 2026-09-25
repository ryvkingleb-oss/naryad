import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const INK = rgb(0.05, 0.05, 0.05);
const PAGE_H = 2339;
const PX = 72 / 200;
const BLANK = path.resolve("server/blanks/vnzh-blank.pdf");

const GROUND_BOX = {
  "rvp-year": [258, 1026, 22, 20],
  rsfsr: [258, 1056, 22, 20],
  relative: [258, 1090, 22, 20],
  native: [258, 1126, 22, 20],
  crimea: [258, 1154, 22, 20],
  hqs: [258, 1184, 22, 20],
  work: [258, 1220, 22, 20],
  honors: [258, 1270, 22, 20],
  stopped: [258, 1314, 22, 20],
  cancelled: [258, 1350, 22, 20],
  art411: [258, 1386, 22, 20],
  belarus: [258, 1416, 22, 20],
};

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function dateText(value) {
  const raw = text(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : raw;
}

function rows(value) {
  return Array.isArray(value) ? value.filter((item) => item && Object.values(item).some((cell) => text(cell))) : [];
}

function splitName(value) {
  const parts = text(value).split(" ").filter(Boolean);
  return {
    last: parts[0] || "",
    first: parts[1] || "",
    middle: parts.slice(2).join(" "),
  };
}

export async function renderOfficialVnzh(values) {
  const pdf = await PDFDocument.load(fs.readFileSync(BLANK));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fs.readFileSync(path.resolve("public/fonts/LiberationSans-Regular.ttf")), { subset: true });
  const pages = pdf.getPages();

  const draw = (pageIndex, content, lineY, xPx, maxXPx, size = 10) => {
    const value = text(content);
    if (!value) return;
    const page = pages[pageIndex];
    const maxWidth = (maxXPx - xPx) * PX;
    let fontSize = size;
    while (fontSize > 7 && font.widthOfTextAtSize(value, fontSize) > maxWidth) fontSize -= 0.5;
    let shown = value;
    while (shown.length > 1 && font.widthOfTextAtSize(shown, fontSize) > maxWidth) shown = shown.slice(0, -1);
    page.drawText(shown, {
      x: xPx * PX,
      y: (PAGE_H - (lineY - 3)) * PX,
      size: fontSize,
      font,
      color: INK,
    });
  };

  const cross = (pageIndex, x, y, w, h) => {
    const page = pages[pageIndex];
    const left = (x + 4) * PX;
    const right = (x + w - 4) * PX;
    const top = (PAGE_H - (y + 4)) * PX;
    const bottom = (PAGE_H - (y + h - 4)) * PX;
    page.drawLine({ start: { x: left, y: top }, end: { x: right, y: bottom }, thickness: 1.1, color: INK });
    page.drawLine({ start: { x: left, y: bottom }, end: { x: right, y: top }, thickness: 1.1, color: INK });
  };

  const box = GROUND_BOX[values.ground];
  if (box) cross(0, ...box);

  draw(0, values.lastName, 1572, 420, 1470);
  draw(0, values.lastNameLat, 1616, 420, 1470);
  draw(0, values.firstName, 1659, 450, 1470);
  draw(0, values.firstNameLat, 1703, 450, 1470);
  draw(0, [...new Set([text(values.middleName), text(values.middleNameLat)].filter(Boolean))].join(" / "), 1746, 470, 1470);
  if (values.hadPrevious === "yes") cross(0, 769, 1755, 27, 22);
  if (values.hadPrevious === "no") cross(0, 838, 1755, 27, 22);
  draw(0, values.prevLast, 1828, 370, 1470);
  draw(0, values.prevFirst, 1872, 330, 1470);
  draw(0, values.prevMiddle, 1915, 430, 1470);
  draw(0, values.prevReason, 1959, 400, 1100);
  draw(0, values.prevDate, 1959, 1300, 1470);
  draw(0, dateText(values.birthDate), 2046, 450, 640);
  draw(0, values.birthCountry, 2046, 800, 1470);
  draw(0, values.birthPlace, 2133, 380, 1470);

  draw(1, values.citizenship, 298, 400, 1470);
  draw(1, values.citBasis, 353, 420, 1080);
  draw(1, values.citPlace, 353, 1290, 1470);
  draw(1, values.citDate, 407, 420, 1470);
  if (values.stateless === "yes") cross(1, 249, 421, 27, 28);
  draw(1, values.lossBasis, 462, 730, 1470);
  draw(1, values.lossPlace, 516, 350, 1100);
  draw(1, values.lossDate, 516, 1280, 1470);
  if (values.sex === "m") cross(1, 355, 532, 26, 24);
  if (values.sex === "f") cross(1, 492, 532, 26, 24);
  draw(1, values.docSeries, 625, 340, 540);
  draw(1, values.docNumber, 625, 660, 1140);
  draw(1, dateText(values.docIssued), 625, 1290, 1470);
  draw(1, values.docWho, 734, 370, 1470);
  const marital = { married: [557, 748], single: [787, 748], widowed: [1064, 748], divorced: [1280, 748] };
  if (marital[values.marital]) cross(1, ...marital[values.marital], 26, 28);
  draw(1, values.marryDoc, 843, 660, 1140);
  draw(1, values.marryDate, 843, 1290, 1470);
  draw(1, values.marryPlace, 898, 360, 1470);

  const general = { pre: [269, 1797], primary: [269, 1821], basic: [269, 1869], secondary: [269, 1903] };
  const professional = { vocational: [796, 1761], bachelor: [796, 1797], specialist: [796, 1822], postgrad: [796, 1869] };
  const degree = { candidate: [1071, 1903], doctor: [1278, 1903] };
  if (general[values.eduGeneral]) cross(1, ...general[values.eduGeneral], 26, 24);
  if (professional[values.eduProf]) cross(1, ...professional[values.eduProf], 26, 24);
  if (degree[values.degree]) cross(1, ...degree[values.degree], 26, 24);
  draw(1, values.hqsSeries, 2042, 340, 450);
  draw(1, values.hqsNumber, 2042, 560, 770);
  draw(1, values.hqsIssued, 2042, 900, 1070);
  draw(1, values.hqsUntil, 2042, 1300, 1470);

  const income = [
    [353, values.inc1],
    [407, values.inc2],
    [461, values.inc3],
    [516, values.inc4],
    [570, values.inc5],
    [679, values.inc6],
  ];
  for (const [line, amount] of income) draw(2, amount, line, 640, 1470);
  draw(2, values.inc5note, 625, 420, 1470);
  draw(2, values.inc6note, 734, 420, 1470);
  if (values.conviction === "yes") cross(2, 1291, 754, 28, 28);
  if (values.conviction === "no") cross(2, 1383, 754, 28, 28);
  draw(2, values.convWhere, 856, 410, 1470);
  draw(2, values.convWhen, 911, 440, 650);
  draw(2, values.convTerm, 911, 840, 1080);
  draw(2, values.convServed, 911, 1250, 1470);
  draw(2, values.postIndex, 965, 820, 1470);
  draw(2, values.addrRegion, 1020, 360, 1470);
  draw(2, values.addrDistrict, 1074, 340, 1470);
  draw(2, values.addrPlace, 1129, 340, 1470);
  draw(2, values.addrStreet, 1183, 340, 1470);
  draw(2, values.addrHouse, 1238, 320, 560);
  draw(2, values.addrBlock, 1238, 660, 820);
  draw(2, values.addrBuild, 1238, 950, 1180);
  draw(2, values.addrFlat, 1238, 1310, 1470);
  draw(2, values.phone, 1292, 360, 800);
  draw(2, values.email, 1292, 1050, 1470);
  draw(2, values.attachments, 1347, 880, 1470);

  const relatives = rows(values.relatives);
  if (relatives.length) draw(1, "5", 952, 1400, 1470);
  relatives.slice(0, 2).forEach((person, index) => {
    const shift = index * 653;
    const name = splitName(person.fio);
    draw(4, person.relation, 603 + shift, 400, 900);
    draw(4, person.birth, 603 + shift, 1000, 1470);
    draw(4, name.last, 657 + shift, 370, 1470);
    draw(4, name.first, 712 + shift, 330, 1470);
    draw(4, name.middle, 766 + shift, 430, 1470);
    draw(4, person.citizenship, 821 + shift, 420, 1470);
    draw(4, person.address, 930 + shift, 400, 1470);
    draw(4, person.work, 1202 + shift, 400, 1470);
  });

  const jobs = rows(values.jobs);
  if (jobs.length) draw(1, "6", 1721, 1400, 1470);
  jobs.slice(0, 7).forEach((job, index) => {
    const line = 896 + index * 156;
    draw(5, job.from, line, 250, 540);
    draw(5, job.to, line, 560, 850);
    draw(5, job.role, line, 870, 1160);
    draw(5, job.address, line, 1180, 1470);
  });

  pdf.setTitle("Заявление о выдаче вида на жительство");
  return { bytes: await pdf.save(), fileName: "zayavlenie-o-vnzh.pdf" };
}
