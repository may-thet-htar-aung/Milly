import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatCondition } from "../lib/utils";
import { ListingGrid } from "../components/ListingCard";
import { Badge, Button, ErrorState, Input, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import type { Listing } from "../types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "price_asc", label: "Price: Low To High" },
  { value: "price_desc", label: "Price: High To Low" },
] as const;

function OptionMenu({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="sort-menu" ref={rootRef}>
      <button type="button" className="input select sort-menu-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((isOpen) => !isOpen)}>
        {current.label}
      </button>
      {open && (
        <ul className="sort-menu-list" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button type="button" role="option" aria-selected={option.value === current.value} className="sort-menu-option" onClick={() => { onChange(option.value); setOpen(false); }}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const queryString = useMemo(() => new URLSearchParams({ page: "1", pageSize: "24", ...Object.fromEntries(params.entries()) }), [params]);
  const listings = useQuery({ queryKey: ["listings", queryString.toString()], queryFn: () => api.listings(queryString) });

  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete("page"); setParams(next); };
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setFilter("q", searchInput.trim()); };
  const clearFilters = () => { setSearchInput(""); setParams({}); };
  const toggleFavorite = async (listing: Listing) => { if (!user) return; if (listing.isFavorite) await api.unfavorite(listing.id); else await api.favorite(listing.id); await listings.refetch(); };
  const hasFilters = [...params.keys()].length > 0;

  return <PageContainer className="listings-page"><div className="page-heading"><div><span className="section-kicker">The marketplace</span><h1>Find your next good thing.</h1><p>Search across local second-hand listings, with prices shown in the seller's currency.</p></div><div className="results-count">{listings.data?.meta.total ?? "—"} finds</div></div><div className="listing-toolbar"><form className="toolbar-search" onSubmit={submitSearch}><Search size={18} /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search listings" /><Button type="submit">Search</Button></form><div className="toolbar-sort"><SlidersHorizontal size={16} /><OptionMenu value={params.get("sort") ?? "newest"} options={[...SORT_OPTIONS]} onChange={(next) => setFilter("sort", next)} /></div></div><div className="active-filters">{params.get("q") && <Badge>{`“${params.get("q")}"`} <button onClick={() => setFilter("q", "")}><X size={12} /></button></Badge>}{params.get("currency") && <Badge tone="green">{params.get("currency")} <button onClick={() => setFilter("currency", "")}><X size={12} /></button></Badge>}{params.get("condition") && <Badge>{formatCondition(params.get("condition")!)} <button onClick={() => setFilter("condition", "")}><X size={12} /></button></Badge>}{hasFilters && <button className="clear-filters" onClick={clearFilters}>Clear all</button>}</div><div className="browse-layout"><aside className="filter-panel"><div className="filter-title"><Filter size={17} /><strong>Refine Results</strong></div><label className="field-label">Category<OptionMenu value={params.get("categoryId") ?? ""} options={[{ value: "", label: "All Categories" }, ...(categories.data?.data.flatMap((category) => [category, ...(category.children ?? [])]).map((category) => ({ value: category.id, label: category.name })) ?? [])]} onChange={(next) => setFilter("categoryId", next)} /></label><label className="field-label">Currency<OptionMenu value={params.get("currency") ?? ""} options={[{ value: "", label: "USD + MMK" }, { value: "USD", label: "USD" }, { value: "MMK", label: "MMK" }]} onChange={(next) => setFilter("currency", next)} /></label><label className="field-label">Condition<OptionMenu value={params.get("condition") ?? ""} options={[{ value: "", label: "Any Condition" }, ...["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((condition) => ({ value: condition, label: formatCondition(condition) }))]} onChange={(next) => setFilter("condition", next)} /></label><div className="field-label">Price Range<span className="price-inputs"><Input type="number" min="0" placeholder="Min" value={params.get("minPrice") ?? ""} onChange={(event) => setFilter("minPrice", event.target.value)} /><Input type="number" min="0" placeholder="Max" value={params.get("maxPrice") ?? ""} onChange={(event) => setFilter("maxPrice", event.target.value)} /></span><small>USD uses cents; MMK uses whole kyat.</small></div></aside><section className="results-column">{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error.message} /> : listings.data?.data.length ? <ListingGrid listings={listings.data.data} onFavorite={user ? (listing) => { void toggleFavorite(listing); } : undefined} /> : <div className="empty-state"><div className="empty-icon"><Search /></div><h2>No listings found</h2><p>Try another search or clear a filter to see more of Milly.</p><Button variant="outline" onClick={clearFilters}>Reset search</Button></div>}</section></div></PageContainer>;
}
