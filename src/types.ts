export type ChecklistNeed = "always" | "if" | "check";

export interface ChecklistItem {
  id: string;
  title: string;
  what: string;
  who: string;
  exceptions: string;
  need: ChecklistNeed;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Source {
  title: string;
  url: string;
  note: string;
}

export type FieldType = "text" | "textarea" | "date" | "select" | "radio" | "checkbox";

export interface FieldOption {
  value: string;
  label: string;
}

export interface ShowIf {
  field: string;
  equals: string;
}

export interface Field {
  id: string;
  label: string;
  hint?: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  maxLength?: number;
  showIf?: ShowIf;
}

export interface FieldGroup {
  id: string;
  title?: string;
  hint?: string;
  fields: Field[];
  repeatable?: boolean;
  addLabel?: string;
  max?: number;
  showIf?: ShowIf;
}

export interface FormStep {
  id: string;
  title: string;
  lead?: string;
  groups: FieldGroup[];
}

export interface PdfMeta {
  fileName: string;
  draftTitle: string;
  formReference: string;
  photoCaption?: string;
  authorityNote: string;
  signatureCaption: string;
  closingLines: string[];
}

export interface OfficialSource {
  pageUrl: string;
  pageTitle: string;
  blankTitle: string;
  blankPageUrl: string;
  checkedOn: string;
}

export interface Procedure {
  id: string;
  shortTitle: string;
  title: string;
  summary: string;
  official: OfficialSource;
  about: string[];
  whereTitle: string;
  where: string[];
  timing: string[];
  blank: {
    title: string;
    sourceUrl: string;
    blankNote: string;
  };
  sources: Source[];
  checkedOn: string;
  checklist: ChecklistGroup[];
  steps: FormStep[];
  pdf: PdfMeta;
}

export type ScalarValue = string;
export type RepeatValue = Record<string, string>[];
export type FormValues = Record<string, ScalarValue | RepeatValue>;

export interface Draft {
  values: FormValues;
  step: number;
  updatedAt: string;
}
