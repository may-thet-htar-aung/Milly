import { ArrowLeft, ImagePlus, Info, Plus, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { priceInputToMinor } from "../lib/utils";
import { Button, Card, Input, Select } from "../components/ui";
import { PageContainer } from "../components/Layout";

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

export function SellPage() {
  const navigate = useNavigate();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [form, setForm] = useState({ title: "", description: "", priceMinor: "", currency: "MMK", condition: "GOOD", categoryId: "", location: "" });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const create = useMutation({ mutationFn: () => api.createListing({ title: form.title, description: form.description, priceMinor: priceInputToMinor(form.priceMinor, form.currency), currency: form.currency, condition: form.condition, categoryId: form.categoryId, location: form.location, images: attachments.map((attachment) => ({ url: attachment.dataUrl, altText: attachment.name })) }), onSuccess: (result) => navigate(`/listings/${result.data.id}`), onError: (caught) => setError(caught instanceof Error ? caught.message : "Unable to create listing.") });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError("");
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
  const removeAttachment = (id: string) => setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  const canCreate = form.title.trim().length >= 3 && form.description.trim().length >= 10 && form.categoryId.length > 0 && form.condition.length > 0 && form.currency.length > 0 && form.location.trim().length >= 2 && Number.isInteger(Number(form.priceMinor)) && Number(form.priceMinor) > 0;
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(""); if (!canCreate) { setError("Complete all required listing details first."); return; } create.mutate(); };
  const allCategories = categories.data?.data.flatMap((category) => [category, ...(category.children ?? [])]) ?? [];
  return <PageContainer className="sell-page"><Link to="/" className="back-link"><ArrowLeft size={16} />Back to home</Link><div className="form-heading"><span className="section-kicker">Pass it on</span><h1>List something good.</h1><p>Start with the details someone would want to know before sending a message.</p></div><form className="sell-layout" onSubmit={submit}><Card className="sell-form-card"><div className="form-progress" aria-label="Listing form progress"><div className="form-progress-track"><span className="form-progress-fill" /></div>{[["01", "Tell us about it"], ["02", "Set the price"], ["03", "Help people find it"]].map(([number, label]) => <div className="form-progress-step" key={number}><span className="form-progress-number">{number}</span><span className="form-progress-label">{label}</span></div>)}</div><div className="form-section details-section"><div className="form-section-heading"><div><h2>Tell us about it</h2><p>A clear title and honest description make a better first impression.</p></div></div><label className="field-label">Title<Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="e.g. Lightly used wireless headphones" minLength={3} maxLength={120} required /></label><label className="field-label">Description<textarea className="textarea" value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="What should the next owner know?" minLength={10} maxLength={5000} rows={5} required /></label><div className="field-row"><label className="field-label">Category<Select value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)} required><option value="">Choose a category</option>{allCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</Select></label><label className="field-label">Condition<Select value={form.condition} onChange={(event) => set("condition", event.target.value)}>{["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((condition) => <option value={condition} key={condition}>{condition.replaceAll("_", " ")}</option>)}</Select></label></div></div><div className="form-section"><div className="form-section-heading"><div><h2>Set the price</h2><p>Milly does not process payment yet. This is the price you want to show.</p></div></div><div className="field-row"><label className="field-label">Price<input className="input" type="number" min="1" step="1" value={form.priceMinor} onChange={(event) => set("priceMinor", event.target.value)} placeholder="12500" required /></label><label className="field-label">Currency<Select value={form.currency} onChange={(event) => set("currency", event.target.value)}><option value="MMK">MMK — Kyat</option><option value="USD">USD — Dollars</option></Select></label></div><div className="form-hint"><Info size={15} />Enter USD in dollars. MMK is entered in whole kyat.</div></div><div className="form-section find-section"><div className="form-section-heading"><div><h2>Help people find it</h2><p>Keep location broad enough to protect your privacy.</p></div></div><label className="field-label">Location<Input value={form.location} onChange={(event) => set("location", event.target.value)} placeholder="e.g. Yangon" required /></label><div className="field-label attachment-field-label"><span>Your Items</span><div className="attachment-dropzone"><label className="attachment-picker">{(attachments.length === 0 || attachments.length >= MAX_ATTACHMENTS) && <ImagePlus size={21} />}<span><strong>Choose Your Items to Upload</strong><small>Accepted formats: PNG, JPG and WebP (max 5 images - max 5 MB each)</small></span><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} /></label>{attachments.length > 0 && <div className="attachment-grid">{attachments.map((attachment) => <div className="attachment-preview" key={attachment.id} data-tooltip="Preview attached item"><img src={attachment.dataUrl} alt={attachment.name} /><button type="button" className="attachment-remove" onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeAttachment(attachment.id); }} aria-label={`Remove ${attachment.name}`} title="Remove attached item"><X size={15} /></button><span title={attachment.name}>{attachment.name}</span></div>)}{attachments.length < MAX_ATTACHMENTS && <label className="attachment-add-more" title="Add another item" data-tooltip="Add another item"><Plus size={40} /><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} aria-label="Add another item" /></label>}</div>}</div><small className="attachment-note"><Info size={14} /> <span>Photos will be saved with this listings on this device.</span></small></div></div><div className="sell-form-footer">{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={create.isPending || !canCreate}>{create.isPending ? "Saving draft…" : "Create listing"}</Button></div></Card><Card className="sell-side-card"><span className="section-kicker">A small note</span><h2>Good listings answer the quiet questions.</h2><ul><li>What condition is it really in?</li><li>What is included?</li><li>Where can someone inspect it?</li><li>Why are you passing it on?</li></ul><div className="sell-side-tip"><Info size={16} /><span>You can update or archive your listing later from My listings.</span></div></Card></form></PageContainer>;
}
