import { Archive, ArrowRight, CheckCircle2, Heart, LogOut, Package, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { Spinner, ErrorState } from "../components/ui";
import type { Listing, ListingStatus } from "../types";
import { formatListingStatus } from "../lib/utils";

export function AccountPage() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  if (!user) return null;
  return <PageContainer className="account-page"><div className="account-hero"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserRound size={30} />}</div><div><span className="section-kicker">Your Milly account</span><h1>{user.name}</h1><p>{user.email}</p></div><Button variant="outline" onClick={() => { void logout(); navigate("/"); }}><LogOut size={16} />Sign out</Button></div><div className="account-grid"><Card><div className="account-card-icon"><Heart /></div><h2>Your saved finds</h2><p>Keep the listings you are not ready to forget.</p><Link to="/favorites" className="text-link">View favorites <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><Package /></div><h2>Your listings</h2><p>See what is active, sold, or waiting for its next chapter.</p><Link to="/my-listings" className="text-link">Manage listings <ArrowRight size={15} /></Link></Card><Card><div className="account-card-icon"><CheckCircle2 /></div><h2>Good to know</h2><p>Payments are not processed on Milly yet. Arrange details directly with the seller.</p></Card></div></PageContainer>;
}

export function FavoritesPage() {
  const { user } = useAuth(); const favorites = useQuery({ queryKey: ["favorites"], queryFn: api.favorites, enabled: Boolean(user) });
  return <PageContainer className="account-page"><div className="page-heading"><div><span className="section-kicker">Your shelf</span><h1>Saved for later.</h1><p>The things that made you pause for a second look.</p></div></div>{favorites.isLoading ? <div className="full-state"><Spinner /></div> : favorites.isError ? <ErrorState /> : favorites.data?.data.length ? <ListingGrid listings={favorites.data.data} /> : <div className="empty-state"><div className="empty-icon"><Heart /></div><h2>Your shelf is still empty</h2><p>Tap the heart on a listing when something feels like a maybe.</p><Link to="/listings" className="text-link">Start browsing <ArrowRight size={15} /></Link></div>}</PageContainer>;
}

export function MyListingsPage() {
  const { user } = useAuth(); const queryClient = useQueryClient(); const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  const [filter, setFilter] = useState<ListingFilter>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const action = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: ListingAction }) => {
      if (type === "publish") return api.publishListing(id);
      if (type === "reserve") return api.reserveListing(id);
      if (type === "sold") return api.markListingSold(id);
      return api.archiveListing(id);
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
      setFeedback({ type: "success", message: `${actionSuccessLabel(variables.type)} successfully.` });
    },
    onError: (caught) => setFeedback({ type: "error", message: caught instanceof Error ? caught.message : "Unable to update this listing." }),
  });
  const confirmAction = (listing: Listing, type: ListingAction) => {
    if (!window.confirm(actionConfirmation(listing, type))) return;
    setFeedback(null);
    action.mutate({ id: listing.id, type });
  };
  const renderActions = (listing: Listing) => <div className="seller-listing-actions"><Link to={`/listings/${listing.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>{listing.status === "DRAFT" && <Button variant="secondary" size="sm" onClick={() => confirmAction(listing, "publish")} disabled={action.isPending}>Publish</Button>}{listing.status === "ACTIVE" && <><Button variant="outline" size="sm" onClick={() => confirmAction(listing, "reserve")} disabled={action.isPending}>Reserve</Button><Button variant="outline" size="sm" onClick={() => confirmAction(listing, "sold")} disabled={action.isPending}>Mark as Sold</Button></>}{listing.status === "RESERVED" && <><Button variant="secondary" size="sm" onClick={() => confirmAction(listing, "publish")} disabled={action.isPending}>Make Active</Button><Button variant="outline" size="sm" onClick={() => confirmAction(listing, "sold")} disabled={action.isPending}>Mark as Sold</Button></>}{(listing.status === "DRAFT" || listing.status === "ACTIVE" || listing.status === "RESERVED") && <Button variant="danger" size="sm" onClick={() => confirmAction(listing, "archive")} disabled={action.isPending}><Archive size={14} />Archive</Button>}{(listing.status === "SOLD" || listing.status === "ARCHIVED") && <Button variant="secondary" size="sm" onClick={() => confirmAction(listing, "publish")} disabled={action.isPending}>Publish Again</Button>}</div>;
  const sellerListings = listings.data?.data ?? [];
  const filteredListings = filter === "ALL" ? sellerListings : filter === "PENDING_REVIEW" ? [] : sellerListings.filter((listing) => listing.status === filter);
  const emptyTitle = filter === "ALL" ? "No listings yet" : `No ${listingFilterLabel(filter).toLowerCase()} listings`;
  const emptyDescription = filter === "PENDING_REVIEW" ? "Pending Review is not part of the current API workflow yet." : "When you are ready, make some space and give an item a second life.";
  return <PageContainer className="account-page"><div className="page-heading"><div><span className="section-kicker">Your seller space</span><h1>Manage Your Product Listings</h1><p>Review each listing and keep details fresh as its status changes.</p></div></div>{feedback && <div className={feedback.type === "success" ? "form-success" : "form-error"} role="status">{feedback.message}</div>}<div className="listing-filters" role="tablist" aria-label="Filter your listings">{listingFilters.map((option) => <button type="button" key={option.value} className={filter === option.value ? "listing-filter active" : "listing-filter"} role="tab" aria-selected={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>)}</div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error instanceof Error ? listings.error.message : undefined} /> : filteredListings.length ? <ListingGrid listings={filteredListings} showStatus renderActions={renderActions} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>{emptyTitle}</h2><p>{emptyDescription}</p>{filter === "ALL" && <Link to="/sell"><Button>Sell An Item</Button></Link>}</div>}</PageContainer>;
}

type ListingAction = "publish" | "reserve" | "sold" | "archive";
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

function actionSuccessLabel(type: ListingAction) {
  return type === "publish" ? "Listing published" : type === "reserve" ? "Listing reserved" : type === "sold" ? "Listing marked as sold" : "Listing archived";
}

function actionConfirmation(listing: Listing, type: ListingAction) {
  const nextStatus: Record<ListingAction, ListingStatus> = { publish: "ACTIVE", reserve: "RESERVED", sold: "SOLD", archive: "ARCHIVED" };
  const status = formatListingStatus(nextStatus[type]);
  return type === "archive" ? `Archive “${listing.title}”? It will be removed from public browsing.` : `Change “${listing.title}” to ${status}?`;
}
