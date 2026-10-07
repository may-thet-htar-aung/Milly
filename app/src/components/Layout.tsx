import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Flag, Heart, LayoutDashboard, LogIn, Menu, Plus, Search, Store, UserRound, Users, X } from "lucide-react";
import { SegmentedControl } from "@mantine/core";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { Button } from "./ui";

export function Layout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sellNavigating, setSellNavigating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const isAdmin = user?.role === "ADMIN";
  const showCreateAccount = !user && location.pathname === "/";
  const hideSell = !user && location.pathname === "/register" && new URLSearchParams(location.search).get("next") === "/favorites";
  const goToSell = () => { setSellNavigating(true); navigate(user ? "/sell" : `/login?next=${encodeURIComponent("/sell")}`); };

  useEffect(() => {
    if (location.pathname !== "/sell") setSellNavigating(false);
  }, [location.pathname]);

  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <Link to={isAdmin ? "/admin" : "/"} className="brand" onClick={close}><span className="brand-icon">M</span><span>Milly</span></Link>
        <nav className={open ? "main-nav nav-open" : "main-nav"}>
          {isAdmin ? <>
            <NavLink to="/admin" end onClick={close}><LayoutDashboard size={16} />{t("dashboard")}</NavLink>
            <NavLink to="/admin/listings" onClick={close}><Search size={16} />{t("listings")}</NavLink>
            <NavLink to="/admin/reports" onClick={close}><Flag size={16} />{t("reports")}</NavLink>
            <NavLink to="/admin/users" onClick={close}><Users size={16} />{t("users")}</NavLink>
            <NavLink to="/admin/account" onClick={close}><UserRound size={16} />{t("account")}</NavLink>
          </> : <>
            <NavLink to="/listings" onClick={close}><Search size={16} />{t("browse")}</NavLink>
            <NavLink to={user ? "/favorites" : "/register?next=/favorites"} onClick={close}><Heart size={16} />{t("favorites")}</NavLink>
            {user && <NavLink to="/my-listings" onClick={close}><Store size={16} />{t("myListings")}</NavLink>}
            {user ? <NavLink to="/account" onClick={close}><UserRound size={16} />{user.name}</NavLink> : <NavLink to="/login" onClick={close}><LogIn size={16} />{t("signIn")}</NavLink>}
          </>}
          {user && <button className="nav-link nav-logout" onClick={() => { void logout(); close(); }}>{t("logOut")}</button>}
        </nav>
        <div className="header-actions">
          <LanguageSwitch />
          {isAdmin ? null : showCreateAccount ? <Button size="sm" onClick={() => navigate("/register")}>{t("signUp")}</Button> : hideSell ? null : <Button size="sm" disabled={sellNavigating || location.pathname === "/sell"} onClick={goToSell}><Plus size={16} />{t("sellProduct")}</Button>}
          <button className="mobile-menu" aria-label={open ? t("closeMenu") : t("menu")} onClick={() => setOpen((current) => !current)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
    <main><Outlet /></main>
    <footer className="site-footer"><div className="container footer-inner"><span className="footer-brand">Milly</span><span>{t("footerTagline")}</span><span>{t("currencies")}</span></div></footer>
  </div>;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();
  return <SegmentedControl className="language-switch" aria-label={t("language")} value={language} onChange={(value) => setLanguage(value === "my" ? "my" : "en")} data={[{ label: <span className="language-label language-label-en">English</span>, value: "en" }, { label: <span className="language-label language-label-my">မြန်မာ</span>, value: "my" }]} />;
}

export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`container page-container ${className}`}>{children}</div>;
}
