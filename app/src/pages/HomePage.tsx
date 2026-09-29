import { ArrowRight, Box, Camera, ChevronRight, Heart, Search, ShieldCheck, Sparkles, Sofa } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ListingGrid } from "../components/ListingCard";
import { Button, Card, ErrorState, Input, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";

const categoryIcons = [Camera, Sofa, Box, Sparkles];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const listings = useQuery({ queryKey: ["listings", "featured"], queryFn: () => api.listings(new URLSearchParams({ page: "1", pageSize: "8", sort: "newest" })) });

  const submit = (event: React.FormEvent) => { event.preventDefault(); navigate(`/listings${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`); };
  const startSelling = () => navigate(user ? "/sell" : `/login?next=${encodeURIComponent("/sell")}`);

  return <>
    <section className="hero-section"><PageContainer><div className="hero-grid"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14} />{t("heroEyebrow")}</div><h1>{t("heroTitleBefore")}<em>{t("heroTitleEm")}</em></h1><p>{t("heroBody")}</p><Button className="hero-cta" size="lg" onClick={startSelling}>{t("startSelling")} <ArrowRight size={16} /></Button><div className="hero-note"><ShieldCheck size={16} />{t("heroNote")}</div></div><div className="hero-art"><div className="hero-art-card"><span className="art-label">{t("todaysFind")}</span><img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85" alt={t("artAlt")} /><div className="art-card-copy"><span>{t("artItem")}</span><strong>{t("artCaption")}</strong></div></div><div className="floating-note floating-note-one"><Heart size={16} fill="currentColor" /> {t("lovedBy")}</div><div className="floating-note floating-note-two"><span className="dot" /> {t("freshFinds")}</div></div></div></PageContainer></section>
    <PageContainer>
      <section className="section-block categories-block"><div className="section-heading"><div><span className="section-kicker">{t("startSomewhere")}</span><h2>{t("exploreMood")}</h2></div><Link to="/listings" className="text-link">{t("seeCategories")} <ArrowRight size={15} /></Link></div><form className="toolbar-search mood-search" onSubmit={submit}><Search size={18} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchListings")} /><Button type="submit">{t("search")}</Button></form><div className="category-grid">{categories.isLoading ? <Spinner /> : categories.isError ? <ErrorState message={t("categoriesUnavailable")} /> : categories.data?.data.slice(0, 4).map((category, index) => { const Icon = categoryIcons[index % categoryIcons.length]; return <Link key={category.id} to={`/listings?categoryId=${category.id}`} className="category-tile"><span className="category-icon"><Icon size={22} /></span><span>{category.name}</span><ChevronRight size={16} /></Link>; })}</div></section>
      <section className="section-block"><div className="section-heading"><div><span className="section-kicker">{t("freshWeek")}</span><h2>{t("closerLook")}</h2></div><Link to="/listings" className="text-link">{t("browseEverything")} <ArrowRight size={15} /></Link></div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState /> : <ListingGrid listings={listings.data?.data ?? []} />}</section>
      <section className="split-callout"><Card className="selling-callout"><div className="callout-icon"><Box size={20} /></div><div><span className="section-kicker">{t("clearSpace")}</span><h2>{t("someoneLove")}</h2><p>{t("simpleListing")}</p><Link to="/sell" className="text-link">{t("listProduct")} <ArrowRight size={15} /></Link></div></Card><Card className="values-callout"><div className="callout-icon"><Heart size={20} /></div><div><span className="section-kicker">{t("calmer")}</span><h2>{t("ownPace")}</h2><p>{t("detailsMessage")}</p></div></Card></section>
    </PageContainer>
  </>;
}
