import type { FormValues } from "../types";

export interface Account {
  id: string;
  email: string;
  name: string;
}

export interface MailRecord {
  provider: string;
  to: string;
  subject: string;
  fileName: string;
  delivered: boolean;
  sentAt: string;
  note: string;
}

export interface StoredDocument {
  id: string;
  procedureId: string;
  title: string;
  values: FormValues;
  step: number;
  paid: boolean;
  paidAt: string | null;
  emails: MailRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  provider: string;
  amountRub: number;
  charged: boolean;
  note: string;
  paid: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Не получилось выполнить запрос");
  return data as T;
}

export const api = {
  me: () => request<{ user: Account | null }>("/api/me"),
  register: (body: { email: string; name: string; password: string }) =>
    request<{ user: Account }>("/api/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: Account }>("/api/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/api/logout", { method: "POST", body: "{}" }),
  documents: () => request<{ documents: StoredDocument[] }>("/api/documents"),
  createDocument: (procedureId: string) =>
    request<{ document: StoredDocument }>("/api/documents", { method: "POST", body: JSON.stringify({ procedureId }) }),
  document: (id: string) => request<{ document: StoredDocument }>(`/api/documents/${id}`),
  saveDocument: (id: string, values: FormValues, step: number) =>
    request<{ document: StoredDocument }>(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify({ values, step }),
    }),
  quote: (id: string) => request<Quote>(`/api/documents/${id}/quote`),
  checkout: (id: string) =>
    request<{ document: StoredDocument }>(`/api/documents/${id}/checkout`, {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    }),
  email: (id: string, to: string) =>
    request<{ document: StoredDocument; email: MailRecord }>(`/api/documents/${id}/email`, {
      method: "POST",
      body: JSON.stringify({ to }),
    }),
};
