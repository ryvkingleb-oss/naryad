import type { Draft, FormValues } from "../types";

const keyFor = (procedureId: string) => `naryad:draft:${procedureId}`;

export function loadDraft(procedureId: string): Draft | null {
  try {
    const raw = localStorage.getItem(keyFor(procedureId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== "object" || !parsed.values || typeof parsed.values !== "object") {
      return null;
    }
    return {
      values: parsed.values,
      step: Number.isFinite(parsed.step) ? parsed.step : 0,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveDraft(procedureId: string, values: FormValues, step: number): Draft {
  const draft: Draft = {
    values,
    step,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(keyFor(procedureId), JSON.stringify(draft));
  return draft;
}

export function clearDraft(procedureId: string) {
  localStorage.removeItem(keyFor(procedureId));
}

export function draftIsEmpty(values: FormValues): boolean {
  return !Object.values(values).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value.some((row) => Object.values(row).some((cell) => cell.trim().length > 0));
  });
}
