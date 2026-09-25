import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <PageContainer className="auth-page"><Link to="/" className="back-link"><ArrowLeft size={16} />Back to Milly</Link><div className="auth-layout"><div className="auth-aside"><span className="eyebrow"><span className="brand-icon small">M</span>Welcome to Milly</span><h1>Good finds feel better when the details are clear.</h1><p>Save the pieces that catch your eye and keep track of what you’re ready to pass on.</p><div className="auth-points"><span><Check size={15} />Local sellers</span><span><Check size={15} />USD + MMK pricing</span><span><Check size={15} />No payment required</span></div></div><Card className="auth-card"><span className="section-kicker">Your Milly account</span><h2>{title}</h2><p>{intro}</p>{children}</Card></div></PageContainer>;
}

function PasswordField({ value, onChange, placeholder = "Password" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-field"><LockKeyhole size={17} /><Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} minLength={8} required /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const next = safeNext(params.get("next"));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const signedIn = await login(email, password); navigate(signedIn.role === "ADMIN" ? "/admin" : next); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in."); } finally { setBusy(false); } };
  const registerPath = next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`;
  return <AuthShell title="Welcome Back" intro="Sign in to keep your favorites and listings close."><form className="auth-form" onSubmit={submit}><label className="field-label">Email<div className="input-icon"><Mail size={17} /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div></label><label className="field-label">Password<PasswordField value={password} onChange={setPassword} /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button><p className="auth-switch">New to Milly? <Link to={registerPath}>Create An Account</Link></p></form></AuthShell>;
}

export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate(); const [params] = useSearchParams(); const next = safeNext(params.get("next"));
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await register(name, email, password); navigate(next); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create your account."); } finally { setBusy(false); } };
  const loginPath = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  const intro = next === "/favorites" ? "Become a Milly user to save your favorites." : "Create an account to save listings and share what you no longer need.";
  return <AuthShell title="Make room for good finds" intro={intro}><form className="auth-form" onSubmit={submit}><label className="field-label">Your name<div className="input-icon"><UserRound size={17} /><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" minLength={2} required /></div></label><label className="field-label">Email<div className="input-icon"><Mail size={17} /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div></label><label className="field-label">Password<PasswordField value={password} onChange={setPassword} placeholder="At least 8 characters" /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button><p className="auth-switch">Already have an account? <Link to={loginPath}>Sign In</Link></p></form></AuthShell>;
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
