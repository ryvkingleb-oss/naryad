import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProcedure, SERVICE_DISCLAIMER } from "../data";
import { api, type StoredDocument } from "../lib/api";
import type { Field, FieldGroup, FormValues } from "../types";
import { displayValue, isShown, procedureErrors, rows, scalar, stepErrors, visibleFields } from "../lib/validation";
import { FieldGroupBlock } from "../components/Fields";

export function FormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.document(id).then((result) => {
      setDocument(result.document);
      setValues(result.document.values || {});
      setStep(result.document.step || 0);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Документ не найден"));
  }, [id]);

  const procedure = getProcedure(document?.procedureId);
  if (error && !document) return <p className="error">{error}</p>;
  if (!document || !procedure) return <p>Открываю бланк…</p>;

  const form = procedure;
  const saved = document;
  const review = step >= form.steps.length;
  const current = form.steps[Math.min(step, form.steps.length - 1)];

  function change(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }
  function changeRow(groupId: string, index: number, fieldId: string, value: string) {
    setValues((prev) => {
      const list = rows(prev, groupId).map((row) => ({ ...row }));
      list[index] = { ...list[index], [fieldId]: value };
      return { ...prev, [groupId]: list };
    });
  }
  function addRow(group: FieldGroup) {
    const blank = Object.fromEntries(group.fields.map((field) => [field.id, ""]));
    setValues((prev) => ({ ...prev, [group.id]: [...rows(prev, group.id), blank] }));
  }
  function removeRow(groupId: string, index: number) {
    setValues((prev) => ({ ...prev, [groupId]: rows(prev, groupId).filter((_, item) => item !== index) }));
  }

  async function persist(nextStep: number) {
    setPending(true);
    setError("");
    try {
      const result = await api.saveDocument(saved.id, values, nextStep);
      setDocument(result.document);
      setStep(nextStep);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не сохранилось");
    } finally {
      setPending(false);
    }
  }

  async function next() {
    if (!review) {
      const found = stepErrors(current, values);
      setErrors(found);
      if (Object.keys(found).length) return;
      await persist(step + 1);
      return;
    }
    const found = procedureErrors(form.steps, values);
    setErrors(found);
    if (Object.keys(found).length) {
      const index = form.steps.findIndex((item) => Object.keys(stepErrors(item, values)).length);
      setStep(Math.max(index, 0));
      setError("На бланке остались пустые обязательные клетки.");
      return;
    }
    await persist(form.steps.length);
    navigate(`/zayavlenie/${saved.id}/oplata`);
  }

  return (
    <div className="stack">
      <header>
        <p className="kicker">{form.shortTitle}</p>
        <h1>{review ? "Проверьте клетки бланка" : current.title}</h1>
        {!review && current.lead ? <p className="muted">{current.lead}</p> : null}
      </header>
      <ol className="steps" aria-label="Шаги">
        {form.steps.map((item, index) => <li key={item.id} className={index <= step ? "on" : ""} />)}
        <li className={review ? "on" : ""} />
      </ol>
      {document.paid ? <p className="warn">Файл уже открыт. Новые правки попадут в него при следующем скачивании.</p> : null}
      <div className="sheet">
        {review ? <Review procedureId={form.id} values={values} /> : current.groups.map((group) => (
          <FieldGroupBlock
            key={group.id}
            group={group}
            values={values}
            errors={errors}
            onChange={change}
            onRow={changeRow}
            onAdd={addRow}
            onRemove={removeRow}
          />
        ))}
      </div>
      <p className="note">{SERVICE_DISCLAIMER}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="bar">
        <button className="btn-quiet" type="button" disabled={pending || step === 0} onClick={() => persist(step - 1)}>Назад</button>
        <Link className="btn-quiet" to={`/dokument/${form.id}`}>Список бумаг</Link>
        <button className="btn" type="button" disabled={pending} onClick={next}>{review ? "К оплате файла" : "Дальше"}</button>
      </div>
    </div>
  );
}

function Review({ procedureId, values }: { procedureId: string; values: FormValues }) {
  const procedure = getProcedure(procedureId);
  if (!procedure) return null;
  const lines: { label: string; value: string }[] = [];
  for (const step of procedure.steps) {
    for (const group of step.groups) {
      if (!isShown(group.showIf, values)) continue;
      if (group.repeatable) {
        rows(values, group.id).forEach((row, index) => {
          group.fields.forEach((field) => {
            const value = (row[field.id] ?? "").trim();
            if (value) lines.push({ label: `${group.title || "Строка"} ${index + 1}. ${field.label}`, value });
          });
        });
        continue;
      }
      visibleFields(group, values).forEach((field) => pushField(lines, field, values));
    }
  }
  if (!lines.length) return <p>Поля ещё пустые.</p>;
  return (
    <dl>
      {lines.map((line) => (
        <div key={line.label}>
          <dt>{line.label}</dt>
          <dd>{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function pushField(lines: { label: string; value: string }[], field: Field, values: FormValues) {
  const raw = scalar(values, field.id);
  if (!raw.trim() || field.id === "ack") return;
  lines.push({ label: field.label, value: displayValue(field, raw) });
}
