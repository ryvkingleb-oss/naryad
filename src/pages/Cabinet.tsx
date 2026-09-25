import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type StoredDocument } from "../lib/api";

export function CabinetPage() {
  const [documents, setDocuments] = useState<StoredDocument[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.documents().then((result) => setDocuments(result.documents)).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Не удалось открыть кабинет");
    });
  }, []);

  return (
    <div className="stack-lg">
      <header>
        <p className="kicker">Кабинет</p>
        <h1>Ваши бланки</h1>
        <p className="muted">Неоплаченный черновик можно править. Готовый файл открывается после тестовой оплаты.</p>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {documents && documents.length === 0 ? (
        <div className="note">
          <p>Пока пусто. Выберите бланк на главной и заполните его поля.</p>
          <Link className="btn" to="/">Выбрать документ</Link>
        </div>
      ) : null}
      <div className="stack">
        {documents?.map((document) => (
          <article className="card" key={document.id}>
            <p className="num">{document.paid ? "Файл готов" : "Черновик"}</p>
            <h2>{document.title}</h2>
            <p>{new Date(document.updatedAt).toLocaleString("ru-RU")}</p>
            <div className="row">
              <Link className="btn" to={document.paid ? `/zayavlenie/${document.id}/oplata` : `/zayavlenie/${document.id}`}>
                {document.paid ? "Скачать и отправить" : "Продолжить"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
