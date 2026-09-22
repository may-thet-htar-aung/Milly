import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heart, LogIn, Menu, Plus, Search, Store, UserRound, X } from "lucide-react";
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
  const goToSell = () => { setSellNavigating(true); navigate(user ? "/sell" : "/login"); };

  useEffect(() => {
    if (location.pathname !== "/sell") setSellNavigating(false);
  }, [location.pathname]);

  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={close}><span className="brand-icon">M</span><span>Milly</span></Link>
        <nav className={open ? "main-nav nav-open" : "main-nav"}>
          <NavLink to="/listings" onClick={close}><Search size={16} />Browse</NavLink>
          <NavLink to="/favorites" onClick={close}><Heart size={16} />Favorites</NavLink>
          {user && <NavLink to="/my-listings" onClick={close}><Store size={16} />My listings</NavLink>}
          {user ? <NavLink to="/account" onClick={close}><UserRound size={16} />{user.name.split(" ")[0]}</NavLink> : <NavLink to="/login" onClick={close}><LogIn size={16} />Sign in</NavLink>}
          {user && <button className="nav-link nav-logout" onClick={() => { void logout(); close(); }}>Log out</button>}
        </nav>
        <div className="header-actions">
          <Button size="sm" disabled={sellNavigating || location.pathname === "/sell"} onClick={goToSell}><Plus size={16} />Sell an item</Button>
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
