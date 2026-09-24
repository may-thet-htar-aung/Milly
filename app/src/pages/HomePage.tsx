import { ArrowRight, Box, Camera, ChevronRight, Heart, Search, ShieldCheck, Sparkles, Sofa } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { Button, Card, ErrorState, Input, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const categoryIcons = [Camera, Sofa, Box, Sparkles];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const listings = useQuery({ queryKey: ["listings", "featured"], queryFn: () => api.listings(new URLSearchParams({ page: "1", pageSize: "8", sort: "newest" })) });

  const submit = (event: React.FormEvent) => { event.preventDefault(); navigate(`/listings${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`); };
  const startSelling = () => navigate(user ? "/sell" : `/login?next=${encodeURIComponent("/sell")}`);

  return <>
    <section className="hero-section"><PageContainer><div className="hero-grid"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14} />A marketplace with a little more care</div><h1>Good things deserve a <em>second life.</em></h1><p>Find pieces with a story, from people nearby. Milly keeps the search simple and the details clear.</p><Button className="hero-cta" size="lg" onClick={startSelling}>Start Selling Now <ArrowRight size={16} /></Button><div className="hero-note"><ShieldCheck size={16} />Transparent listings · Local sellers · No checkout pressure</div></div><div className="hero-art"><div className="hero-art-card"><span className="art-label">Today's find</span><img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85" alt="A phone on a warm tabletop" /><div className="art-card-copy"><span>Lightly used smartphone</span><strong>Ready for its next chapter</strong></div></div><div className="floating-note floating-note-one"><Heart size={16} fill="currentColor" /> Loved by 30 people</div><div className="floating-note floating-note-two"><span className="dot" /> 100+ fresh finds</div></div></div></PageContainer></section>
    <PageContainer>
      <section className="section-block categories-block"><div className="section-heading"><div><span className="section-kicker">Start somewhere</span><h2>Explore By Mood</h2></div><Link to="/listings" className="text-link">See All Categories <ArrowRight size={15} /></Link></div><form className="toolbar-search mood-search" onSubmit={submit}><Search size={18} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What are you looking for?" aria-label="Search listings" /><Button type="submit">Search</Button></form><div className="category-grid">{categories.isLoading ? <Spinner /> : categories.isError ? <ErrorState message="Categories are unavailable." /> : categories.data?.data.slice(0, 4).map((category, index) => { const Icon = categoryIcons[index % categoryIcons.length]; return <Link key={category.id} to={`/listings?categoryId=${category.id}`} className="category-tile"><span className="category-icon"><Icon size={22} /></span><span>{category.name}</span><ChevronRight size={16} /></Link>; })}</div></section>
      <section className="section-block"><div className="section-heading"><div><span className="section-kicker">Fresh this week</span><h2>Worth A Closer Look</h2></div><Link to="/listings" className="text-link">Browse Everything <ArrowRight size={15} /></Link></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState /> : <ListingGrid listings={listings.data?.data ?? []} />}</section>
      <section className="split-callout"><Card className="selling-callout"><div className="callout-icon"><Box size={20} /></div><div><span className="section-kicker">Clear some space</span><h2>Someone else might love what you no longer need.</h2><p>Make a simple listing in a few minutes. No payment setup required.</p><Link to="/sell" className="text-link">List A Product <ArrowRight size={15} /></Link></div></Card><Card className="values-callout"><div className="callout-icon"><Heart size={20} /></div><div><span className="section-kicker">A calmer marketplace</span><h2>Browse at your own pace.</h2><p>Every listing shows the details that help you decide what is worth a message.</p></div></Card></section>
    </PageContainer>
  </>;
}
