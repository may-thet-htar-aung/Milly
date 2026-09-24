import { ArrowLeft, ImagePlus, Info, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button, Card, ErrorState, Input, Select, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { api } from "../lib/api";

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 1_000_000;

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
  const queryClient = useQueryClient();
  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id), enabled: Boolean(id) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priceMinor: "", currency: "MMK", condition: "GOOD", categoryId: "", location: "" });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const current = listing.data?.data;
    if (!current || initialized) return;
    setForm({ title: current.title, description: current.description, priceMinor: String(current.priceMinor), currency: current.currency, condition: current.condition, categoryId: current.categoryId, location: current.location });
    setAttachments(current.images.map((image) => ({ id: image.id, name: image.altText ?? "Existing photo", dataUrl: image.url })));
    setInitialized(true);
  }, [initialized, listing.data]);

  const update = useMutation({
    mutationFn: () => api.updateListing(id, { title: form.title, description: form.description, priceMinor: Number(form.priceMinor), currency: form.currency, condition: form.condition, categoryId: form.categoryId, location: form.location, images: attachments.map((attachment) => ({ url: attachment.dataUrl, altText: attachment.name })) }),
    onSuccess: (result) => {
      queryClient.setQueryData(["listing", id], result);
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setSuccess("Your listing changes were saved.");
      setError("");
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
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is larger than 1 MB.`);
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

  return <PageContainer className="sell-page"><Link to="/my-listings" className="back-link"><ArrowLeft size={16} />Back to My Listings</Link><div className="form-heading"><span className="section-kicker">Your seller space</span><h1>Edit Your Listing.</h1><p>Keep the details accurate so buyers know what to expect.</p></div><form className="sell-layout" onSubmit={submit}><Card className="sell-form-card"><div className="form-section details-section"><div className="form-section-heading"><div><h2>Tell us about it</h2><p>Update the title and description when the item details change.</p></div></div><label className="field-label">Title<Input value={form.title} onChange={(event) => set("title", event.target.value)} minLength={3} maxLength={120} required /></label><label className="field-label">Description<textarea className="textarea" value={form.description} onChange={(event) => set("description", event.target.value)} minLength={10} maxLength={5000} rows={5} required /></label><div className="field-row"><label className="field-label">Category<Select value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)} required><option value="">Choose a category</option>{allCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</Select></label><label className="field-label">Condition<Select value={form.condition} onChange={(event) => set("condition", event.target.value)}>{["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((condition) => <option value={condition} key={condition}>{condition.replaceAll("_", " ")}</option>)}</Select></label></div></div><div className="form-section"><div className="form-section-heading"><div><h2>Set the price</h2><p>Prices remain in the currency selected for this listing.</p></div></div><div className="field-row"><label className="field-label">Price<input className="input" type="number" min="1" step="1" value={form.priceMinor} onChange={(event) => set("priceMinor", event.target.value)} required /></label><label className="field-label">Currency<Select value={form.currency} onChange={(event) => set("currency", event.target.value)}><option value="MMK">MMK — Kyat</option><option value="USD">USD — Dollars</option></Select></label></div><div className="form-hint"><Info size={15} />USD is entered in cents; MMK is entered in whole kyat.</div></div><div className="form-section find-section"><div className="form-section-heading"><div><h2>Help people find it</h2><p>Keep location broad enough to protect your privacy.</p></div></div><label className="field-label">Location<Input value={form.location} onChange={(event) => set("location", event.target.value)} required /></label><label className="field-label attachment-field-label"><span>Your Items</span><div className="attachment-dropzone"><label className="attachment-picker">{(attachments.length === 0 || attachments.length >= MAX_ATTACHMENTS) && <ImagePlus size={21} />}<span><strong>Choose Your Items to Upload</strong><small>Accepted formats: PNG, JPG and WebP (max 5 images - max 1 MB each)</small></span><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} /></label>{attachments.length > 0 && <div className="attachment-grid">{attachments.map((attachment) => <div className="attachment-preview" key={attachment.id} data-tooltip="Preview attached item"><img src={attachment.dataUrl} alt={attachment.name} /><button type="button" className="attachment-remove" onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeAttachment(attachment.id); }} aria-label={`Remove ${attachment.name}`} title="Remove attached item"><X size={15} /></button><span title={attachment.name}>{attachment.name}</span></div>)}{attachments.length < MAX_ATTACHMENTS && <label className="attachment-add-more" title="Add another item" data-tooltip="Add another item"><Plus size={40} /><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} aria-label="Add another item" /></label>}</div>}</div><small className="attachment-note"><Info size={14} /><span>Photos will be saved with this listing on this device.</span></small></label></div>{error && <div className="form-error">{error}</div>}{success && <div className="form-success">{success} <Link to={`/listings/${id}`}>View listing</Link></div>}<Button type="submit" size="lg" disabled={update.isPending || !canSave}>{update.isPending ? "Saving Changes…" : "Save Changes"}</Button></Card><Card className="sell-side-card"><span className="section-kicker">A small note</span><h2>Your changes stay with this listing.</h2><div className="sell-side-tip"><Info size={16} /><span>Publishing and status controls are available from My Listings.</span></div></Card></form></PageContainer>;
}
