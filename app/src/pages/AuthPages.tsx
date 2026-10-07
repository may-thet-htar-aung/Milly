import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";

function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return <PageContainer className="auth-page"><Link to="/" className="back-link"><ArrowLeft size={16} />{t("backMilly")}</Link><div className="auth-layout"><div className="auth-aside"><span className="eyebrow"><span className="brand-icon small">M</span>{t("welcomeMilly")}</span><h1>{t("authHeadline")}</h1><p>{t("authAside")}</p><div className="auth-points"><span><Check size={15} />{t("localSellers")}</span><span><Check size={15} />{t("pricing")}</span><span><Check size={15} />{t("noPayment")}</span></div></div><Card className="auth-card"><div className="auth-card-heading"><span className="section-kicker">{t("yourAccount")}</span></div><h2>{title}</h2><p>{intro}</p>{children}</Card></div></PageContainer>;
}

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return <div className="password-field"><LockKeyhole size={17} /><Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder ?? t("password")} minLength={8} required /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? t("hidePassword") : t("showPassword")}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>;
}

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const next = safeNext(params.get("next"));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const signedIn = await login(email, password); navigate(signedIn.role === "ADMIN" ? "/admin" : next); } catch (caught) { setError(caught instanceof Error ? caught.message : t("signInFailed")); } finally { setBusy(false); } };
  const registerPath = next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`;
  return <AuthShell title={t("welcomeBack")} intro={t("signInIntro")}><form className="auth-form" onSubmit={submit}><label className="field-label">{t("email")}<div className="input-icon"><Mail size={17} /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("emailPlaceholder")} required /></div></label><label className="field-label">{t("password")}<PasswordField value={password} onChange={setPassword} /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={busy}>{busy ? t("signingIn") : t("signInSubmit")}</Button><p className="auth-switch">{t("newToMilly")} <Link to={registerPath}>{t("signUp")}</Link></p></form></AuthShell>;
}

export function RegisterPage() {
  const { register } = useAuth(); const { t } = useI18n(); const navigate = useNavigate(); const [params] = useSearchParams(); const next = safeNext(params.get("next"));
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await register(name, email, password); navigate(next); } catch (caught) { setError(caught instanceof Error ? caught.message : t("createFailed")); } finally { setBusy(false); } };
  const loginPath = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  const intro = next === "/favorites" ? t("registerFavorites") : t("registerIntro");
  return <AuthShell title={t("registerTitle")} intro={intro}><form className="auth-form" onSubmit={submit}><label className="field-label">{t("yourName")}<div className="input-icon"><UserRound size={17} /><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("yourName")} minLength={2} required /></div></label><label className="field-label">{t("email")}<div className="input-icon"><Mail size={17} /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div></label><label className="field-label">{t("password")}<PasswordField value={password} onChange={setPassword} placeholder={t("passwordHint")} /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={busy}>{busy ? t("creatingAccount") : t("createAccount")}</Button><p className="auth-switch">{t("alreadyAccount")} <Link to={loginPath}>{t("signInLink")}</Link></p></form></AuthShell>;
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
