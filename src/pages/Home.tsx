import { Link } from "react-router-dom";
import { procedures } from "../data";
import { pageByPath } from "../../server/seo-pages.mjs";

const results: Record<string, string> = {
  pribytie: "Готовое уведомление о прибытии для печати и подачи",
  patent: "Готовое заявление об оформлении патента для печати и подачи",
  vnzh: "Готовое заявление на вид на жительство для печати и подачи",
  grazhdanstvo: "Готовое заявление о приёме в гражданство для печати и подачи",
};

const steps = [
  { title: "Регистрация", text: "Создаёте кабинет. Без него список можно читать, а свой файл — нет." },
  { title: "Заполнение", text: "Вписываете те же поля, что на бланке МВД. Пустой бланк можно скачать сразу." },
  { title: "Проверка и оплата", text: "Сверяете ответы и оплачиваете 490 ₽ за этот файл. После оплаты PDF скачивается в кабинете." },
  { title: "Скачивание и печать", text: "Получаете официальный бланк с вашими ответами. Подпись ставите от руки и несёте сами." },
];

export function HomePage() {
  const checked = procedures[0]?.official.checkedOn ?? "";
  const [year, month, day] = checked.split("-");
  const checkedLabel = day && month && year ? `${day}.${month}.${year}` : checked;
  const home = pageByPath("/");

  return (
    <div className="home">
      <section className="hero">
        <p className="kicker">Помощник, не портал МВД</p>
        <h1>{home?.h1}</h1>
        <p className="lead">{home?.lead}</p>
        <nav className="cluster" aria-label="Частые задачи">
          <Link to="/migracionnyj-uchet">Миграционный учёт</Link>
          <Link to="/registraciya-inostrannogo-grazhdanina">Регистрация иностранного гражданина</Link>
          <Link to="/dokument/pribytie">Бланк уведомления о прибытии</Link>
          <Link to="/statyi/kak-zapolnit-uvedomlenie-o-pribytii">Как заполнить</Link>
        </nav>
        <div className="hero-actions">
          <a className="btn" href="#dokumenty">Выбрать документ</a>
          <Link className="btn-quiet" to="/dokument/pribytie">Заполнить уведомление</Link>
        </div>
        <p className="price">
          <strong>490 ₽</strong>
          <span>за один заполненный PDF. Списки, чек-листы и пустые бланки бесплатны. Это плата сервиса, не госпошлина. Файл скачивается в кабинете, бумаг не отправляем. В подразделение несёте сами.</span>
        </p>
      </section>

      <section id="dokumenty" className="home-block" aria-labelledby="docs-title">
        <h2 id="docs-title">Четыре документа</h2>
        <div className="cards">
          {procedures.map((procedure) => (
            <Link className="card" key={procedure.id} to={`/dokument/${procedure.id}`}>
              <h3>{procedure.shortTitle}</h3>
              <p>{results[procedure.id] ?? procedure.summary}</p>
              <span className="card-go">Открыть список и бланк</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-block" aria-labelledby="steps-title">
        <h2 id="steps-title">Как это проходит</h2>
        <ol className="process">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="step-num">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-block" aria-labelledby="trust-title">
        <h2 id="trust-title">На что можно опереться</h2>
        <dl className="trust">
          <div>
            <dt>Официальный бланк</dt>
            <dd>В файл подставляется бланк с сайта МВД. Форма не рисуется заново.</dd>
          </div>
          <div>
            <dt>Источник и дата</dt>
            <dd>Страницы МВД. Сверка {checkedLabel}. Если бланк на сайте изменится, сервис сам его не подменяет.</dd>
          </div>
          <div>
            <dt>Ваши данные</dt>
            <dd>Ответы лежат в кабинете, чтобы собрать файл. Пароль хранится как хеш. В МВД заявление не уходит.</dd>
          </div>
          <div>
            <dt>Подпись от руки</dt>
            <dd>Место подписи пустое. Печать и герб здесь не ставятся. Это не портал государства.</dd>
          </div>
        </dl>
      </section>

    </div>
  );
}
