import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProcedure, SERVICE_DISCLAIMER } from "../data";
import { api } from "../lib/api";
import { useAuth } from "../auth";

const needLabel = { always: "Обычно нужно", if: "Не всем", check: "Нужна сверка" };

export function ProcedurePage() {
  const { procedureId } = useParams();
  const procedure = getProcedure(procedureId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!procedure) return <p className="error">Такого бланка нет.</p>;
  const blank = procedure;

  async function start() {
    if (!user) {
      navigate(`/registraciya?next=${encodeURIComponent(`/dokument/${blank.id}`)}`);
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await api.createDocument(blank.id);
      navigate(`/zayavlenie/${result.document.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось начать");
      setPending(false);
    }
  }

  return (
    <div className="stack-lg">
      <header className="stack">
        <p className="kicker">Бланк МВД</p>
        <h1>{procedure.title}</h1>
        <p className="lead">{procedure.summary}</p>
      </header>
      {procedure.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <section>
        <h2>{procedure.whereTitle}</h2>
        <ul className="list">{procedure.where.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>
      <section>
        <h2>Сроки</h2>
        <ul className="list">{procedure.timing.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>
      <section className="stack">
        <h2>Что приложить</h2>
        <p className="muted">Список бесплатный. Источник — страница МВД, сверка {procedure.checkedOn.split("-").reverse().join(".")}.</p>
        {procedure.checklist.map((group) => (
          <div key={group.id}>
            <h3>{group.title}</h3>
            {group.items.map((item) => (
              <article className="item" key={item.id}>
                <p className="tag">{needLabel[item.need]}</p>
                <h3>{item.title}</h3>
                <p>{item.what}</p>
                <p className="muted">Кому: {item.who}</p>
                <p className="muted">Исключения: {item.exceptions}</p>
              </article>
            ))}
          </div>
        ))}
      </section>
      <section className="note">
        <p><a href={procedure.official.blankPageUrl}>{procedure.official.blankTitle}</a></p>
        <p className="muted">{procedure.blank.blankNote}</p>
        <ul className="list">
          {procedure.sources.map((source) => (
            <li key={source.url}><a href={source.url}>{source.title}</a>. {source.note}</li>
          ))}
        </ul>
      </section>
      <p className="note">{SERVICE_DISCLAIMER}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="bar">
        <Link className="btn-quiet" to="/">К списку</Link>
        <button className="btn" type="button" onClick={start} disabled={pending}>
          {pending ? "Открываю бланк…" : user ? "Заполнить бланк" : "Зарегистрироваться и заполнить"}
        </button>
      </div>
    </div>
  );
}
