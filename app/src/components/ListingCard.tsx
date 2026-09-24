import { Eye, Heart, MapPin, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../types";
import { formatCondition, formatListingStatus, formatPrice, listingStatusTone } from "../lib/utils";
import { Badge, Button, Card } from "./ui";

interface ListingCardProps {
  listing: Listing;
  onFavorite?: (listing: Listing) => void;
  showStatus?: boolean;
  renderActions?: (listing: Listing) => ReactNode;
}

export function ListingCard({ listing, onFavorite, showStatus = false, renderActions }: ListingCardProps) {
  const image = listing.images[0];
  return <Card className="listing-card">
    <Link to={`/listings/${listing.id}`} className="listing-image-wrap">
      {image ? <img src={image.url} alt={image.altText ?? listing.title} className="listing-image" /> : <div className="image-placeholder">M</div>}
      <span className="image-condition">{formatCondition(listing.condition)}</span>
    </Link>
    <div className="listing-card-body">
      <div className="listing-card-topline"><div className="listing-card-badges"><Badge tone="green">{listing.currency}</Badge>{showStatus && <Badge tone={listingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge>}</div><span className="listing-category">{listing.category.name}</span></div>
      <Link to={`/listings/${listing.id}`} className="listing-title">{listing.title}</Link>
      <div className="listing-price">{formatPrice(listing.priceMinor, listing.currency)}</div>
      <div className="listing-meta"><span><MapPin size={14} />{listing.location}</span><span><Eye size={14} />{listing.viewCount} views</span></div>
      <div className={renderActions ? "listing-card-actions listing-card-actions-seller" : "listing-card-actions"}>
        {renderActions ? renderActions(listing) : <>{onFavorite && <Button variant="ghost" size="sm" className={listing.isFavorite ? "favorite-active" : "favorite-button"} aria-label={listing.isFavorite ? "Remove from favorites" : "Add to favorites"} onClick={() => onFavorite(listing)}><Heart size={18} fill={listing.isFavorite ? "currentColor" : "none"} /></Button>}<Link to={`/listings/${listing.id}`} className="text-link">View Details <ArrowUpRight size={14} /></Link></>}
      </div>
    </div>
  </Card>;
}

export function ListingGrid({ listings, onFavorite, showStatus, renderActions }: { listings: Listing[]; onFavorite?: (listing: Listing) => void; showStatus?: boolean; renderActions?: (listing: Listing) => ReactNode }) {
  return <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} onFavorite={onFavorite} showStatus={showStatus} renderActions={renderActions} />)}</div>;
}
