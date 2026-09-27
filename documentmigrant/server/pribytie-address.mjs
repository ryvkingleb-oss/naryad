/** Разбор телефона, места рождения и адреса для бланка прибытия (приказ № 856 в ред. № 628). */

export function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function isBlankMark(value) {
  return /^(нет|нет\.|отсутствует|-|—|–)$/i.test(clean(value));
}

/**
 * Национальный номер из 10 цифр. Бланк уже печатает «+7», поэтому
 * «+7», «8» и повтор «+7 +79…» в ответе пользователя сюда не попадают.
 */
export function phoneNational(value) {
  if (isBlankMark(value)) return "";
  let digits = clean(value).replace(/\D/g, "");
  while (digits.length > 10 && (digits.startsWith("7") || digits.startsWith("8"))) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) digits = digits.slice(0, 10);
  return digits;
}

const COUNTRIES = [
  "россия", "рф", "узбекистан", "таджикистан", "киргизия", "кыргызстан", "казахстан",
  "армения", "азербайджан", "беларусь", "белоруссия", "украина", "молдова", "молдавия",
  "грузия", "туркменистан", "туркмения", "китай", "индия", "вьетнам", "турция", "иран",
  "афганистан", "сирия", "египет", "израиль", "германия", "франция", "италия", "испания",
  "сша", "америка", "польша", "латвия", "литва", "эстония", "абхазия", "монголия",
  "корея", "япония", "пакистан", "бангладеш", "непал", "куба", "сербия", "финляндия",
  "швеция", "норвегия", "великобритания", "англия", "камерун", "нигерия", "эфиопия",
];

const FEDERAL_CITIES = ["москва", "санкт-петербург", "санкт петербург", "петербург", "севастополь"];

function norm(value) {
  return clean(value).toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/\./g, "").trim();
}

function looksLikeCityToken(value) {
  return /^(г|город|гор|пгт|п|пос|поселок|посёлок|село|с|деревня|дер|аул|кишлак|станица)\b/i.test(clean(value));
}

export function looksLikeCountry(value) {
  const raw = clean(value);
  if (!raw || looksLikeCityToken(raw)) return false;
  const key = norm(raw).replace(/^республика\s+/, "").replace(/^государство\s+/, "");
  if (COUNTRIES.includes(key)) return true;
  if (/республик|королевств|государств/.test(key) && !/область|край|район|округ/.test(key)) return true;
  if (/(ия|стан)$/.test(key) && key.length > 4 && !/область|улиц|проспект|район/.test(key)) return true;
  return false;
}

function stripCityPrefix(value) {
  return clean(value).replace(/^(г|город|гор|пгт|п|пос|поселок|посёлок|село|деревня|дер|аул|кишлак|станица)\.?\s+/i, "");
}

/** Государство — верхняя строка бланка, город — нижняя, независимо от порядка в ответе. */
export function splitBirthPlace(value) {
  const raw = clean(value);
  if (!raw || isBlankMark(raw)) return { country: "", city: "" };
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 1) {
    if (looksLikeCountry(parts[0]) && !looksLikeCityToken(parts[0])) return { country: parts[0], city: "" };
    return { country: "", city: stripCityPrefix(parts[0]) };
  }
  const countryIndex = parts.findIndex((part) => looksLikeCountry(part));
  if (countryIndex >= 0) {
    const country = parts[countryIndex];
    const city = parts.filter((_, index) => index !== countryIndex).map(stripCityPrefix).filter(Boolean).join(", ");
    return { country, city };
  }
  if (looksLikeCityToken(parts[0])) {
    return { country: parts.slice(1).join(", "), city: stripCityPrefix(parts[0]) };
  }
  return { country: parts[0], city: parts.slice(1).map(stripCityPrefix).join(", ") };
}

function take(text, pattern) {
  const match = text.match(pattern);
  if (!match) return { text, value: "" };
  return {
    text: clean(text.replace(match[0], " ")),
    value: clean(match[1] || match[0]),
  };
}

function expandStreet(value) {
  let text = clean(value);
  const rules = [
    [/^ул\.?\s+/i, "улица "],
    [/^(пр-кт|пр-т|просп)\.?\s+/i, "проспект "],
    [/^пер\.?\s+/i, "переулок "],
    [/^ш\.?\s+/i, "шоссе "],
    [/^наб\.?\s+/i, "набережная "],
    [/^б-р\.?\s+/i, "бульвар "],
    [/^пр-д\.?\s+/i, "проезд "],
    [/^обл\.?\s*$/i, "область"],
  ];
  for (const [pattern, replacement] of rules) text = text.replace(pattern, replacement);
  return clean(text);
}

function expandRegion(value) {
  return clean(value)
    .replace(/\bобл\.?\b/i, "область")
    .replace(/\bресп\.?\b/i, "республика")
    .replace(/^г\.?\s+/i, "");
}

function isFederalCity(value) {
  const key = norm(stripCityPrefix(value));
  return FEDERAL_CITIES.includes(key);
}

function classifyChunk(part) {
  const text = clean(part);
  if (!text) return null;
  if (/область|край|республик|автономн/i.test(text) && !/район|поселен/i.test(text)) return ["region", expandRegion(text)];
  if (isFederalCity(text) && !/улиц|проспект|шоссе|переул|дом|кварт/i.test(text)) return ["region", expandRegion(stripCityPrefix(text))];
  if (/район|поселен|городск\w*\s+округ|муниципальн\w*\s+округ|сельск\w*\s+поселен/i.test(text)) return ["settlement", text];
  if (looksLikeCityToken(text) || /^город\b/i.test(text)) return ["city", stripCityPrefix(text)];
  if (/улиц|ул\.|проспект|пр-кт|пр-т|переул|пер\.|шоссе|наб\.|бульвар|проезд|аллея|тупик|тракт|микрорайон|мкр/i.test(text)) {
    return ["street", expandStreet(text)];
  }
  return ["rest", text];
}

export function emptyAddress() {
  return {
    region: "",
    settlement: "",
    city: "",
    street: "",
    house: "",
    corpus: "",
    building: "",
    flat: "",
    room: "",
    ownership: "",
  };
}

/** Регион, город, улица, дом и квартира — в разные строки бланка, а не одной лентой в «область». */
export function parseRussianAddress(value) {
  const result = emptyAddress();
  let text = clean(value);
  if (!text || isBlankMark(text)) return result;

  const grabs = [
    ["house", /(?:^|[,\s])(?:д|дом)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["corpus", /(?:^|[,\s])(?:корп|корпус)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["building", /(?:^|[,\s])(?:стр|строение)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["flat", /(?:^|[,\s])(?:кв|квартира)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["room", /(?:^|[,\s])(?:комн|комната)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["ownership", /(?:^|[,\s])(?:вл|владение)\.?\s*(\d[\dа-яa-z/-]*)/i],
    ["room", /(?:^|[,\s])(?:пом|помещение|офис|оф)\.?\s*(\d[\dа-яa-z/-]*)/i],
  ];
  for (const [key, pattern] of grabs) {
    const found = take(text, pattern);
    text = found.text.replace(/^[,\s]+|[,\s]+$/g, "");
    if (found.value && !result[key]) result[key] = found.value;
  }

  const parts = text.split(/,+/).map((part) => clean(part)).filter((part) => part && !/^[,.\s]+$/.test(part));
  const rest = [];
  for (const part of parts) {
    const classified = classifyChunk(part);
    if (!classified) continue;
    const [slot, content] = classified;
    if (slot === "rest") rest.push(content);
    else if (!result[slot]) result[slot] = content;
    else result[slot] = `${result[slot]}, ${content}`;
  }
  for (const part of rest) {
    if (!result.region && /область|край|республик|москва|петербург|севастополь/i.test(part)) {
      result.region = expandRegion(part);
    } else if (!result.city && !/улиц|проспект|шоссе|дом|кварт/i.test(part)) {
      result.city = stripCityPrefix(part);
    } else if (!result.street) result.street = expandStreet(part);
    else if (!result.region) result.region = part;
  }
  if (result.ownership && !result.corpus) result.corpus = result.ownership;
  else if (result.ownership && result.house) result.house = `${result.house}, вл. ${result.ownership}`;
  return result;
}

export function addressFromValues(values, textKey, prefix) {
  const parsed = parseRussianAddress(values?.[textKey]);
  const override = (suffix, slot) => {
    const explicit = clean(values?.[`${prefix}${suffix}`]);
    return explicit && !isBlankMark(explicit) ? explicit : parsed[slot];
  };
  return {
    ...parsed,
    region: override("Region", "region"),
    city: override("City", "city"),
    street: override("Street", "street"),
    house: override("House", "house"),
    flat: override("Flat", "flat"),
    corpus: override("Corpus", "corpus") || parsed.corpus,
  };
}
