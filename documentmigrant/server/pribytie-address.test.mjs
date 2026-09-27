import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { addressFromValues, parseRussianAddress, phoneNational, splitBirthPlace } from "./pribytie-address.mjs";
import { renderOfficialArrival } from "./pribytie-official.mjs";

test("phone drops a repeated +7 before the printed prefix", () => {
  assert.equal(phoneNational("+79211234567"), "9211234567");
  assert.equal(phoneNational("+7 +79211234567"), "9211234567");
  assert.equal(phoneNational("+7 (921) 123-45-67"), "9211234567");
  assert.equal(phoneNational("8 921 123 45 67"), "9211234567");
  assert.equal(phoneNational("9211234567"), "9211234567");
  assert.equal(phoneNational("нет"), "");
});

test("birth place keeps country above city regardless of input order", () => {
  assert.deepEqual(splitBirthPlace("г. Ташкент, Узбекистан"), { country: "Узбекистан", city: "Ташкент" });
  assert.deepEqual(splitBirthPlace("Узбекистан, г. Ташкент"), { country: "Узбекистан", city: "Ташкент" });
  assert.deepEqual(splitBirthPlace("Россия, Москва"), { country: "Россия", city: "Москва" });
  assert.deepEqual(splitBirthPlace("Москва"), { country: "", city: "Москва" });
  assert.deepEqual(splitBirthPlace("Республика Узбекистан, город Самарканд"), { country: "Республика Узбекистан", city: "Самарканд" });
});

test("address is split into region, city, street, house and flat", () => {
  const parts = parseRussianAddress("Московская область, г. Красногорск, ул. Ленина, д. 5, корп. 12, кв. 6");
  assert.equal(parts.region, "Московская область");
  assert.equal(parts.city, "Красногорск");
  assert.equal(parts.street, "улица Ленина");
  assert.equal(parts.house, "5");
  assert.equal(parts.corpus, "12");
  assert.equal(parts.flat, "6");
  assert.equal(parts.region.includes("Ленина"), false);
});

test("federal city is the region row, not the whole string", () => {
  const parts = parseRussianAddress("г. Санкт-Петербург, Невский проспект, д. 28, кв. 15");
  assert.equal(parts.region, "Санкт-Петербург");
  assert.equal(parts.street, "Невский проспект");
  assert.equal(parts.house, "28");
  assert.equal(parts.flat, "15");
  assert.equal(parts.city, "");
});

test("structured fields override the free-text address", () => {
  const parts = addressFromValues({
    address: "Московская область, г. Красногорск, ул. Ленина, д. 5, кв. 6",
    addressCity: "Одинцово",
    addressFlat: "8",
  }, "address", "address");
  assert.equal(parts.region, "Московская область");
  assert.equal(parts.city, "Одинцово");
  assert.equal(parts.flat, "8");
  assert.equal(parts.house, "5");
});

test("нет is not an address", () => {
  const parts = parseRussianAddress("нет");
  assert.equal(parts.region, "");
  assert.equal(parts.street, "");
});

test("arrival blank and filled file are the 4-page edition", async () => {
  const blank = await PDFDocument.load(fs.readFileSync("server/blanks/pribytie-blank.pdf"));
  assert.equal(blank.getPageCount(), 4);
  const { bytes } = await renderOfficialArrival({
    lastName: "Иванов",
    firstName: "Иван",
    citizenship: "Узбекистан",
    birthDate: "1990-05-12",
    sex: "m",
    birthPlace: "г. Ташкент, Узбекистан",
    foreignPhone: "+7 +79211234567",
    address: "Московская область, г. Красногорск, ул. Ленина, д. 5, корп. 12, кв. 6",
    hostKind: "person",
    hostPhone: "+79217654321",
  });
  const filled = await PDFDocument.load(bytes);
  assert.equal(filled.getPageCount(), 4);
});
