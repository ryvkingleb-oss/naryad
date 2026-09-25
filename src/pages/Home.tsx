import { Link } from "react-router-dom";
import { procedures, SERVICE_DISCLAIMER } from "../data";

export function HomePage() {
  return (
    <div className="stack-lg">
      <header className="stack">
        <p className="kicker">Бланк МВД, без визита к юристу</p>
        <h1>Заполните официальный бланк сами и получите файл для печати</h1>
        <p className="lead">
          Открываете сайт, регистрируетесь, выбираете документ и вписываете те же поля, что на бланке МВД.
          Готовый файл скачиваете, печатаете или отправляете себе на почту. В офис к юристу идти не нужно.
          В подразделение файл несёте сами: сервис туда ничего не отправляет.
        </p>
        <div className="row">
          <Link className="btn" to="/registraciya">Зарегистрироваться</Link>
          <Link className="btn-quiet" to="/kabinet">Уже есть кабинет</Link>
        </div>
      </header>
      <section className="cards">
        {procedures.map((procedure, index) => (
          <Link className="card" key={procedure.id} to={`/dokument/${procedure.id}`}>
            <p className="num">0{index + 1}</p>
            <h2>{procedure.shortTitle}</h2>
            <p>{procedure.summary}</p>
          </Link>
        ))}
      </section>
      <p className="note">{SERVICE_DISCLAIMER}</p>
    </div>
  );
}
