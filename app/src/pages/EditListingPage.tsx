import { ArrowLeft, ImagePlus, Info, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, ErrorState, FormOptionMenu, Input, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { categoryLabel, conditionLabel, useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { minorToPriceInput, priceInputToMinor } from "../lib/utils";

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 5_000_000;

interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
}

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
  reader.readAsDataURL(file);
});

export function EditListingPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id), enabled: Boolean(id) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priceMinor: "", currency: "MMK", condition: "GOOD", categoryId: "", location: "" });
  const [publish, setPublish] = useState(false);
  const [archive, setArchive] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusNotice, setStatusNotice] = useState<"publish" | "archive" | null>(null);

  useEffect(() => {
    const current = listing.data?.data;
    if (!current || initialized) return;
    setForm({ title: current.title, description: current.description, priceMinor: minorToPriceInput(current.priceMinor, current.currency), currency: current.currency, condition: current.condition, categoryId: current.categoryId, location: current.location });
    setPublish(current.status === "ACTIVE");
    setArchive(current.status === "ARCHIVED");
    setAttachments(current.images.map((image) => ({ id: image.id, name: image.altText ?? "Existing photo", dataUrl: image.url })));
    setInitialized(true);
  }, [initialized, listing.data]);

  const update = useMutation({
    mutationFn: async () => {
      const currentStatus = listing.data?.data.status;
      const updated = await api.updateListing(id, { title: form.title, description: form.description, priceMinor: priceInputToMinor(form.priceMinor, form.currency), currency: form.currency, condition: form.condition, categoryId: form.categoryId, location: form.location, images: attachments.map((attachment) => ({ url: attachment.dataUrl, altText: attachment.name })) });
      if (publish && currentStatus !== "ACTIVE") return api.publishListing(id);
      if (archive && currentStatus !== "ARCHIVED") {
        await api.archiveListing(id);
        return { data: { ...updated.data, status: "ARCHIVED" as const } };
      }
      return updated;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["listing", id], result);
      setPublish(result.data.status === "ACTIVE");
      setArchive(result.data.status === "ARCHIVED");
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setError("");
      if (publish) { setSuccess(""); setStatusNotice("publish"); return; }
      if (archive) { setSuccess(""); setStatusNotice("archive"); return; }
      setSuccess("Your listing changes were saved.");
    },
    onError: (caught) => { setError(caught instanceof Error ? caught.message : "Unable to save listing changes."); setSuccess(""); },
  });

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(""); setSuccess("");
    const selectedFiles = Array.from(fileList);
    if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      setError(`You can attach max ${MAX_ATTACHMENTS} images.`);
      return;
    }
    try {
      const nextAttachments = await Promise.all(selectedFiles.map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is larger than 5 MB.`);
        return { id: crypto.randomUUID(), name: file.name, dataUrl: await readAsDataUrl(file) };
      }));
      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to attach that image.");
    }
  };

  const removeAttachment = (attachmentId: string) => { setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId)); setSuccess(""); };
  const canSave = form.title.trim().length >= 3 && form.description.trim().length >= 10 && form.categoryId.length > 0 && form.condition.length > 0 && form.currency.length > 0 && form.location.trim().length >= 2 && Number.isInteger(Number(form.priceMinor)) && Number(form.priceMinor) > 0;
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(""); setSuccess(""); if (!canSave) { setError("Complete all required listing details first."); return; } update.mutate(); };
  const allCategories = categories.data?.data.flatMap((category) => [category, ...(category.children ?? [])]) ?? [];

  if (listing.isLoading) return <PageContainer className="sell-page"><div className="full-state"><Spinner /></div></PageContainer>;
  if (listing.isError || !listing.data?.data) return <PageContainer className="sell-page"><ErrorState message={listing.error instanceof Error ? listing.error.message : "We couldn't load this listing."} /></PageContainer>;

  return <><PageContainer className="sell-page"><Link to={isAdmin ? `/admin/listings/${id}` : "/my-listings"} className="back-link"><ArrowLeft size={16} />{isAdmin ? t("backListing") : t("backListings")}</Link><div className="form-heading"><span className="section-kicker">{t("sellerSpace")}</span><h1>{t("editHeading")}</h1><p>{t("editBody")}</p></div><form className="sell-layout" onSubmit={submit}><Card className="sell-form-card"><div className="form-section details-section"><div className="form-section-heading"><div><h2>{t("tellUs")}</h2><p>{t("updateDetails")}</p></div></div><label className="field-label">{t("title")}<Input value={form.title} onChange={(event) => set("title", event.target.value)} minLength={3} maxLength={120} required /></label><label className="field-label">{t("description")}<textarea className="textarea" value={form.description} onChange={(event) => set("description", event.target.value)} minLength={10} maxLength={5000} rows={5} required /></label><div className="field-row"><label className="field-label">{t("category")}<FormOptionMenu value={form.categoryId} options={[{ value: "", label: t("chooseCategory") }, ...allCategories.map((category) => ({ value: category.id, label: categoryLabel(t, category) }))]} onChange={(value) => set("categoryId", value)} /></label><label className="field-label">{t("condition")}<FormOptionMenu value={form.condition} options={["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((condition) => ({ value: condition, label: conditionLabel(t, condition) }))} onChange={(value) => set("condition", value)} /></label></div></div><div className="form-section"><div className="form-section-heading"><div><h2>{t("setPrice")}</h2><p>{t("editPriceNote")}</p></div></div><div className="field-row"><label className="field-label">{t("price")}<input className="input" type="number" min="1" step="1" value={form.priceMinor} onChange={(event) => set("priceMinor", event.target.value)} required /></label><label className="field-label">{t("currency")}<FormOptionMenu value={form.currency} options={[{ value: "MMK", label: t("mmkOption") }, { value: "USD", label: t("usdOption") }]} onChange={(value) => set("currency", value)} /></label></div><div className="form-hint"><Info size={15} />{t("priceEntryHint")}</div></div><div className="form-section find-section"><div className="form-section-heading"><div><h2>{t("helpFind")}</h2><p>{t("locationPrivacy")}</p></div></div><label className="field-label">{t("location")}<Input value={form.location} onChange={(event) => set("location", event.target.value)} required /></label><label className="field-label attachment-field-label"><span>{t("yourItems")}</span><div className="attachment-dropzone"><label className="attachment-picker">{(attachments.length === 0 || attachments.length >= MAX_ATTACHMENTS) && <ImagePlus size={21} />}<span><strong>{t("chooseUpload")}</strong><small>{t("uploadHint")}</small></span><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} /></label>{attachments.length > 0 && <div className="attachment-grid">{attachments.map((attachment) => <div className="attachment-preview" key={attachment.id} data-tooltip={t("previewItem")}><img src={attachment.dataUrl} alt={attachment.name} /><button type="button" className="attachment-remove" onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeAttachment(attachment.id); }} aria-label={`Remove ${attachment.name}`} title={t("removeItem")}><X size={15} /></button><span title={attachment.name}>{attachment.name}</span></div>)}{attachments.length < MAX_ATTACHMENTS && <label className="attachment-add-more" title={t("addAnother")} data-tooltip={t("addAnother")}><Plus size={40} /><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} aria-label={t("addAnother")} /></label>}</div>}</div><small className="attachment-note"><Info size={14} /><span>{t("photosNote")}</span></small></label></div><div className="form-section"><div className="form-section-heading"><div><h2>{t("listingStatus")}</h2><p>{t("listingStatusBody")}</p></div></div><div className="status-checks"><label className="checkbox-label"><input type="checkbox" checked={publish} onChange={(event) => { setPublish(event.target.checked); if (event.target.checked) setArchive(false); setSuccess(""); }} />{t("publish")}</label><label className="checkbox-label"><input type="checkbox" checked={archive} onChange={(event) => { setArchive(event.target.checked); if (event.target.checked) setPublish(false); setSuccess(""); }} />{t("archive")}</label></div></div><div className="sell-form-footer">{error && <div className="form-error">{error}</div>}{success && <div className="form-success">{success} <Link to={`/listings/${id}`}>View listing</Link></div>}<Button type="submit" size="lg" disabled={update.isPending || !canSave}>{update.isPending ? t("savingChanges") : t("saveChanges")}</Button></div></Card><Card className="sell-side-card"><span className="section-kicker">A small note</span><h2>Your changes stay with this listing.</h2><div className="sell-side-tip"><Info size={16} /><span>Use Publish to show this listing, or Archive to hide it. Save Changes applies the choice.</span></div></Card></form></PageContainer>{statusNotice && <div className="success-popup" role="dialog" aria-modal="true" aria-labelledby="status-success-title"><div className="success-popup-card"><h2 id="status-success-title">{statusNotice === "publish" ? "Listing Published" : "Listing Archived"}</h2><p>{statusNotice === "publish" ? "Your listing is now visible to buyers." : "Your product listing is no longer in public browsing."}</p><div className="success-popup-actions">{isAdmin ? <Button type="button" onClick={() => navigate(`/admin/listings/${id}`)}>Back to Listing</Button> : <><Button type="button" variant="secondary" onClick={() => navigate("/my-listings")}>My Listings</Button><Button type="button" onClick={() => navigate(statusNotice === "publish" ? "/published-products" : "/archive-products")}>{statusNotice === "publish" ? "View published products" : "View archive products"}</Button></>}</div></div></div>}</>;
}
