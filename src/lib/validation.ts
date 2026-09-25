import type { Field, FieldGroup, FormStep, FormValues, ShowIf } from "../types";

export function scalar(values: FormValues, id: string): string {
  const value = values[id];
  return typeof value === "string" ? value : "";
}

export function rows(values: FormValues, id: string): Record<string, string>[] {
  const value = values[id];
  return Array.isArray(value) ? value : [];
}

export function isShown(showIf: ShowIf | undefined, values: FormValues): boolean {
  if (!showIf) return true;
  return scalar(values, showIf.field) === showIf.equals;
}

export function visibleFields(group: FieldGroup, values: FormValues): Field[] {
  if (!isShown(group.showIf, values)) return [];
  return group.fields.filter((field) => isShown(field.showIf, values));
}

export function stepErrors(step: FormStep, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const group of step.groups) {
    if (!isShown(group.showIf, values)) continue;
    if (group.repeatable) {
      const list = rows(values, group.id);
      list.forEach((row, index) => {
        for (const field of group.fields) {
          if (!field.required) continue;
          const cell = (row[field.id] ?? "").trim();
          if (!cell) errors[`${group.id}.${index}.${field.id}`] = "Заполните это поле";
        }
      });
      continue;
    }
    for (const field of visibleFields(group, values)) {
      if (!field.required) continue;
      const cell = scalar(values, field.id).trim();
      if (!cell) errors[field.id] = "Заполните это поле";
    }
  }
  return errors;
}

export function procedureErrors(steps: FormStep[], values: FormValues): Record<string, string> {
  return steps.reduce<Record<string, string>>((all, step) => {
    return { ...all, ...stepErrors(step, values) };
  }, {});
}

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function displayValue(field: Field, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (field.type === "checkbox") return value === "yes" ? "Да" : value;
  if (field.type === "date") return formatDate(value);
  if (field.type === "select" || field.type === "radio") {
    return field.options?.find((option) => option.value === value)?.label ?? value;
  }
  return value;
}
