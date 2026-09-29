import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "./ui";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="full-state"><Spinner /></div>;
  const destination = `${location.pathname}${location.search}`;
  return user ? <Outlet /> : <Navigate to={`/login?next=${encodeURIComponent(destination)}`} replace />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="full-state"><Spinner /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  return user.role === "ADMIN" ? <Outlet /> : <Navigate to="/" replace />;
}
