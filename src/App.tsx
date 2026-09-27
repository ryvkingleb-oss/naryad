import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { DocumentMeta } from "./components/DocumentMeta";
import { MarketingPage, NotFound } from "./components/Content";
import { api } from "./lib/api";
import { HomePage } from "./pages/Home";
import { AuthPage } from "./pages/AuthPage";
import { CabinetPage } from "./pages/Cabinet";
import { ProcedurePage } from "./pages/ProcedurePage";
import { FormPage } from "./pages/FormPage";
import { PayPage } from "./pages/PayPage";
import { FILE_PRICE, redirects, SELLER_EMAIL, SELLER_INN, SELLER_NAME, SELLER_PHONE, SELLER_PHONE_TEL, SITE_NAME, TAGLINE } from "../server/seo-pages.mjs";

const menu = [
  { to: "/uslugi", label: "Услуги", match: (path: string) => path === "/uslugi" || path.startsWith("/dokument/") },
  { to: "/blanki", label: "Бланки", match: (path: string) => path === "/blanki" },
  { to: "/statyi", label: "Статьи", match: (path: string) => path === "/statyi" || path.startsWith("/statyi/") },
  { to: "/ceny", label: "Цены", match: (path: string) => path === "/ceny" },
  { to: "/kak-eto-rabotaet", label: "Как это работает", match: (path: string) => path === "/kak-eto-rabotaet" },
  { to: "/kontakty", label: "Контакты", match: (path: string) => path === "/kontakty" },
];

export function App() {
  return (
    <div className="shell">
      <a className="skip" href="#content">К содержанию</a>
      <header className="top">
        <Link className="brand" to="/">
          <span className="brand-name">{SITE_NAME}</span>
          <span className="brand-tagline">{TAGLINE}</span>
        </Link>
        <Nav />
      </header>
      <main className="main" id="content">
        <DocumentMeta />
        <Routes>
          <Route path="/" element={<HomePage />} />
          {Object.entries(redirects).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="/uslugi" element={<MarketingPage />} />
          <Route path="/blanki" element={<MarketingPage />} />
          <Route path="/ceny" element={<MarketingPage />} />
          <Route path="/kak-eto-rabotaet" element={<MarketingPage />} />
          <Route path="/kontakty" element={<MarketingPage />} />
          <Route path="/oferta" element={<MarketingPage />} />
          <Route path="/politika" element={<MarketingPage />} />
          <Route path="/migracionnyj-uchet" element={<MarketingPage />} />
          <Route path="/registraciya-inostrannogo-grazhdanina" element={<MarketingPage />} />
          <Route path="/statyi" element={<MarketingPage />} />
          <Route path="/statyi/:slug" element={<MarketingPage />} />
          <Route path="/registraciya" element={<AuthPage mode="register" />} />
          <Route path="/vhod" element={<AuthPage mode="login" />} />
          <Route path="/kabinet" element={<Private><CabinetPage /></Private>} />
          <Route path="/dokument/:procedureId" element={<ProcedurePage />} />
          <Route path="/zayavlenie/:id" element={<Private><FormPage /></Private>} />
          <Route path="/zayavlenie/:id/oplata" element={<Private><PayPage /></Private>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-foot">
        <div className="site-foot-inner">
          <p>© {SITE_NAME} · documentmigrant.ru</p>
          <p className="site-foot-seller">Самозанятый {SELLER_NAME}, ИНН {SELLER_INN}.</p>
          <p className="site-foot-seller"><a href={`tel:${SELLER_PHONE_TEL}`}>{SELLER_PHONE}</a></p>
          <p className="site-foot-seller"><a href={`mailto:${SELLER_EMAIL}`}>{SELLER_EMAIL}</a></p>
          <p>Заполненный PDF-бланк — {FILE_PRICE}. После оплаты файл скачивается в кабинете по ссылке. Бумажную доставку не делаем. Это не сайт МВД.</p>
          <nav className="foot-links" aria-label="Внизу страницы">
            {menu.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
            <Link to="/oferta">Оферта</Link>
            <Link to="/politika">Данные</Link>
            <Link to="/vhod">Войти</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Nav() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  return (
    <>
      <button
        className="nav-toggle text-btn"
        type="button"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Закрыть" : "Меню"}
      </button>
      <nav id="site-nav" className={open ? "nav is-open" : "nav"} aria-label="Разделы">
        {menu.map((item) => (
          <Link key={item.to} to={item.to} aria-current={item.match(pathname) ? "page" : undefined}>{item.label}</Link>
        ))}
        {ready && user ? (
          <>
            <Link to="/kabinet">{user.name}</Link>
            <button className="text-btn" type="button" onClick={() => { api.logout().finally(() => { setUser(null); navigate("/"); }); }}>
              Выйти
            </button>
          </>
        ) : null}
        {ready && !user ? <Link to="/vhod">Войти</Link> : null}
      </nav>
    </>
  );
}

function Private({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <p>Открываю кабинет…</p>;
  if (!user) return <Navigate to={`/vhod?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  return children;
}
