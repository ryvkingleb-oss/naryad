import type { Field, FieldGroup, FormValues } from "../types";
import { isShown, rows, scalar } from "../lib/validation";

interface Props {
  group: FieldGroup;
  values: FormValues;
  errors: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onRow: (groupId: string, index: number, fieldId: string, value: string) => void;
  onAdd: (group: FieldGroup) => void;
  onRemove: (groupId: string, index: number) => void;
}

export function FieldGroupBlock({ group, values, errors, onChange, onRow, onAdd, onRemove }: Props) {
  if (!isShown(group.showIf, values)) return null;
  return (
    <section>
      {group.title ? <h3 className="group-title">{group.title}</h3> : null}
      {group.hint ? <p className="hint">{group.hint}</p> : null}
      {group.repeatable ? (
        <div>
          {rows(values, group.id).map((row, index) => (
            <div className="repeat" key={`${group.id}-${index}`}>
              <p className="muted">{group.title || "Строка"} {index + 1}</p>
              {group.fields.map((field) => (
                <Control
                  key={field.id}
                  field={field}
                  value={row[field.id] ?? ""}
                  error={errors[`${group.id}.${index}.${field.id}`]}
                  onChange={(value) => onRow(group.id, index, field.id, value)}
                />
              ))}
              <button className="btn-quiet" type="button" onClick={() => onRemove(group.id, index)}>
                Убрать строку
              </button>
            </div>
          ))}
          <button className="btn-quiet" type="button" onClick={() => onAdd(group)} disabled={rows(values, group.id).length >= (group.max ?? 12)}>
            {group.addLabel || "Добавить"}
          </button>
        </div>
      ) : (
        group.fields.filter((field) => isShown(field.showIf, values)).map((field) => (
          <Control
            key={field.id}
            field={field}
            value={scalar(values, field.id)}
            error={errors[field.id]}
            onChange={(value) => onChange(field.id, value)}
          />
        ))
      )}
    </section>
  );
}

function Control({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (value: string) => void }) {
  const id = `f-${field.id}`;
  return (
    <label className="field" htmlFor={field.type === "radio" || field.type === "checkbox" ? undefined : id}>
      {field.type !== "checkbox" ? <span>{field.label}</span> : null}
      {field.hint ? <span className="hint">{field.hint}</span> : null}
      {field.type === "textarea" ? (
        <textarea id={id} value={value} placeholder={field.placeholder} maxLength={field.maxLength} aria-invalid={Boolean(error)} className={error ? "invalid" : ""} onChange={(event) => onChange(event.target.value)} />
      ) : null}
      {field.type === "text" || field.type === "date" ? (
        <input id={id} type={field.type} value={value} placeholder={field.placeholder} maxLength={field.maxLength} aria-invalid={Boolean(error)} className={error ? "invalid" : ""} onChange={(event) => onChange(event.target.value)} />
      ) : null}
      {field.type === "select" ? (
        <select id={id} value={value} aria-invalid={Boolean(error)} className={error ? "invalid" : ""} onChange={(event) => onChange(event.target.value)}>
          <option value="">Выберите</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : null}
      {field.type === "radio" ? (
        <span className="choices">
          {field.options?.map((option) => (
            <label key={option.value}>
              <input type="radio" name={field.id} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </span>
      ) : null}
      {field.type === "checkbox" ? (
        <span className="check">
          <input id={id} type="checkbox" checked={value === "yes"} onChange={(event) => onChange(event.target.checked ? "yes" : "")} />
          <span>{field.label}</span>
        </span>
      ) : null}
      {error ? <span className="error">{error}</span> : null}
    </label>
  );
}
