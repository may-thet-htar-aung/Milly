import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { AdminAccountPage, AdminDashboardPage, AdminListingDetailPage, AdminListingsPage, AdminReportDetailPage, AdminReportsPage, AdminUserDetailPage, AdminUsersPage } from "./pages/AdminPages";
import { AccountPage, ArchiveProductsPage, FavoritesPage, MyListingsPage, PublishedProductsPage } from "./pages/AccountPages";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { HomePage } from "./pages/HomePage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { ListingsPage } from "./pages/ListingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SellPage } from "./pages/SellPage";
import { EditListingPage } from "./pages/EditListingPage";

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<HomePage />} /><Route path="listings" element={<ListingsPage />} /><Route path="listings/:id/edit" element={<ProtectedRoute />}><Route index element={<EditListingPage />} /></Route><Route path="listings/:id" element={<ListingDetailPage />} /><Route path="profile/:id" element={<ProfilePage />} /><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route element={<ProtectedRoute />}><Route path="sell" element={<SellPage />} /><Route path="favorites" element={<FavoritesPage />} /><Route path="my-listings" element={<MyListingsPage />} /><Route path="published-products" element={<PublishedProductsPage />} /><Route path="archive-products" element={<ArchiveProductsPage />} /><Route path="account" element={<AccountPage />} /></Route><Route element={<AdminRoute />}><Route path="admin" element={<AdminDashboardPage />} /><Route path="admin/listings" element={<AdminListingsPage />} /><Route path="admin/listings/:id" element={<AdminListingDetailPage />} /><Route path="admin/reports" element={<AdminReportsPage />} /><Route path="admin/reports/:id" element={<AdminReportDetailPage />} /><Route path="admin/users" element={<AdminUsersPage />} /><Route path="admin/users/:id" element={<AdminUserDetailPage />} /><Route path="admin/account" element={<AdminAccountPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route></Routes>;
}
