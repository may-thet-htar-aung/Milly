import { ArrowRight, CheckCircle2, Heart, LogOut, Package, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { Spinner, ErrorState } from "../components/ui";

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
  const { user } = useAuth(); const listings = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings, enabled: Boolean(user) });
  return <PageContainer className="account-page"><div className="page-heading"><div><span className="section-kicker">Your seller space</span><h1>Things you’re passing on.</h1><p>Keep details fresh and let people know what is still available.</p></div><Link to="/sell"><Button><Package size={16} />List something</Button></Link></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState /> : listings.data?.data.length ? <ListingGrid listings={listings.data.data} /> : <div className="empty-state"><div className="empty-icon"><Package /></div><h2>No listings yet</h2><p>When you are ready, make some space and give an item a second life.</p><Link to="/sell"><Button>Create a listing</Button></Link></div>}</PageContainer>;
}
