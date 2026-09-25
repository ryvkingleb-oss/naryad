import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Quote, type StoredDocument } from "../lib/api";
import { SERVICE_DISCLAIMER } from "../data";

export function PayPage() {
  const { id = "" } = useParams();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [to, setTo] = useState("");
  const [mailNote, setMailNote] = useState("");

  useEffect(() => {
    Promise.all([api.document(id), api.quote(id)]).then(([doc, price]) => {
      setDocument(doc.document);
      setQuote(price);
      setTo(doc.document.emails.at(-1)?.to || "");
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Не открылось"));
  }, [id]);

  async function pay() {
    setPending(true);
    setError("");
    try {
      const result = await api.checkout(id);
      setDocument(result.document);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Оплата не прошла");
    } finally {
      setPending(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMailNote("");
    setError("");
    try {
      const result = await api.email(id, to);
      setDocument(result.document);
      setMailNote(result.email.note);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Письмо не сохранилось");
    } finally {
      setPending(false);
    }
  }

  if (error && !document) return <p className="error">{error}</p>;
  if (!document || !quote) return <p>Считаю стоимость…</p>;
  const fileUrl = `/api/documents/${document.id}/file.pdf`;

  return (
    <div className="stack-lg">
      <header>
        <p className="kicker">Готовый файл</p>
        <h1>{document.title}</h1>
      </header>
      {!document.paid ? (
        <section className="sheet stack">
          <h2>Тестовая оплата</h2>
          <p>Файл бланка стоит {quote.amountRub} ₽. Это услуга сервиса, не госпошлина. Списания нет: касса помечена как тестовая.</p>
          <p className="muted">{quote.note}</p>
          <button className="btn" type="button" onClick={pay} disabled={pending}>Подтвердить тестовую оплату</button>
        </section>
      ) : (
        <section className="stack">
          <p className="warn">Оплата тестовая, деньги не списывались. Файл лежит на бланке МВД: клетки, пустая подпись, без печати.</p>
          <div className="row">
            <a className="btn" href={fileUrl}>Скачать PDF</a>
            <a className="btn-quiet" href={`${fileUrl}?disposition=inline`} target="_blank" rel="noreferrer">Открыть для печати</a>
          </div>
          <form className="sheet stack" onSubmit={send}>
            <h2>Письмо с файлом</h2>
            <p className="muted">Тестовая почта сохраняет запись в кабинете и наружу не отправляет.</p>
            <label className="field">
              <span>Куда</span>
              <input type="email" value={to} onChange={(event) => setTo(event.target.value)} required />
            </label>
            <button className="btn" type="submit" disabled={pending}>Сохранить письмо</button>
            {mailNote ? <p className="note">{mailNote}</p> : null}
            {document.emails.length ? (
              <ul className="list">
                {document.emails.map((mail) => (
                  <li key={mail.sentAt}>{mail.to}: {mail.delivered ? "отправлено" : "тест, не доставлено"}</li>
                ))}
              </ul>
            ) : null}
          </form>
        </section>
      )}
      {error ? <p className="error">{error}</p> : null}
      <p className="note">{SERVICE_DISCLAIMER}</p>
      <div className="row">
        <Link className="btn-quiet" to={`/zayavlenie/${document.id}`}>Править поля</Link>
        <Link className="btn-quiet" to="/kabinet">В кабинет</Link>
      </div>
    </div>
  );
}
