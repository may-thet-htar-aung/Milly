import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleCheck, EllipsisVertical, Eye, EyeOff, Flag, LayoutList, ShieldCheck, SquarePen, UserRound, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, Input, Spinner } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatCondition, formatDate, formatListingStatus, formatPrice, listingStatusTone } from "../lib/utils";
import type { AdminUser, ListingStatus, ReportStatus } from "../types";

const listingFilters: { value: "" | ListingStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "ARCHIVED", label: "Archived" },
];

const reportFilters: { value: "" | ReportStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Open" },
  { value: "REVIEWING", label: "In Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

const reportStatusLabel = (status: ReportStatus) => reportFilters.find((filter) => filter.value === status)?.label ?? status;

function AdminBreadcrumb({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  return <nav className="admin-breadcrumb" aria-label="Breadcrumb">{crumbs.map((crumb, index) => <span key={`${crumb.label}-${index}`}>{index > 0 && <span className="admin-breadcrumb-sep" aria-hidden="true">/</span>}{crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</span>)}</nav>;
}

function AdminHeading({ kicker, title, text, crumbs }: { kicker: string; title: string; text: string; crumbs?: { label: string; to?: string }[] }) {
  return <div className="page-heading"><div>{crumbs && <AdminBreadcrumb crumbs={crumbs} />}<span className="section-kicker">{kicker}</span><h1>{title}</h1>{text && <p>{text}</p>}</div></div>;
}

export function AdminDashboardPage() {
  const listings = useQuery({ queryKey: ["admin-listings", "recent"], queryFn: () => api.adminListings(new URLSearchParams({ page: "1", pageSize: "5" })) });
  const active = useQuery({ queryKey: ["admin-listings", "active-count"], queryFn: () => api.adminListings(new URLSearchParams({ status: "ACTIVE", page: "1", pageSize: "1" })) });
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: api.adminReports });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const openReports = (reports.data?.data ?? []).filter((report) => report.status === "PENDING" || report.status === "REVIEWING");
  const reportedListings = new Set((reports.data?.data ?? []).map((report) => report.listing?.id).filter(Boolean)).size;
  const sellers = (users.data?.data ?? []).filter((account) => account.role === "USER");
  const metrics = [
    { label: "Total Listings", value: listings.data?.meta.total, icon: LayoutList },
    { label: "Active Listings", value: active.data?.meta.total, icon: CircleCheck },
    { label: "Reported Listings", value: reports.isSuccess ? reportedListings : undefined, icon: Flag },
    { label: "Open Reports", value: reports.isSuccess ? openReports.length : undefined, icon: ShieldCheck },
    { label: "Total Sellers", value: users.isSuccess ? sellers.length : undefined, icon: Users },
  ];
  const loading = listings.isLoading || reports.isLoading || users.isLoading;
  return <PageContainer className="account-page admin-page"><AdminHeading kicker="Marketplace management" title="Admin Dashboard" text="Review listings, reports, and accounts." crumbs={[{ label: "Dashboard" }]} />{loading ? <div className="full-state"><Spinner /></div> : listings.isError || reports.isError || users.isError ? <ErrorState message="The dashboard could not be loaded." /> : <><div className="admin-metrics">{metrics.map((metric) => { const Icon = metric.icon; return <Card key={metric.label}><span className="admin-metric-icon"><Icon size={16} /></span><span>{metric.label}</span><strong>{metric.value ?? "—"}</strong></Card>; })}</div><div className="admin-split"><div className="admin-column"><section><div className="admin-panel-box"><h2>Recent Reports</h2><p className="admin-panel-note">Showing the 5 most recently submitted reports.</p>{openReports.length ? <ul className="admin-task-list admin-task-scroll">{openReports.slice(0, 5).map((report) => <li key={report.id}><Link to={`/admin/reports/${report.id}`}><span className="admin-task-icon"><Flag size={18} /></span><span className="admin-task-copy"><strong>{report.listing?.title ?? report.reportedUser?.name ?? "Report"}</strong><span><Badge tone={report.status === "RESOLVED" ? "green" : report.status === "PENDING" ? "amber" : report.status === "DISMISSED" ? "pink" : "default"}>{reportStatusLabel(report.status)}</Badge><span>{formatDate(report.createdAt)}</span></span></span><span className="admin-task-action">Reported by : {report.reporter.name}</span></Link></li>)}</ul> : <p className="admin-empty">No open reports.</p>}<Link className="admin-view-all" to="/admin/reports">View All <ArrowRight size={15} /></Link></div></section><section><div className="admin-panel-box"><h2>Recent Sellers</h2><p className="admin-panel-note">Showing the 5 most recently joined sellers.</p>{sellers.length ? <ul className="admin-task-list admin-task-scroll">{sellers.slice(0, 5).map((seller) => <li key={seller.id}><Link to={`/admin/users/${seller.id}`}><span className="admin-task-icon"><UserRound size={18} /></span><span className="admin-task-copy"><strong>{seller.name}</strong><span>Joined {formatDate(seller.createdAt)}</span></span><span className="admin-task-action">{seller.listingCount} listings</span></Link></li>)}</ul> : <p className="admin-empty">No sellers yet.</p>}<Link className="admin-view-all" to="/admin/users">View All <ArrowRight size={15} /></Link></div></section></div><section><div className="admin-panel-box"><h2>Recent Listings</h2><p className="admin-panel-note">Showing the 5 most recently created listings.</p>{listings.data?.data.length ? <ul className="admin-task-list admin-task-scroll">{listings.data.data.map((listing) => <li key={listing.id}><Link to={`/admin/listings/${listing.id}`}><span className="admin-task-icon"><LayoutList size={18} /></span><span className="admin-task-copy"><strong>{listing.title}</strong><span><Badge tone={listingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge><span>{formatDate(listing.createdAt)}</span></span></span><span className="admin-task-action">{listing.seller.name}</span></Link></li>)}</ul> : <p className="admin-empty">No listings yet.</p>}<Link className="admin-view-all" to="/admin/listings">View All <ArrowRight size={15} /></Link></div></section></div></>}</PageContainer>;
}

export function AdminListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerId = searchParams.get("sellerId") ?? "";
  const [status, setStatus] = useState<"" | ListingStatus>("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (status) params.set("status", status);
  if (query) params.set("q", query);
  if (sellerId) params.set("sellerId", sellerId);
  const listings = useQuery({ queryKey: ["admin-listings", params.toString()], queryFn: () => api.adminListings(params) });
  const seller = useQuery({ queryKey: ["admin-user", sellerId], queryFn: () => api.adminUser(sellerId), enabled: Boolean(sellerId) });
  const sellerName = seller.data?.data.name ?? listings.data?.data[0]?.seller.name;
  const navigate = useNavigate();
  const totalPages = listings.data?.meta.totalPages ?? 1;
  const showAllListings = () => { const next = new URLSearchParams(searchParams); next.delete("sellerId"); setSearchParams(next); setPage(1); };
  return <PageContainer className="account-page admin-page"><AdminHeading kicker="Marketplace management" title="Listings" text={sellerId ? "" : "Manage and review all listings on the marketplace."} crumbs={sellerId ? [{ label: "Dashboard", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: "Listings" }] : [{ label: "Dashboard", to: "/admin" }, { label: "Listings" }]} />{sellerId && <p className="admin-seller-filter"><span>Showing <strong>{sellerName ?? "this seller"}'s</strong> listings.</span><button type="button" onClick={showAllListings}><span>Show All Listings</span><ArrowRight size={15} /></button></p>}<form className="toolbar-search admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Listings" aria-label="Search listings" /><Button type="submit">Search</Button></form><div className="listing-filters" role="tablist">{listingFilters.map((filter) => <button type="button" key={filter.label} className={status === filter.value ? "listing-filter active" : "listing-filter"} onClick={() => { setPage(1); setStatus(filter.value); }}>{filter.label}</button>)}</div>{listings.isLoading ? <div className="full-state"><Spinner /></div> : listings.isError ? <ErrorState message={listings.error.message} /> : listings.data?.data.length ? <><table className="admin-data-table admin-listings-table"><thead><tr><th>Listing</th><th>Seller</th><th>Status</th><th>Price</th><th>Details</th></tr></thead><tbody>{listings.data.data.map((listing) => <tr key={listing.id} onClick={() => navigate(`/admin/listings/${listing.id}`)}><td>{listing.title}</td><td>{listing.seller.name}</td><td>{listing.hiddenAt ? <Badge><EyeOff size={11} />Hidden</Badge> : <Badge tone={listingStatusTone(listing.status)}>{formatListingStatus(listing.status)}</Badge>}</td><td>{formatPrice(listing.priceMinor, listing.currency)}</td><td onClick={(event) => event.stopPropagation()}><Link className="admin-icon-action" data-tooltip="View" aria-label="View" to={`/admin/listings/${listing.id}`}><Eye size={16} /></Link></td></tr>)}</tbody></table><nav className="admin-pagination" aria-label="Listing pages"><button type="button" className="admin-page-arrow" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={18} fill="currentColor" /></button><div className="admin-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === page ? "admin-page-number active" : "admin-page-number"} onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined}>{pageNumber}</button>)}</div><button type="button" className="admin-page-arrow" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={18} fill="currentColor" /></button></nav></> : <div className="empty-state"><h2>{query ? "No listings match your search." : "No listings found."}</h2>{!query && <p>Try changing your search or filter.</p>}</div>}</PageContainer>;
}

export function AdminListingDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id), enabled: Boolean(id) });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmHide, setConfirmHide] = useState(false);
  const refresh = async (message: string) => { setError(""); setNotice(message); setConfirmHide(false); await queryClient.invalidateQueries({ queryKey: ["listing", id] }); await queryClient.invalidateQueries({ queryKey: ["admin-listings"] }); };
  const visibility = useMutation({ mutationFn: (hidden: boolean) => api.setListingVisibility(id, hidden), onSuccess: (_data, hidden) => refresh(hidden ? "Listing hidden." : "Listing visible again."), onError: (caught) => { setConfirmHide(false); setError(caught instanceof Error ? caught.message : "Unable to update this listing."); } });
  const item = listing.data?.data;
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 3200); return () => window.clearTimeout(timer); }, [notice]);
  if (listing.isLoading) return <PageContainer className="account-page"><div className="full-state"><Spinner /></div></PageContainer>;
  if (listing.isError || !item) return <PageContainer className="account-page"><ErrorState message={listing.error instanceof Error ? listing.error.message : "Listing not found."} /></PageContainer>;
  const hidden = Boolean(item.hiddenAt);
  return <PageContainer className="account-page admin-page"><StatusToast message={notice} /><AdminHeading kicker="Listing management" title={item.title} text={`${item.category.name} · ${formatListingStatus(item.status)}`} crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Listings", to: "/admin/listings" }, { label: item.title }]} /><div className="admin-detail"><div>{item.images[0] ? <img className="admin-photo" src={item.images[0].url} alt="" /> : <div className="image-placeholder large" />}<p className="detail-description">{item.description}</p></div><Card className="admin-side admin-listing-side"><p><span>Price</span><strong>{formatPrice(item.priceMinor, item.currency)}</strong></p><p><span>Location</span><strong>{item.location}</strong></p><p><span>Seller</span><Link to={`/admin/users/${item.sellerId}`}><strong>{item.seller.name}</strong></Link></p><p><span>Created</span><strong>{formatDate(item.createdAt)}</strong></p><p><span>Status</span><Badge tone={listingStatusTone(item.status)}>{formatListingStatus(item.status)}</Badge></p>{hidden && <p className="admin-hidden-note">Hidden from the marketplace. The seller can still see this listing.</p>}{error && <div className="form-error">{error}</div>}<div className="admin-actions"><Button variant="outline" disabled={visibility.isPending} onClick={() => { setError(""); setNotice(""); setConfirmHide(true); }}>{hidden ? "Unhide Listing" : "Hide Listing"}</Button><Link to={`/admin/users/${item.sellerId}`}><Button>View Seller</Button></Link></div>{confirmHide && <div className="success-popup" role="dialog" aria-modal="true" aria-labelledby="hide-listing-title"><div className="success-popup-card"><h2 id="hide-listing-title">{hidden ? "Unhide listing?" : "Hide listing?"}</h2><p>{hidden ? "This listing will appear on the marketplace again." : "This listing will no longer appear on the marketplace. The seller can still see it in their listings."}</p>{error && <div className="form-error">{error}</div>}<div className="success-popup-actions"><Button variant="outline" className="account-status-cancel" disabled={visibility.isPending} onClick={() => setConfirmHide(false)}>Cancel</Button><Button disabled={visibility.isPending} onClick={() => visibility.mutate(!hidden)}>{visibility.isPending ? (hidden ? "Unhiding…" : "Hiding…") : (hidden ? "Unhide Listing" : "Hide Listing")}</Button></div></div></div>}</Card></div></PageContainer>;
}

function StatusToast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="success-toast" role="status"><Check size={18} />{message}</div>;
}

export function AdminReportsPage() {
  const [status, setStatus] = useState<"" | ReportStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: api.adminReports });
  const needle = search.trim().toLowerCase();
  const filtered = (reports.data?.data ?? []).filter((report) => (!status || report.status === status) && (!needle || `${report.reason} ${report.listing?.title ?? ""} ${report.reporter.name} ${report.reportedUser?.name ?? ""}`.toLowerCase().includes(needle)));
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const navigate = useNavigate();
  return <PageContainer className="account-page admin-page"><AdminHeading kicker="Moderation" title="Reports" text="Review reported listings and sellers, then record a moderation decision." crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Reports" }]} /><form className="toolbar-search admin-search" onSubmit={(event) => event.preventDefault()}><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Reports" aria-label="Search reports" /><Button type="submit">Search</Button></form><div className="listing-filters" role="tablist">{reportFilters.map((filter) => <button type="button" key={filter.label} className={status === filter.value ? "listing-filter active" : "listing-filter"} onClick={() => { setPage(1); setStatus(filter.value); }}>{filter.label}</button>)}</div>{reports.isLoading ? <div className="full-state"><Spinner /></div> : reports.isError ? <ErrorState message={reports.error.message} /> : visible.length ? <><table className="admin-data-table admin-reports-table"><thead><tr><th>Date</th><th>Reporter</th><th>Reason</th><th>Listing Name</th><th>Status</th><th>Details</th></tr></thead><tbody>{visible.map((report) => <tr key={report.id} onClick={() => navigate(`/admin/reports/${report.id}`)}><td>{formatDate(report.createdAt)}</td><td>{report.reporter.name}</td><td>{formatCondition(report.reason)}</td><td>{report.listing?.title ?? "—"}</td><td><Badge tone={report.status === "RESOLVED" ? "green" : report.status === "PENDING" ? "amber" : report.status === "DISMISSED" ? "pink" : "default"}>{reportStatusLabel(report.status)}</Badge></td><td onClick={(event) => event.stopPropagation()}><Link className="admin-icon-action" data-tooltip="View" aria-label="View" to={`/admin/reports/${report.id}`}><Eye size={16} /></Link></td></tr>)}</tbody></table><nav className="admin-pagination" aria-label="Report pages"><button type="button" className="admin-page-arrow" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={18} fill="currentColor" /></button><div className="admin-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === currentPage ? "admin-page-number active" : "admin-page-number"} onClick={() => setPage(pageNumber)} aria-current={pageNumber === currentPage ? "page" : undefined}>{pageNumber}</button>)}</div><button type="button" className="admin-page-arrow" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={18} fill="currentColor" /></button></nav></> : <div className="empty-state"><h2>No reports found</h2><p>Reports in this view will show up here.</p></div>}</PageContainer>;
}

export function AdminReportDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const leaveTimer = useRef<number | null>(null);
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: api.adminReports });
  const report = reports.data?.data.find((item) => item.id === id);
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const selected = status || report?.status || "";
  useEffect(() => () => { if (leaveTimer.current) window.clearTimeout(leaveTimer.current); }, []);
  const update = useMutation({
    mutationFn: (next: ReportStatus) => api.updateReport(id, next),
    onSuccess: async () => {
      setError("");
      setToast("Report status updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      leaveTimer.current = window.setTimeout(() => navigate("/admin/reports"), 900);
    },
    onError: (caught) => { setToast(""); setError(caught instanceof Error ? caught.message : "Unable to update this report."); },
  });
  if (reports.isLoading) return <PageContainer className="account-page"><div className="full-state"><Spinner /></div></PageContainer>;
  if (reports.isError) return <PageContainer className="account-page"><ErrorState message={reports.error.message} /></PageContainer>;
  if (!report) return <PageContainer className="account-page"><ErrorState message="Report not found." /></PageContainer>;
  const submitStatus = () => {
    if (!selected || selected === report.status || update.isPending) return;
    update.mutate(selected);
  };
  return (
    <PageContainer className="account-page admin-page">
      <StatusToast message={toast} />
      <AdminHeading kicker="Report detail" title={formatCondition(report.reason)} text={reportStatusLabel(report.status)} crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Reports", to: "/admin/reports" }, { label: formatCondition(report.reason) }]} />
      <Card className="admin-side admin-account-card">
        <section className="admin-account-section">
          <div className="admin-section-heading"><h2>Report Information</h2></div>
          <p><span>Reason</span><strong>{formatCondition(report.reason)}</strong></p>
          {report.details && <p><span>Details</span><strong>{report.details}</strong></p>}
          <p><span>Reported Date</span><strong>{formatDate(report.createdAt)}</strong></p>
          <p><span>Status</span><Badge tone={report.status === "RESOLVED" ? "green" : report.status === "PENDING" ? "amber" : report.status === "DISMISSED" ? "pink" : "default"}>{reportStatusLabel(report.status)}</Badge></p>
          <p><span>Reporter</span><strong>{report.reporter.name}</strong></p>
        </section>
        <section className="admin-account-section">
          <div className="admin-section-heading"><h2>Reported Target</h2></div>
          {report.listing ? <p><span>Reported Listing</span><strong>{report.listing.title}</strong><Link className="text-link" to={`/admin/listings/${report.listing.id}`}>View Listing</Link></p> : <p className="admin-empty">No listing is associated with this report.</p>}
          {report.reportedUser ? <p><span>Reported Seller</span><span className="admin-target-name"><strong>{report.reportedUser.name}</strong><Link className="admin-icon-action" data-tooltip="View Seller" aria-label="View Seller" to={`/admin/users/${report.reportedUser.id}`}><Eye size={16} /></Link></span></p> : <p className="admin-empty">No seller is associated with this report.</p>}
        </section>
        <section className="admin-account-section">
          <div className="admin-section-heading"><h2>Admin Action</h2></div>
          <fieldset className="admin-status-options"><legend>Status</legend>{reportFilters.filter((filter) => filter.value).map((filter) => <label key={filter.value}><input type="radio" name="report-status" value={filter.value} checked={selected === filter.value} onChange={() => setStatus(filter.value as ReportStatus)} />{filter.label}</label>)}</fieldset>
          {error && <div className="form-error">{error}</div>}
          <div className="admin-actions admin-report-actions">
            <Button disabled={!selected || selected === report.status || update.isPending} onClick={submitStatus}>{update.isPending ? "Updating…" : "Update Status"}</Button>
          </div>
        </section>
      </Card>
    </PageContainer>
  );
}

const accountStatusLabel = (isActive: boolean) => (isActive ? "Active" : "Deactivated");

function AccountStatusDialog({ active, pending, error, onCancel, onConfirm }: { active: boolean; pending: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="success-popup" role="dialog" aria-modal="true" aria-labelledby="account-status-title">
      <div className="success-popup-card">
        <h2 id="account-status-title">{active ? "Deactivate seller account?" : "Reactivate seller account?"}</h2>
        <p>{active ? "This will prevent this seller from using their account." : "This will allow the seller to use their account again."}</p>
        {error && <div className="form-error">{error}</div>}
        <div className="success-popup-actions">
          <Button variant="outline" className="account-status-cancel" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button variant={active ? "danger" : "primary"} disabled={pending} onClick={onConfirm}>{pending ? (active ? "Deactivating…" : "Reactivating…") : (active ? "Deactivate Account" : "Reactivate Account")}</Button>
        </div>
      </div>
    </div>
  );
}

function SellerActionsMenu({ user }: { user: AdminUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const nextActive = !user.isActive;
  const update = useMutation({
    mutationFn: () => api.updateUserStatus(user.id, nextActive),
    onSuccess: async () => {
      setError("");
      setConfirming(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user", user.id] });
    },
    onError: (caught) => setError(caught instanceof Error ? caught.message : "Unable to update this account."),
  });
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="admin-row-menu" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button type="button" className="admin-icon-action" aria-label="Account actions" aria-haspopup="menu" aria-expanded={open} onClick={(event) => { event.stopPropagation(); setOpen((current) => !current); }}><EllipsisVertical size={16} /></button>
      {open && (
        <ul className="sort-menu-list" role="menu">
          <li><button type="button" role="menuitem" className="sort-menu-option" onClick={() => navigate(`/admin/users/${user.id}`)}>View Details</button></li>
          {user.role === "USER" && <li><button type="button" role="menuitem" className={user.isActive ? "sort-menu-option danger" : "sort-menu-option"} onClick={() => { setOpen(false); setError(""); setConfirming(true); }}>{user.isActive ? "Deactivate Account" : "Reactivate Account"}</button></li>}
        </ul>
      )}
      {confirming && <AccountStatusDialog active={user.isActive} pending={update.isPending} error={error} onCancel={() => { if (!update.isPending) { setConfirming(false); setError(""); } }} onConfirm={() => update.mutate()} />}
    </div>
  );
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const needle = search.trim().toLowerCase();
  const filtered = (users.data?.data ?? []).filter((user) => !needle || `${user.name} ${user.email}`.toLowerCase().includes(needle));
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <PageContainer className="account-page admin-page">
      <AdminHeading kicker="Accounts" title="Users" text="Review seller accounts and manage account status when needed." crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Users" }]} />
      <form className="toolbar-search admin-search" onSubmit={(event) => event.preventDefault()}><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Users" aria-label="Search users" /><Button type="submit">Search</Button></form>
      {users.isLoading ? <div className="full-state"><Spinner /></div> : users.isError ? <ErrorState message={users.error.message} /> : visible.length ? (
        <>
          <table className="admin-data-table admin-users-table">
            <thead><tr><th>Seller Name</th><th>Joined Date</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{visible.map((user) => <tr key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)}><td>{user.name}</td><td>{formatDate(user.createdAt)}</td><td>{user.email}</td><td><Badge tone={user.isActive ? "green" : "pink"}>{accountStatusLabel(user.isActive)}</Badge></td><td><SellerActionsMenu user={user} /></td></tr>)}</tbody>
          </table>
          <nav className="admin-pagination" aria-label="User pages"><button type="button" className="admin-page-arrow" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={18} fill="currentColor" /></button><div className="admin-pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === currentPage ? "admin-page-number active" : "admin-page-number"} onClick={() => setPage(pageNumber)} aria-current={pageNumber === currentPage ? "page" : undefined}>{pageNumber}</button>)}</div><button type="button" className="admin-page-arrow" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={18} fill="currentColor" /></button></nav>
        </>
      ) : <div className="empty-state"><h2>No users found</h2><p>Try another name or email.</p></div>}
    </PageContainer>
  );
}

export function AdminUserDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ["admin-user", id], queryFn: () => api.adminUser(id), enabled: Boolean(id) });
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const account = user.data?.data;
  const nextActive = !account?.isActive;
  const update = useMutation({
    mutationFn: () => api.updateUserStatus(id, nextActive),
    onSuccess: async () => { setConfirming(false); setError(""); await queryClient.invalidateQueries({ queryKey: ["admin-user", id] }); await queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (caught) => setError(caught instanceof Error ? caught.message : "Unable to update this account."),
  });
  if (user.isLoading) return <PageContainer className="account-page"><div className="full-state"><Spinner /></div></PageContainer>;
  if (user.isError || !account) return <PageContainer className="account-page"><ErrorState message={user.error instanceof Error ? user.error.message : "User not found."} /></PageContainer>;
  const showCounts = account.activeListingCount !== undefined && account.archivedListingCount !== undefined;
  return (
    <PageContainer className="account-page admin-page">
      <AdminHeading kicker="User detail" title={account.name} text={account.email} crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: account.name }]} />
      <Card className="admin-side admin-account-card">
        <section className="admin-account-section">
          <div className="admin-section-heading"><h2>Account Information</h2></div>
          <p><span>Seller Name</span><strong>{account.name}</strong></p>
          <p><span>Email</span><strong>{account.email}</strong></p>
          <p><span>Contact Number</span><strong>{account.phone || "—"}</strong></p>
          <p><span>Location</span><strong>{account.location || "—"}</strong></p>
          <p><span>Joined Date</span><strong>{formatDate(account.createdAt)}</strong></p>
          <p><span>Status</span><Badge tone={account.isActive ? "green" : "pink"}>{accountStatusLabel(account.isActive)}</Badge></p>
        </section>
        <section className="admin-account-section">
          <div className="admin-section-heading"><h2>Listing Summary</h2></div>
          <p><span>Total Listings</span><strong>{account.listingCount}</strong></p>
          {showCounts && <p><span>Active Listings</span><strong>{account.activeListingCount}</strong></p>}
          {showCounts && <p><span>Archived Listings</span><strong>{account.archivedListingCount}</strong></p>}
          <Link className="text-link" to={`/admin/listings?sellerId=${account.id}`}>View Listings <ArrowRight size={15} /></Link>
        </section>
        {account.role === "USER" && (
          <div className="admin-user-actions">
            <Button variant={account.isActive ? "outline" : "primary"} className={account.isActive ? "admin-deactivate" : undefined} onClick={() => { setError(""); setConfirming(true); }}>{account.isActive ? "Deactivate Account" : "Reactivate Account"}</Button>
          </div>
        )}
      </Card>
      {confirming && <AccountStatusDialog active={account.isActive} pending={update.isPending} error={error} onCancel={() => { if (!update.isPending) { setConfirming(false); setError(""); } }} onConfirm={() => update.mutate()} />}
    </PageContainer>
  );
}

function AccountPasswordField({ label, value, onChange, placeholder, autoComplete, className }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className={className ? `field-label ${className}` : "field-label"}>{label}<div className="password-field"><Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>;
}

export function AdminAccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState<"profile" | "security" | null>(null);
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  if (!user) return null;
  const resetSecrets = () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setAuthPassword(""); setAuthorizing(false); setError(""); };
  const startProfile = () => {
    setEmail(user.email ?? "");
    setLocation(user.location ?? "");
    resetSecrets();
    setEditing("profile");
  };
  const startSecurity = () => { resetSecrets(); setEditing("security"); };
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const nextLocation = location.trim();
    const nextEmail = email.trim().toLowerCase();
    const changingEmail = nextEmail !== (user.email ?? "").toLowerCase();
    if (changingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) { setError("Enter a valid email address."); setSaving(false); return; }
    if (!authorizing) { setAuthPassword(""); setError(""); setAuthorizing(true); setSaving(false); return; }
    if (!authPassword) { setError("Enter your current password to authorize this change."); setSaving(false); return; }
    try { await updateProfile({ location: nextLocation || null, currentPassword: authPassword, ...(changingEmail ? { email: nextEmail } : {}) }); setEditing(null); setAuthorizing(false); setAuthPassword(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save profile settings."); }
    finally { setSaving(false); }
  };
  const saveSecurity = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) { setError("Enter your current password, a new password, and the confirmation."); setSaving(false); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); setSaving(false); return; }
    if (newPassword !== confirmPassword) { setError("New password and confirmation do not match."); setSaving(false); return; }
    try { await updateProfile({ currentPassword, newPassword }); resetSecrets(); setEditing(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to change the password."); }
    finally { setSaving(false); }
  };
  const joined = user.createdAt ? formatDate(user.createdAt) : "—";
  const editButton = (label: string, onClick: () => void) => <Button type="button" variant="ghost" size="sm" className="admin-icon-action" data-tooltip="Edit" aria-label={`Edit ${label}`} title="Edit" onClick={onClick}><SquarePen size={16} /></Button>;
  return <PageContainer className="account-page admin-page"><div className="page-heading"><div><AdminBreadcrumb crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Account" }]} /><span className="section-kicker">Your admin account</span><div className="admin-account-title"><h1>{user.name}</h1></div><p>Account details for this admin sign-in.</p></div></div><Card className="admin-side admin-account-card"><section className="admin-account-section admin-account-profile"><div className="admin-section-heading"><h2><UserRound size={18} />Profile Information</h2>{editing !== "profile" && editButton("profile information", startProfile)}</div>{editing === "profile" ? <form className="admin-profile-form" onSubmit={(event) => { void saveProfile(event); }}><p><span>Role</span><Badge>Admin</Badge></p><label className="field-label">Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><p><span>Joined Date</span><strong>{joined}</strong></p><label className="field-label">Location<Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, Country" /></label>{error && !authorizing && <div className="form-error">{error}</div>}<div className="admin-actions"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button></div></form> : <><p><span>Role</span><Badge>Admin</Badge></p><p><span>Email</span><strong>{user.email ?? "—"}</strong></p><p><span>Joined Date</span><strong>{joined}</strong></p><p><span>Location</span><strong>{user.location || "—"}</strong></p></>}</section><section className="admin-account-section"><div className="admin-section-heading"><h2><ShieldCheck size={18} />Security</h2>{editing !== "security" && editButton("security", startSecurity)}</div>{editing === "security" ? <form className="admin-profile-form" onSubmit={(event) => { void saveSecurity(event); }}><AccountPasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" autoComplete="current-password" /><AccountPasswordField label="New Password" value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" autoComplete="new-password" /><AccountPasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" autoComplete="new-password" />{error && <div className="form-error">{error}</div>}<div className="admin-actions"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Password"}</Button></div></form> : <p><span>Password</span><strong>••••••••</strong></p>}</section>{!editing && <Button className="admin-sign-out" variant="outline" onClick={() => { void logout().then(() => navigate("/")); }}>Sign Out</Button>}</Card>{authorizing && <div className="success-popup" role="dialog" aria-modal="true" aria-labelledby="authorize-title"><form className="success-popup-card admin-auth-popup" onSubmit={(event) => { void saveProfile(event); }}><h2 id="authorize-title">Authorize Change</h2><p>Enter your current password to save these profile details.</p><AccountPasswordField label="Current Password" value={authPassword} onChange={setAuthPassword} placeholder="Current password" autoComplete="current-password" />{error && <div className="form-error">{error}</div>}<div className="success-popup-actions"><Button type="button" variant="outline" onClick={() => { setAuthorizing(false); setAuthPassword(""); setError(""); }}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Authorize"}</Button></div></form></div>}</PageContainer>;
}
