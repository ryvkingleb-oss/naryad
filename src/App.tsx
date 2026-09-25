import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { api } from "./lib/api";
import { HomePage } from "./pages/Home";
import { AuthPage } from "./pages/AuthPage";
import { CabinetPage } from "./pages/Cabinet";
import { ProcedurePage } from "./pages/ProcedurePage";
import { FormPage } from "./pages/FormPage";
import { PayPage } from "./pages/PayPage";

export function App() {
  return (
    <div className="shell">
      <a className="skip" href="#content">К содержанию</a>
      <header className="top">
        <Link className="brand" to="/">Наряд</Link>
        <Nav />
      </header>
      <main className="main" id="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/registraciya" element={<AuthPage mode="register" />} />
          <Route path="/vhod" element={<AuthPage mode="login" />} />
          <Route path="/kabinet" element={<Private><CabinetPage /></Private>} />
          <Route path="/dokument/:procedureId" element={<ProcedurePage />} />
          <Route path="/zayavlenie/:id" element={<Private><FormPage /></Private>} />
          <Route path="/zayavlenie/:id/oplata" element={<Private><PayPage /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Nav() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  if (!ready) return null;
  if (!user) {
    return (
      <nav className="nav" aria-label="Вход">
        <Link to="/#dokumenty">Документы</Link>
        <Link to="/vhod">Войти</Link>
      </nav>
    );
  }
  return (
    <nav className="nav" aria-label="Кабинет">
      <Link to="/#dokumenty">Документы</Link>
      <Link to="/kabinet">{user.name}</Link>
      <button className="text-btn" type="button" onClick={() => { api.logout().finally(() => { setUser(null); navigate("/"); }); }}>
        Выйти
      </button>
    </nav>
  );
}

function Private({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <p>Открываю кабинет…</p>;
  if (!user) return <Navigate to={`/vhod?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  return children;
}
