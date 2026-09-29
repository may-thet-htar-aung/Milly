import { ArrowLeft, ArrowRight, CheckCircle2, Heart, LogOut, Package, SquarePen, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { Spinner, ErrorState } from "../components/ui";
import type { ListingStatus } from "../types";
import { useI18n, type MessageKey } from "../i18n";

export function AccountPage() {
  const { user, logout } = useAuth(); const { t } = useI18n(); const navigate = useNavigate();
  if (!user) return null;
  return <PageContainer className="account-page"><div className="account-hero"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserRound size={30} />}</div><div><span className="section-kicker">{t("yourAccount")}</span><h1>{user.name}</h1><p>{user.email}</p></div><Button variant="outline" onClick={() => { void logout(); navigate("/"); }}><LogOut size={16} />{t("signOut")}</Button></div><div className="account-grid"><Card><div className="account-card-icon"><Heart /></div><h2>{t("savedFinds")}</h2><p>{t("savedFindsBody")}</p><Link to="/favorites" state={{ fromAccount: true }} className="text-link">{t("viewFavorites")} <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><Package /></div><h2>{t("yourListings")}</h2><p>{t("yourListingsBody")}</p><Link to="/my-listings" state={{ fromAccount: true }} className="text-link">{t("manageListings")} <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><CheckCircle2 /></div><h2>{t("goodToKnow")}</h2><p>{t("paymentsNote")}</p></Card></div></PageContainer>;
}

function AccountBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  if (!(location.state as { fromAccount?: boolean } | null)?.fromAccount) return null;
  return <Button variant="outline" className="account-back" onClick={() => navigate("/account")}><ArrowLeft size={16} />{t("back")}</Button>;
}

export function FavoritesPage() {
  const { user } = useAuth(); const { t } = useI18n(); const favorites = useQuery({ queryKey: ["favorites"], queryFn: api.favorites, enabled: Boolean(user) });
  return <PageContainer className="account-page"><AccountBackButton /><div className="page-heading"><div><span className="section-kicker">{t("yourShelf")}</span><h1>{t("savedLater")}</h1><p>{t("savedLaterBody")}</p></div></div>{favorites.isLoading ? <div className="full-state"><Spinner /></div> : favorites.isError ? <ErrorState /> : favorites.data?.data.length ? <ListingGrid listings={favorites.data.data} /> : <div className="empty-state"><div className="empty-icon"><Heart /></div><h2>{t("shelfEmpty")}</h2><p>{t("shelfEmptyBody")}</p><Link to="/listings" className="text-link">{t("startBrowsing")} <ArrowRight size={15} /></Link></div>}</PageContainer>;
}

export function MyListingsPage() {
  const { user } = useAuth(); const { t } = useI18n(); const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  const [filter, setFilter] = useState<ListingFilter>("ALL");
  const sellerListings = listings.data?.data ?? [];
  const filteredListings = filter === "ALL" ? sellerListings : filter === "PENDING_REVIEW" ? [] : sellerListings.filter((listing) => listing.status === filter);
  const emptyTitle = filter === "ALL" ? t("noListingsYet") : t("noFiltered", { label: t(listingFilterKey(filter)) });
  const emptyDescription = filter === "PENDING_REVIEW" ? t("pendingApi") : t("readySecondLife");
  return <PageContainer className="account-page"><AccountBackButton /><div className="page-heading"><div><span className="section-kicker">{t("sellerSpace")}</span><h1>{t("manageHeading")}</h1><p>{t("manageBody")}</p></div></div><div className="listing-filters" role="tablist" aria-label={t("filterListings")}>{listingFilters.map((option) => <button type="button" key={option.value} className={filter === option.value ? "listing-filter active" : "listing-filter"} role="tab" aria-selected={filter === option.value} onClick={() => setFilter(option.value)}>{t(option.label)}</button>)}</div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error instanceof Error ? listings.error.message : undefined} /> : filteredListings.length ? <ListingGrid listings={filteredListings} showStatus renderActions={(listing) => <div className="seller-listing-actions"><Link to={`/listings/${listing.id}/edit`}><Button variant="secondary" size="sm"><SquarePen size={15} />{t("edit")}</Button></Link></div>} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>{emptyTitle}</h2><p>{emptyDescription}</p>{filter === "ALL" && <Link to="/sell"><Button>{t("sellItem")}</Button></Link>}</div>}</PageContainer>;
}

type ListingFilter = "ALL" | "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "SOLD";

const listingFilters: { value: ListingFilter; label: MessageKey }[] = [
  { value: "ALL", label: "allListings" },
  { value: "ACTIVE", label: "published" },
  { value: "DRAFT", label: "drafts" },
  { value: "PENDING_REVIEW", label: "pendingReview" },
  { value: "SOLD", label: "sold" },
];

function listingFilterKey(filter: ListingFilter): MessageKey {
  return listingFilters.find((option) => option.value === filter)?.label ?? "listings";
}

export function PublishedProductsPage() {
  const { t } = useI18n();
  return <SellerStatusPage status="ACTIVE" title={t("publishedProducts")} description={t("publishedBody")} emptyTitle={t("noPublished")} />;
}

export function ArchiveProductsPage() {
  const { t } = useI18n();
  return <SellerStatusPage status="ARCHIVED" title={t("archiveProducts")} description={t("archiveBody")} emptyTitle={t("noArchived")} />;
}

function SellerStatusPage({ status, title, description, emptyTitle }: { status: Extract<ListingStatus, "ACTIVE" | "ARCHIVED">; title: string; description: string; emptyTitle: string }) {
  const { user } = useAuth();
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  const { t } = useI18n();
  const matches = (listings.data?.data ?? []).filter((listing) => listing.status === status);
  return <PageContainer className="account-page"><div className="page-heading"><div><span className="section-kicker">{t("sellerSpace")}</span><h1>{title}</h1><p>{description}</p></div><Link to="/my-listings" className="text-link">{t("backAll")} <ArrowRight size={15} /></Link></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error instanceof Error ? listings.error.message : undefined} /> : matches.length ? <ListingGrid listings={matches} showStatus renderActions={(listing) => <div className="seller-listing-actions"><Link to={`/listings/${listing.id}/edit`}><Button variant="secondary" size="sm"><SquarePen size={15} />{t("edit")}</Button></Link></div>} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>{emptyTitle}</h2><p>{t("statusShows")}</p></div>}</PageContainer>;
}
