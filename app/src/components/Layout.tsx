import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Flag, Heart, LayoutDashboard, LogIn, Menu, Plus, Search, Store, UserRound, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

export function Layout() {
  const { user, logout } = useAuth();
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
            <NavLink to="/admin" end onClick={close}><LayoutDashboard size={16} />Dashboard</NavLink>
            <NavLink to="/admin/listings" onClick={close}><Search size={16} />Listings</NavLink>
            <NavLink to="/admin/reports" onClick={close}><Flag size={16} />Reports</NavLink>
            <NavLink to="/admin/users" onClick={close}><Users size={16} />Users</NavLink>
            <NavLink to="/admin/account" onClick={close}><UserRound size={16} />Account</NavLink>
          </> : <>
            <NavLink to="/listings" onClick={close}><Search size={16} />Browse</NavLink>
            <NavLink to={user ? "/favorites" : "/register?next=/favorites"} onClick={close}><Heart size={16} />Favorites</NavLink>
            {user && <NavLink to="/my-listings" onClick={close}><Store size={16} />My listings</NavLink>}
            {user ? <NavLink to="/account" onClick={close}><UserRound size={16} />{user.name}</NavLink> : <NavLink to="/login" onClick={close}><LogIn size={16} />Sign in</NavLink>}
          </>}
          {user && <button className="nav-link nav-logout" onClick={() => { void logout(); close(); }}>Log out</button>}
        </nav>
        <div className="header-actions">
          {isAdmin ? null : showCreateAccount ? <Button size="sm" onClick={() => navigate("/register")}>Create An Account</Button> : hideSell ? null : <Button size="sm" disabled={sellNavigating || location.pathname === "/sell"} onClick={goToSell}><Plus size={16} />Sell A Product</Button>}
          <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen((current) => !current)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
    <main><Outlet /></main>
    <footer className="site-footer"><div className="container footer-inner"><span className="footer-brand">Milly</span><span>Thoughtful finds, ready for a second life.</span><span>USD · MMK</span></div></footer>
  </div>;
}

export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`container page-container ${className}`}>{children}</div>;
}
