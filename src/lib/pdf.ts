import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Procedure, FormValues } from "../types";
import { displayValue, isShown, rows, scalar } from "./validation";

const DISCLAIMER =
  "Черновик для сверки. Это не бланк государственного органа и не портал МВД. Перед подачей сверьте файл с действующим официальным бланком. Подпись поставьте от руки. Печати, герб и чужие подписи здесь не ставятся.";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.32, 0.3, 0.27);
const RULE = rgb(0.72, 0.68, 0.6);
const WARN = rgb(0.42, 0.24, 0.08);

async function loadFont(pdf: PDFDocument, file: string): Promise<PDFFont> {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
  if (!response.ok) throw new Error("font");
  const bytes = await response.arrayBuffer();
  return pdf.embedFont(bytes, { subset: true });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        line = trial;
        continue;
      }
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = "";
      for (const char of word) {
        if (font.widthOfTextAtSize(chunk + char, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function buildDraftPdf(procedure: Procedure, values: FormValues): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(procedure.pdf.draftTitle);
  pdf.setAuthor("Наряд — черновик заявителя");
  pdf.setSubject(procedure.pdf.formReference);
  const font = await loadFont(pdf, "LiberationSans-Regular.ttf");
  const bold = await loadFont(pdf, "LiberationSans-Bold.ttf");

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const width = PAGE_WIDTH - MARGIN * 2;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawLines(procedure.shortTitle, bold, 9, MUTED);
    y -= 8;
    rule();
    y -= 12;
  };

  const ensure = (height: number) => {
    if (y - height < 48) newPage();
  };

  const drawLines = (text: string, face: PDFFont, size: number, color = INK, gap = 3) => {
    const lines = wrap(text, face, size, width);
    for (const line of lines) {
      ensure(size + gap);
      page.drawText(line, { x: MARGIN, y: y - size, size, font: face, color });
      y -= size + gap;
    }
  };

  const rule = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.6,
      color: RULE,
    });
  };

  drawLines("ЧЕРНОВИК. НЕ ЯВЛЯЕТСЯ ДОКУМЕНТОМ ОРГАНА", bold, 11, WARN, 4);
  drawLines(DISCLAIMER, font, 9, MUTED, 2);
  y -= 8;
  rule();
  y -= 16;
  drawLines(procedure.pdf.draftTitle, bold, 13, INK, 4);
  drawLines(procedure.pdf.formReference, font, 9, MUTED, 3);
  drawLines(`Дата сверки требований в сервисе: ${formatChecked(procedure.checkedOn)}. Файл собран ${formatNow()}.`, font, 9, MUTED, 3);
  y -= 8;

  if (procedure.pdf.photoCaption) {
    ensure(78);
    page.drawRectangle({
      x: PAGE_WIDTH - MARGIN - 90,
      y: y - 68,
      width: 90,
      height: 68,
      borderColor: RULE,
      borderWidth: 0.8,
    });
    const caption = wrap(procedure.pdf.photoCaption, font, 7, 80);
    caption.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE_WIDTH - MARGIN - 86,
        y: y - 16 - index * 9,
        size: 7,
        font,
        color: MUTED,
      });
    });
    y -= 4;
  }

  for (const step of procedure.steps) {
    y -= 8;
    ensure(28);
    drawLines(step.title, bold, 12, INK, 4);
    rule();
    y -= 10;
    for (const group of step.groups) {
      if (!isShown(group.showIf, values)) continue;
      if (group.title) {
        y -= 2;
        drawLines(group.title, bold, 10, INK, 3);
      }
      if (group.repeatable) {
        const list = rows(values, group.id).filter((row) =>
          Object.values(row).some((cell) => cell.trim()),
        );
        if (list.length === 0) {
          drawLines("нет", font, 10, INK, 3);
          continue;
        }
        list.forEach((row, index) => {
          drawLines(`${index + 1}.`, bold, 10, INK, 2);
          for (const field of group.fields) {
            const shown = displayValue(field, row[field.id] ?? "");
            drawLines(`${field.label}: ${shown || "нет"}`, font, 10, INK, 2);
          }
          y -= 4;
        });
        continue;
      }
      for (const field of group.fields) {
        if (!isShown(field.showIf, values)) continue;
        const shown = displayValue(field, scalar(values, field.id));
        drawLines(`${field.label}: ${shown || "нет"}`, font, 10, INK, 2);
      }
    }
  }

  y -= 12;
  ensure(90);
  drawLines(procedure.pdf.authorityNote, font, 9, MUTED, 3);
  y -= 8;
  for (const line of procedure.pdf.closingLines) {
    drawLines(line, font, 9, INK, 3);
  }
  y -= 16;
  ensure(36);
  drawLines(procedure.pdf.signatureCaption, font, 10, INK, 4);
  ensure(18);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + 220, y },
    thickness: 0.8,
    color: INK,
  });
  y -= 14;
  drawLines("Дата: «____» ________________ 20____ г.", font, 10, INK, 3);

  const pages = pdf.getPages();
  pages.forEach((item: PDFPage, index) => {
    item.drawText(`${index + 1} / ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN - 36,
      y: 28,
      size: 8,
      font,
      color: MUTED,
    });
    item.drawText("Сверьте с официальным бланком перед подачей", {
      x: MARGIN,
      y: 28,
      size: 8,
      font,
      color: MUTED,
    });
  });

  return pdf.save();
}

function formatChecked(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}

function formatNow(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${now.getFullYear()}`;
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
