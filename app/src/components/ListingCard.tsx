import { Heart, MapPin, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Listing } from "../types";
import { formatCondition, formatPrice } from "../lib/utils";
import { Badge, Button, Card } from "./ui";

export function ListingCard({ listing, onFavorite }: { listing: Listing; onFavorite?: (listing: Listing) => void }) {
  const image = listing.images[0];
  return <Card className="listing-card">
    <Link to={`/listings/${listing.id}`} className="listing-image-wrap">
      {image ? <img src={image.url} alt={image.altText ?? listing.title} className="listing-image" /> : <div className="image-placeholder">M</div>}
      <span className="image-condition">{formatCondition(listing.condition)}</span>
    </Link>
    <div className="listing-card-body">
      <div className="listing-card-topline"><Badge tone={listing.currency === "USD" ? "green" : "pink"}>{listing.currency}</Badge><span className="listing-category">{listing.category.name}</span></div>
      <Link to={`/listings/${listing.id}`} className="listing-title">{listing.title}</Link>
      <div className="listing-price">{formatPrice(listing.priceMinor, listing.currency)}</div>
      <div className="listing-meta"><span><MapPin size={14} />{listing.location}</span><span>{listing.viewCount} views</span></div>
      <div className="listing-card-actions">
        <Link to={`/listings/${listing.id}`} className="text-link">View details <ArrowUpRight size={14} /></Link>
        {onFavorite && <Button variant="ghost" size="sm" className={listing.isFavorite ? "favorite-active" : "favorite-button"} aria-label={listing.isFavorite ? "Remove from favorites" : "Add to favorites"} onClick={() => onFavorite(listing)}><Heart size={18} fill={listing.isFavorite ? "currentColor" : "none"} /></Button>}
      </div>
    </div>
  </Card>;
}

export function ListingGrid({ listings, onFavorite }: { listings: Listing[]; onFavorite?: (listing: Listing) => void }) {
  return <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} onFavorite={onFavorite} />)}</div>;
}
