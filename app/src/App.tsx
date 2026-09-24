import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AccountPage, FavoritesPage, MyListingsPage } from "./pages/AccountPages";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { HomePage } from "./pages/HomePage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { ListingsPage } from "./pages/ListingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SellPage } from "./pages/SellPage";
import { EditListingPage } from "./pages/EditListingPage";

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<HomePage />} /><Route path="listings" element={<ListingsPage />} /><Route path="listings/:id/edit" element={<ProtectedRoute />}><Route index element={<EditListingPage />} /></Route><Route path="listings/:id" element={<ListingDetailPage />} /><Route path="profile/:id" element={<ProfilePage />} /><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route element={<ProtectedRoute />}><Route path="sell" element={<SellPage />} /><Route path="favorites" element={<FavoritesPage />} /><Route path="my-listings" element={<MyListingsPage />} /><Route path="account" element={<AccountPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route></Routes>;
}
