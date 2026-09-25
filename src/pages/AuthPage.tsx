import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/kabinet";
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const register = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = register
        ? await api.register({ email, name, password })
        : await api.login({ email, password });
      setUser(result.user);
      navigate(next.startsWith("/") ? next : "/kabinet");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не получилось войти");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack sheet" onSubmit={submit}>
      <div>
        <p className="kicker">{register ? "Шаг 2" : "Кабинет"}</p>
        <h1>{register ? "Регистрация" : "Вход"}</h1>
        <p className="muted">Кабинет хранит заполненные бланки. Список документов и черновик полей бесплатны.</p>
      </div>
      {register ? (
        <label className="field">
          <span>Как к вам обращаться</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        </label>
      ) : null}
      <label className="field">
        <span>Почта</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label className="field">
        <span>Пароль</span>
        <span className="hint">Не короче 8 знаков.</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register ? "new-password" : "current-password"} required minLength={8} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Секунду…" : register ? "Создать кабинет" : "Войти"}</button>
      {register ? <Link to={`/vhod?next=${encodeURIComponent(next)}`}>Уже регистрировались</Link> : <Link to={`/registraciya?next=${encodeURIComponent(next)}`}>Нет кабинета</Link>}
    </form>
  );
}
