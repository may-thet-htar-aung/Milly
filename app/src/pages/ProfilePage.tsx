import { ArrowLeft, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { ErrorState, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";

export function ProfilePage() {
  const { id } = useParams();
  const profile = useQuery({ queryKey: ["user", id], queryFn: () => api.user(id!), enabled: Boolean(id) });
  const listings = useQuery({ queryKey: ["user-listings", id], queryFn: () => api.listings(new URLSearchParams({ sellerId: id!, page: "1", pageSize: "24" })), enabled: Boolean(id) });
  if (profile.isLoading) return <div className="full-state"><Spinner /></div>;
  if (profile.isError || !profile.data?.data) return <PageContainer><ErrorState message="This seller profile is unavailable." /></PageContainer>;
  const user = profile.data.data;
  return <PageContainer className="profile-page"><Link to="/listings" className="back-link"><ArrowLeft size={16} />Back to browsing</Link><section className="profile-header"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserRound size={32} />}</div><div className="profile-heading"><span className="section-kicker">Milly seller</span><h1>{user.name}</h1><div className="profile-meta">{user.location && <span><MapPin size={15} />{user.location}</span>}<span><Package size={15} />{user.listingCount ?? 0} listings</span></div></div><ShieldCheck className="profile-trust" size={24} /></section><section className="profile-listings"><div className="section-heading"><div><span className="section-kicker">What they are passing on</span><h2>Listings from {user.name.split(" ")[0]}</h2></div></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState /> : listings.data?.data.length ? <ListingGrid listings={listings.data.data} /> : <div className="empty-state"><h2>No active listings</h2><p>Check back later for new finds.</p></div>}</section></PageContainer>;
}
