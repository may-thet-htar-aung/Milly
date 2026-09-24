import { ArrowLeft, BadgeCheck, ChevronLeft, ChevronRight, Clock, Eye, MapPin, ScrollText, Share2, ShieldAlert, SquarePen, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatCondition, formatDate, formatPrice } from "../lib/utils";
import { Button, Card, ErrorState, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");
  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id!), enabled: Boolean(id) });
  const imageCount = listing.data?.data?.images.length ?? 0;

  useEffect(() => {
    if (imageCount < 2) return;
    const interval = window.setInterval(() => setSelectedImage((current) => (current + 1) % imageCount), 4000);
    return () => window.clearInterval(interval);
  }, [imageCount]);

  if (listing.isLoading) return <div className="full-state"><Spinner /></div>;
  if (listing.isError || !listing.data?.data) return <PageContainer><ErrorState message={listing.error?.message ?? "This listing is unavailable."} /></PageContainer>;

  const item = listing.data.data;
  const image = item.images[selectedImage] ?? item.images[0];
  const showPreviousImage = () => setSelectedImage((current) => (current - 1 + item.images.length) % item.images.length);
  const showNextImage = () => setSelectedImage((current) => (current + 1) % item.images.length);
  const shareListing = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: `See ${item.title} on Milly`, url: window.location.href });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        setShareFeedback("Link copied");
        window.setTimeout(() => setShareFeedback(""), 1800);
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setShareFeedback("Unable to share");
    }
  };

  return (
    <PageContainer className="detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back to browsing</button>
      <div className="detail-grid">
        <div>
          <div className="detail-main-image">
            {image ? <img src={image.url} alt={image.altText ?? item.title} /> : <div className="image-placeholder large">M</div>}
            {item.images.length > 1 && <>
              <button type="button" className="gallery-arrow gallery-arrow-prev" onClick={showPreviousImage} aria-label="Previous image"><ChevronLeft size={22} /></button>
              <button type="button" className="gallery-arrow gallery-arrow-next" onClick={showNextImage} aria-label="Next image"><ChevronRight size={22} /></button>
            </>}
          </div>
          <div className="thumbnail-row">
            {item.images.map((itemImage, index) => <button type="button" className={index === selectedImage ? "thumbnail selected" : "thumbnail"} onClick={() => setSelectedImage(index)} key={itemImage.id}><img src={itemImage.url} alt="" /></button>)}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-breadcrumb">{item.category.name} <span>/</span> {formatCondition(item.condition)}</div>
          <h1>{item.title}</h1>
          <div className="detail-price">{formatPrice(item.priceMinor, item.currency)}</div>
          <p className="detail-description">{item.description}</p>
          <div className="detail-facts"><span><MapPin size={16} />{item.location}</span><span><Clock size={16} />Listed {formatDate(item.createdAt)}</span><span><Eye size={16} />{item.viewCount} views</span></div>
          <div className="detail-actions"><Button size="lg" onClick={() => navigate("/my-listings")}><ScrollText size={18} />View My Item</Button>{user && (user.id === item.sellerId || user.role === "ADMIN") && <Link to={`/listings/${item.id}/edit`}><Button variant="secondary" size="lg"><SquarePen size={18} />Edit my items</Button></Link>}<Button variant="ghost" size="lg" className="share-button" onClick={() => { void shareListing(); }} aria-label="Share this item" title="Share this item"><Share2 size={20} />{shareFeedback && <span className="share-feedback">{shareFeedback}</span>}</Button></div>
          <Card className="seller-card"><div className="seller-avatar">{item.seller.avatarUrl ? <img src={item.seller.avatarUrl} alt="" /> : <UserRound size={22} />}</div><div className="seller-info"><span className="section-kicker">Seller</span><Link to={`/profile/${item.seller.id}`}><strong>{item.seller.name}</strong></Link><span>{item.seller.location ?? "Milly member"}</span></div><span className="seller-status" role="status" title="Seller account on Milly"><BadgeCheck size={15} aria-hidden="true" />Milly Seller</span></Card>
          <div className="safety-note"><ShieldAlert className="safety-note-icon" size={16} aria-hidden="true" /><span>Meet in a public place and inspect the item before making arrangements.</span></div>
        </div>
      </div>
    </PageContainer>
  );
}
