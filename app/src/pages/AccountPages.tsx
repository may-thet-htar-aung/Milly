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

export function AccountPage() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  if (!user) return null;
  return <PageContainer className="account-page"><div className="account-hero"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserRound size={30} />}</div><div><span className="section-kicker">Your Milly account</span><h1>{user.name}</h1><p>{user.email}</p></div><Button variant="outline" onClick={() => { void logout(); navigate("/"); }}><LogOut size={16} />Sign out</Button></div><div className="account-grid"><Card><div className="account-card-icon"><Heart /></div><h2>Your saved finds</h2><p>Keep the listings you are not ready to forget.</p><Link to="/favorites" state={{ fromAccount: true }} className="text-link">View Favorites <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><Package /></div><h2>Your listings</h2><p>See what is active, sold, or waiting for its next chapter.</p><Link to="/my-listings" state={{ fromAccount: true }} className="text-link">Manage Listings <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><CheckCircle2 /></div><h2>Good to know</h2><p>Payments are not processed on Milly yet. Arrange details directly with the seller.</p></Card></div></PageContainer>;
}

function AccountBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (!(location.state as { fromAccount?: boolean } | null)?.fromAccount) return null;
  return <Button variant="outline" className="account-back" onClick={() => navigate("/account")}><ArrowLeft size={16} />Back</Button>;
}

export function FavoritesPage() {
  const { user } = useAuth(); const favorites = useQuery({ queryKey: ["favorites"], queryFn: api.favorites, enabled: Boolean(user) });
  return <PageContainer className="account-page"><AccountBackButton /><div className="page-heading"><div><span className="section-kicker">Your shelf</span><h1>Saved for later.</h1><p>The things that made you pause for a second look.</p></div></div>{favorites.isLoading ? <div className="full-state"><Spinner /></div> : favorites.isError ? <ErrorState /> : favorites.data?.data.length ? <ListingGrid listings={favorites.data.data} /> : <div className="empty-state"><div className="empty-icon"><Heart /></div><h2>Your shelf is still empty</h2><p>Tap the heart on a listing when something feels like a maybe.</p><Link to="/listings" className="text-link">Start browsing <ArrowRight size={15} /></Link></div>}</PageContainer>;
}

export function MyListingsPage() {
  const { user } = useAuth(); const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  const [filter, setFilter] = useState<ListingFilter>("ALL");
  const sellerListings = listings.data?.data ?? [];
  const filteredListings = filter === "ALL" ? sellerListings : filter === "PENDING_REVIEW" ? [] : sellerListings.filter((listing) => listing.status === filter);
  const emptyTitle = filter === "ALL" ? "No listings yet" : `No ${listingFilterLabel(filter).toLowerCase()} listings`;
  const emptyDescription = filter === "PENDING_REVIEW" ? "Pending Review is not part of the current API workflow yet." : "When you are ready, make some space and give an item a second life.";
  return <PageContainer className="account-page"><AccountBackButton /><div className="page-heading"><div><span className="section-kicker">Your seller space</span><h1>Manage Your Product Listings</h1><p>Review each listing and keep details fresh as its status changes.</p></div></div><div className="listing-filters" role="tablist" aria-label="Filter your listings">{listingFilters.map((option) => <button type="button" key={option.value} className={filter === option.value ? "listing-filter active" : "listing-filter"} role="tab" aria-selected={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>)}</div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error instanceof Error ? listings.error.message : undefined} /> : filteredListings.length ? <ListingGrid listings={filteredListings} showStatus renderActions={(listing) => <div className="seller-listing-actions"><Link to={`/listings/${listing.id}/edit`}><Button variant="secondary" size="sm"><SquarePen size={15} />Edit</Button></Link></div>} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>{emptyTitle}</h2><p>{emptyDescription}</p>{filter === "ALL" && <Link to="/sell"><Button>Sell An Item</Button></Link>}</div>}</PageContainer>;
}

type ListingFilter = "ALL" | "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "SOLD";

const listingFilters: { value: ListingFilter; label: string }[] = [
  { value: "ALL", label: "All Listings" },
  { value: "ACTIVE", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "SOLD", label: "Sold" },
];

function listingFilterLabel(filter: ListingFilter) {
  return listingFilters.find((option) => option.value === filter)?.label ?? "Listings";
}

export function PublishedProductsPage() {
  return <SellerStatusPage status="ACTIVE" title="Published Products" description="These listings are visible to buyers." emptyTitle="No published products yet" />;
}

export function ArchiveProductsPage() {
  return <SellerStatusPage status="ARCHIVED" title="Archive Products" description="These listings are hidden from public browsing." emptyTitle="No archived products yet" />;
}

function SellerStatusPage({ status, title, description, emptyTitle }: { status: Extract<ListingStatus, "ACTIVE" | "ARCHIVED">; title: string; description: string; emptyTitle: string }) {
  const { user } = useAuth();
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  const matches = (listings.data?.data ?? []).filter((listing) => listing.status === status);
  return <PageContainer className="account-page"><div className="page-heading"><div><span className="section-kicker">Your seller space</span><h1>{title}</h1><p>{description}</p></div><Link to="/my-listings" className="text-link">Back to all listings <ArrowRight size={15} /></Link></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error instanceof Error ? listings.error.message : undefined} /> : matches.length ? <ListingGrid listings={matches} showStatus renderActions={(listing) => <div className="seller-listing-actions"><Link to={`/listings/${listing.id}/edit`}><Button variant="secondary" size="sm"><SquarePen size={15} />Edit</Button></Link></div>} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>{emptyTitle}</h2><p>Saved listings with this status will show up here.</p></div>}</PageContainer>;
}
