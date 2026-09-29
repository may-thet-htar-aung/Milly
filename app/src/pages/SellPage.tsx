import { ArrowLeft, ImagePlus, Info, Plus, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { priceInputToMinor } from "../lib/utils";
import { Button, Card, Input, Select } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { conditionLabel, useI18n } from "../i18n";

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
  reader.onerror = () => reject(new Error(`read:${file.name}`));
  reader.readAsDataURL(file);
});

export function SellPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [form, setForm] = useState({ title: "", description: "", priceMinor: "", currency: "MMK", condition: "GOOD", categoryId: "", location: "" });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const create = useMutation({ mutationFn: () => api.createListing({ title: form.title, description: form.description, priceMinor: priceInputToMinor(form.priceMinor, form.currency), currency: form.currency, condition: form.condition, categoryId: form.categoryId, location: form.location, images: attachments.map((attachment) => ({ url: attachment.dataUrl, altText: attachment.name })) }), onSuccess: (result) => navigate(`/listings/${result.data.id}`), onError: (caught) => setError(caught instanceof Error ? caught.message : t("createFailedListing")) });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError("");
    const selectedFiles = Array.from(fileList);
    if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      setError(t("maxImages", { count: MAX_ATTACHMENTS }));
      return;
    }
    try {
      const nextAttachments = await Promise.all(selectedFiles.map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(t("notImage", { name: file.name }));
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(t("tooLarge", { name: file.name }));
        return { id: crypto.randomUUID(), name: file.name, dataUrl: await readAsDataUrl(file) };
      }));
      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (caught) {
      setError(caught instanceof Error ? (caught.message.startsWith("read:") ? t("readFailed", { name: caught.message.slice(5) }) : caught.message) : t("attachFailed"));
    }
  };
  const removeAttachment = (id: string) => setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  const canCreate = form.title.trim().length >= 3 && form.description.trim().length >= 10 && form.categoryId.length > 0 && form.condition.length > 0 && form.currency.length > 0 && form.location.trim().length >= 2 && Number.isInteger(Number(form.priceMinor)) && Number(form.priceMinor) > 0;
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(""); if (!canCreate) { setError(t("completeDetails")); return; } create.mutate(); };
  const allCategories = categories.data?.data.flatMap((category) => [category, ...(category.children ?? [])]) ?? [];
  return <PageContainer className="sell-page"><Link to="/" className="back-link"><ArrowLeft size={16} />{t("backHome")}</Link><div className="form-heading"><span className="section-kicker">{t("passItOn")}</span><h1>{t("listGood")}</h1><p>{t("listGoodBody")}</p></div><form className="sell-layout" onSubmit={submit}><Card className="sell-form-card"><div className="form-progress" aria-label="Listing form progress"><div className="form-progress-track"><span className="form-progress-fill" /></div>{[["01", t("tellUs")], ["02", t("setPrice")], ["03", t("helpFind")]].map(([number, label]) => <div className="form-progress-step" key={number}><span className="form-progress-number">{number}</span><span className="form-progress-label">{label}</span></div>)}</div><div className="form-section details-section"><div className="form-section-heading"><div><h2>{t("tellUs")}</h2><p>{t("clearTitle")}</p></div></div><label className="field-label">{t("title")}<Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder={t("titlePlaceholder")} minLength={3} maxLength={120} required /></label><label className="field-label">{t("description")}<textarea className="textarea" value={form.description} onChange={(event) => set("description", event.target.value)} placeholder={t("descriptionPlaceholder")} minLength={10} maxLength={5000} rows={5} required /></label><div className="field-row"><label className="field-label">{t("category")}<Select value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)} required><option value="">{t("chooseCategory")}</option>{allCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</Select></label><label className="field-label">{t("condition")}<Select value={form.condition} onChange={(event) => set("condition", event.target.value)}>{["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((condition) => <option value={condition} key={condition}>{conditionLabel(t, condition)}</option>)}</Select></label></div></div><div className="form-section"><div className="form-section-heading"><div><h2>{t("setPrice")}</h2><p>{t("priceNote")}</p></div></div><div className="field-row"><label className="field-label">{t("price")}<input className="input" type="number" min="1" step="1" value={form.priceMinor} onChange={(event) => set("priceMinor", event.target.value)} placeholder="12500" required /></label><label className="field-label">{t("currency")}<Select value={form.currency} onChange={(event) => set("currency", event.target.value)}><option value="MMK">{t("mmkOption")}</option><option value="USD">{t("usdOption")}</option></Select></label></div><div className="form-hint"><Info size={15} />{t("priceEntryHint")}</div></div><div className="form-section find-section"><div className="form-section-heading"><div><h2>{t("helpFind")}</h2><p>{t("locationPrivacy")}</p></div></div><label className="field-label">{t("location")}<Input value={form.location} onChange={(event) => set("location", event.target.value)} placeholder={t("locationPlaceholder")} required /></label><div className="field-label attachment-field-label"><span>{t("yourItems")}</span><div className="attachment-dropzone"><label className="attachment-picker">{(attachments.length === 0 || attachments.length >= MAX_ATTACHMENTS) && <ImagePlus size={21} />}<span><strong>{t("chooseUpload")}</strong><small>{t("uploadHint")}</small></span><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} /></label>{attachments.length > 0 && <div className="attachment-grid">{attachments.map((attachment) => <div className="attachment-preview" key={attachment.id} data-tooltip={t("previewItem")}><img src={attachment.dataUrl} alt={attachment.name} /><button type="button" className="attachment-remove" onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeAttachment(attachment.id); }} aria-label={`Remove ${attachment.name}`} title={t("removeItem")}><X size={15} /></button><span title={attachment.name}>{attachment.name}</span></div>)}{attachments.length < MAX_ATTACHMENTS && <label className="attachment-add-more" title={t("addAnother")} data-tooltip={t("addAnother")}><Plus size={40} /><input className="attachment-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={attachments.length >= MAX_ATTACHMENTS} aria-label={t("addAnother")} /></label>}</div>}</div><small className="attachment-note"><Info size={14} /> <span>{t("photosNote")}</span></small></div></div><div className="sell-form-footer">{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={create.isPending || !canCreate}>{create.isPending ? t("savingDraft") : t("createListing")}</Button></div></Card><Card className="sell-side-card"><span className="section-kicker">{t("smallNote")}</span><h2>{t("quietQuestions")}</h2><ul><li>{t("questionCondition")}</li><li>{t("questionIncluded")}</li><li>{t("questionInspect")}</li><li>{t("questionWhy")}</li></ul><div className="sell-side-tip"><Info size={16} /><span>{t("updateLater")}</span></div></Card></form></PageContainer>;
}
