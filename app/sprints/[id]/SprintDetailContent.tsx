"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { hoursFromPoints } from "@/lib/pricing";
import { SPRINT_WEEKS } from "@/lib/sprintProcess";
import AdminStatusChanger from "./AdminStatusChanger";
import DeleteSprintButton from "./DeleteSprintButton";
import SprintTotals from "./SprintTotals";
import AdminOnlySection from "./AdminOnlySection";
import ViewModeToggle from "./ViewModeToggle";
import GenerateAgreementButton from "./GenerateAgreementButton";
import AgreementModal from "./AgreementModal";
import SprintLinks from "./SprintLinks";
import SprintDailyUpdates, { type DailyUpdate } from "./SprintDailyUpdates";
import StripeInvoiceModal from "./StripeInvoiceModal";
import NewCustomInvoiceModal from "./NewCustomInvoiceModal";

type SprintDeliverable = {
  sprintDeliverableId: string;
  deliverableId: string;
  name: string;
  category: string | null;
  deliverableType: null;
  complexityScore: number;
  customHours: number | null;
  customPoints: number | null;
  customScope: string | null;
  note: string | null;
  deliveryUrl: string | null;
  baseHours: number | null;
  basePrice: number | null;
  basePoints: number | null;
};

type WeekPlan = {
  overview?: string;
  kickoff?: string;
  midweek?: string;
  endOfWeek?: string;
  goals?: string[];
  deliverables?: string[];
  milestones?: string[];
};

type TimelineItem = {
  day?: string | number;
  dayOfWeek?: string;
  focus?: string;
  items?: string[];
};

type DraftPlan = {
  sprintTitle?: string;
  overview?: string;
  goals?: string[];
  approach?: string;
  week1?: WeekPlan;
  week2?: WeekPlan;
  timeline?: TimelineItem[];
  assumptions?: string[];
  risks?: string[];
  notes?: string[];
};

type BudgetMilestone = {
  id: number;
  summary: string;
  multiplier: number;
  date: string;
};

type BudgetInputs = {
  isDeferred?: boolean;
  totalProjectValue?: number;
  upfrontPayment?: number;
  upfrontPaymentTiming?: string;
  completionPaymentTiming?: string;
  equitySplit?: number;
  milestones?: BudgetMilestone[];
  milestoneMissOutcome?: string;
};

type BudgetOutputs = {
  upfrontAmount?: number;
  equityAmount?: number;
  deferredAmount?: number;
  milestoneBonusAmount?: number;
  remainingOnCompletion?: number;
  totalProjectValue?: number;
};

type BudgetPlan = {
  id: string;
  label: string | null;
  inputs: BudgetInputs;
  outputs: BudgetOutputs;
  created_at: string | Date;
};

type SprintRow = {
  id: string;
  document_id: string;
  status: string | null;
  title: string | null;
  deliverable_count: number | null;
  total_estimate_points: number | null;
  total_fixed_hours: number | null;
  total_fixed_price: number | null;
  created_at: string | Date;
  updated_at: string | Date | null;
  email: string | null;
  account_id: string | null;
  project_id: string | null;
  weeks: number | null;
  start_date: string | Date | null;
  due_date: string | Date | null;
  contract_url: string | null;
  contract_status: string | null;
  signed_by_studio: boolean | null;
  signed_by_client: boolean | null;
  invoice_url: string | null;
  invoice_status: string | null;
  budget_status: string | null;
  contract_pdf_url: string | null;
  invoice_pdf_url: string | null;
  base_rate: number | null;
  type: string;
  parent_sprint_id: string | null;
};

type SprintInvoice = {
  id: string;
  sprint_id: string;
  label: string;
  invoice_url: string | null;
  invoice_status: string;
  invoice_pdf_url: string | null;
  amount: number | null;
  sort_order: number;
  stripe_invoice_id: string | null;
  stripe_recipient_email: string | null;
  created_at: string;
  updated_at: string;
};

type ChangelogEntry = {
  id: string;
  action: string;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
  author_name: string | null;
};

type AgreementData = {
  agreement: string | null;
  generatedAt: string | null;
};

type WeekNotesData = {
  kickoff: string | null;
  midweek: string | null;
  endOfWeek: string | null;
};

type Props = {
  row: SprintRow;
  plan: DraftPlan;
  sprintDeliverables: SprintDeliverable[];
  budgetPlan: BudgetPlan | null;
  isOwner: boolean;
  isAdmin: boolean;
  isProjectMember: boolean;
  agreementData?: AgreementData;
  weekNotes?: Record<string, WeekNotesData>;
  weekCount?: number;
  invoices?: SprintInvoice[];
  dailyUpdates?: DailyUpdate[];
  currentUserEmail?: string;
  parentSprint?: { id: string; title: string | null } | null;
  projectMembers?: Array<{ email: string; name: string | null }>;
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Stripe-related changelog actions we display on invoice cards
const STRIPE_CHANGELOG_ACTIONS = new Set([
  "stripe_link_generated",
  "invoice_sent",
  "invoice_processing",
  "invoice_paid",
  "invoice_payment_failed",
  "invoice_voided",
  "invoice_refunded",
  "invoice_cancelled",
  "invoice_status_refreshed",
]);

const INVOICE_ACTIVITY_META: Record<string, { icon: string; label: string }> = {
  stripe_link_generated:    { icon: "🔗", label: "Link generated" },
  invoice_sent:             { icon: "📤", label: "Sent" },
  invoice_processing:       { icon: "⏳", label: "Processing" },
  invoice_paid:             { icon: "✅", label: "Paid" },
  invoice_payment_failed:   { icon: "❌", label: "Payment failed" },
  invoice_voided:           { icon: "🚫", label: "Voided" },
  invoice_refunded:         { icon: "↩️", label: "Refunded" },
  invoice_cancelled:        { icon: "🗑️", label: "Cancelled" },
  invoice_status_refreshed: { icon: "🔄", label: "Status refreshed" },
};

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SprintDetailContent(props: Props) {
  const {
    row,
    plan,
    sprintDeliverables: initialDeliverables,
    budgetPlan,
    isOwner,
    isAdmin,
    agreementData,
    weekNotes: initialWeekNotes,
    weekCount: propWeekCount,
    invoices: initialInvoices,
    dailyUpdates: initialDailyUpdates,
    currentUserEmail,
    parentSprint,
    projectMembers,
  } = props;
  const isUpdateCycle = row.type === "update_cycle";
  const [viewAsAdmin, setViewAsAdmin] = useState(true);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  
  // Sprint totals state - these update when deliverable points change
  const [totalPoints, setTotalPoints] = useState(Number(row.total_estimate_points ?? 0));
  const [totalPrice, setTotalPrice] = useState(Number(row.total_fixed_price ?? 0));
  const [totalHours, setTotalHours] = useState(
    row.total_fixed_hours != null
      ? Number(row.total_fixed_hours)
      : hoursFromPoints(Number(row.total_estimate_points ?? 0))
  );
  
  // Deliverable edit modal state
  const [editingDeliverable, setEditingDeliverable] = useState<SprintDeliverable | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState("");
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [editingPointsValue, setEditingPointsValue] = useState("");
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  
  // Contract URL and status state
  const [contractUrl, setContractUrl] = useState(row.contract_url);
  const [editingContractUrl, setEditingContractUrl] = useState(false);
  const [contractUrlValue, setContractUrlValue] = useState(row.contract_url || "");
  const [savingContractUrl, setSavingContractUrl] = useState(false);
  const [contractStatus, setContractStatus] = useState(row.contract_status || "not_linked");
  const [savingContractStatus, setSavingContractStatus] = useState(false);
  const [signedByStudio, setSignedByStudio] = useState(row.signed_by_studio ?? false);
  const [signedByClient, setSignedByClient] = useState(row.signed_by_client ?? false);
  const [savingSignedBy, setSavingSignedBy] = useState(false);
  
  // Contract PDF state
  const [contractPdfUrl, setContractPdfUrl] = useState(row.contract_pdf_url);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Multi-invoice state
  const [invoices, setInvoices] = useState<SprintInvoice[]>(initialInvoices ?? []);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceUrlValue, setEditingInvoiceUrlValue] = useState("");
  const [savingInvoiceField, setSavingInvoiceField] = useState<string | null>(null); // stores invoiceId being saved
  const [uploadingInvoicePdfId, setUploadingInvoicePdfId] = useState<string | null>(null);
  const [creatingInvoices, setCreatingInvoices] = useState(false);
  const [stripeModalInvoice, setStripeModalInvoice] = useState<SprintInvoice | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  // Stripe activity log for invoice cards (admin only)
  const [invoiceChangelog, setInvoiceChangelog] = useState<ChangelogEntry[]>([]);
  
  // Budget status state
  const [budgetStatus, setBudgetStatus] = useState(row.budget_status || "draft");
  const [savingBudgetStatus, setSavingBudgetStatus] = useState(false);
  const [updatingBudgetToAgreed, setUpdatingBudgetToAgreed] = useState(false);
  
  // Agreement state
  const [agreement, setAgreement] = useState(agreementData?.agreement || null);
  const [agreementGeneratedAt, setAgreementGeneratedAt] = useState(agreementData?.generatedAt || null);
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  
  // Overview state (title, dates, description, goals)
  const [sprintTitle, setSprintTitle] = useState(row.title || "");
  const [startDate, setStartDate] = useState(row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : "");
  const [endDate, setEndDate] = useState(row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : "");
  const [planOverview, setPlanOverview] = useState(plan.overview || "");
  const [planGoals, setPlanGoals] = useState<string[]>(plan.goals || []);
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingTitle, setEditingTitle] = useState(sprintTitle);
  const [editingStartDate, setEditingStartDate] = useState(startDate);
  const [editingEndDate, setEditingEndDate] = useState(endDate);
  const [editingPlanOverview, setEditingPlanOverview] = useState(planOverview);
  const [editingPlanGoals, setEditingPlanGoals] = useState<string[]>(planGoals);
  const [savingOverview, setSavingOverview] = useState(false);
  
  // Sprint Outline state
  const sprintWeekCount = propWeekCount ?? row.weeks ?? 2;
  const defaultWeekNotes = (wn: WeekNotesData | null): WeekNotesData => ({
    kickoff: wn?.kickoff ?? "",
    midweek: wn?.midweek ?? "",
    endOfWeek: wn?.endOfWeek ?? "",
  });
  const [allWeekNotesState, setAllWeekNotesState] = useState<Record<string, WeekNotesData>>(() => {
    const initial: Record<string, WeekNotesData> = {};
    for (let i = 1; i <= sprintWeekCount; i++) {
      const key = `week${i}`;
      initial[key] = defaultWeekNotes(initialWeekNotes?.[key] || null);
    }
    return initial;
  });
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editKickoff, setEditKickoff] = useState("");
  const [editMidweek, setEditMidweek] = useState("");
  const [editEndOfWeek, setEditEndOfWeek] = useState("");
  const [savingWeekNotes, setSavingWeekNotes] = useState(false);
  const weekDialogRef = useRef<HTMLDialogElement>(null);

  const openWeekEditor = useCallback((week: number) => {
    const key = `week${week}`;
    const notes = allWeekNotesState[key] || { kickoff: "", midweek: "", endOfWeek: "" };
    setEditingWeek(week);
    setEditKickoff(notes.kickoff ?? "");
    setEditMidweek(notes.midweek ?? "");
    setEditEndOfWeek(notes.endOfWeek ?? "");
  }, [allWeekNotesState]);

  const closeWeekEditor = useCallback(() => {
    setEditingWeek(null);
    setEditKickoff("");
    setEditMidweek("");
    setEditEndOfWeek("");
  }, []);

  // Sync week dialog open/close with state
  useEffect(() => {
    const dialog = weekDialogRef.current;
    if (!dialog) return;
    if (editingWeek) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [editingWeek]);

  useEffect(() => {
    const dialog = weekDialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeWeekEditor();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [closeWeekEditor]);

  // Fetch Stripe-related changelog entries for invoice cards (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/sprint-drafts/${row.id}/changelog`)
      .then((r) => r.json())
      .then((data: { entries?: ChangelogEntry[] }) => {
        if (Array.isArray(data.entries)) {
          setInvoiceChangelog(
            data.entries.filter((e) => STRIPE_CHANGELOG_ACTIONS.has(e.action))
          );
        }
      })
      .catch(() => {});
  }, [isAdmin, row.id]);

  const handleWeekBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = weekDialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inside) closeWeekEditor();
  };

  const handleSaveWeekNotes = async () => {
    if (!editingWeek) return;
    setSavingWeekNotes(true);
    try {
      const weekKey = `week${editingWeek}`;
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_notes: {
            weekKey,
            kickoff: editKickoff,
            midweek: editMidweek,
            endOfWeek: editEndOfWeek,
          },
        }),
      });
      if (res.ok) {
        const updated: WeekNotesData = {
          kickoff: editKickoff,
          midweek: editMidweek,
          endOfWeek: editEndOfWeek,
        };
        setAllWeekNotesState((prev) => ({ ...prev, [weekKey]: updated }));
        closeWeekEditor();
      }
    } finally {
      setSavingWeekNotes(false);
    }
  };

  const showSprintOutline = sprintWeekCount >= 1;

  // Effective admin view: only true if user is actually admin AND viewing as admin
  const showAdminContent = isAdmin && viewAsAdmin;

  const handleOpenEditModal = (deliverable: SprintDeliverable) => {
    setEditingDeliverable(deliverable);
    setEditingUrlValue(deliverable.deliveryUrl || "");
    setEditingNoteValue(deliverable.note || "");
    setEditingPointsValue(deliverable.customPoints?.toString() || deliverable.basePoints?.toString() || "");
  };

  const handleCloseEditModal = () => {
    setEditingDeliverable(null);
    setEditingUrlValue("");
    setEditingNoteValue("");
    setEditingPointsValue("");
  };

  const handleSaveDeliverable = async () => {
    if (!editingDeliverable) return;
    
    try {
      setSavingDeliverable(true);
      const pointsNum = parseFloat(editingPointsValue);
      const customPoints = !isNaN(pointsNum) && pointsNum >= 0 ? pointsNum : null;
      
      const res = await fetch(`/api/sprint-drafts/${row.id}/deliverables/${editingDeliverable.sprintDeliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryUrl: editingUrlValue.trim() || null,
          notes: editingNoteValue.trim() || null,
          customEstimatePoints: customPoints,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save deliverable");
      }
      
      // Parse response to get updated sprint totals
      const responseData = await res.json();
      
      // Update sprint totals if returned from API
      if (responseData.sprintTotals) {
        setTotalPoints(responseData.sprintTotals.totalPoints);
        setTotalPrice(responseData.sprintTotals.totalPrice);
        setTotalHours(responseData.sprintTotals.totalHours);
      }
      
      // Update local state
      setDeliverables((prev) =>
        prev.map((d) =>
          d.sprintDeliverableId === editingDeliverable.sprintDeliverableId
            ? { 
                ...d, 
                deliveryUrl: editingUrlValue.trim() || null,
                note: editingNoteValue.trim() || null,
                customPoints: customPoints,
              }
            : d
        )
      );
      handleCloseEditModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save deliverable");
    } finally {
      setSavingDeliverable(false);
    }
  };

  const handleSaveContractUrl = async () => {
    try {
      setSavingContractUrl(true);
      const newUrl = contractUrlValue.trim() || null;
      // Auto-update status to "drafted" if adding a URL and status is "not_linked"
      const shouldUpdateStatus = newUrl && contractStatus === "not_linked";
      
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_url: newUrl,
          ...(shouldUpdateStatus ? { contract_status: "drafted" } : {}),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save contract URL");
      }
      setContractUrl(newUrl);
      if (shouldUpdateStatus) {
        setContractStatus("drafted");
      }
      setEditingContractUrl(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save contract URL");
    } finally {
      setSavingContractUrl(false);
    }
  };

  const handleContractStatusChange = async (newStatus: string) => {
    try {
      setSavingContractStatus(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_status: newStatus,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update contract status");
      }
      setContractStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to update contract status");
    } finally {
      setSavingContractStatus(false);
    }
  };

  const handleSignedByChange = async (field: "studio" | "client", value: boolean) => {
    try {
      setSavingSignedBy(true);
      const newSignedByStudio = field === "studio" ? value : signedByStudio;
      const newSignedByClient = field === "client" ? value : signedByClient;
      
      // Determine if we need to auto-update the status
      const bothSigned = newSignedByStudio && newSignedByClient;
      
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed_by_studio: newSignedByStudio,
          signed_by_client: newSignedByClient,
          ...(bothSigned && contractStatus !== "signed" ? { contract_status: "signed" } : {}),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update signed status");
      }
      
      if (field === "studio") {
        setSignedByStudio(value);
      } else {
        setSignedByClient(value);
      }
      
      // Auto-update status to "signed" if both are checked
      if (bothSigned && contractStatus !== "signed") {
        setContractStatus("signed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update signed status");
    } finally {
      setSavingSignedBy(false);
    }
  };

  const contractStatusOptions = [
    { value: "not_linked", label: "Not linked", color: "text-text-muted" },
    { value: "drafted", label: "Drafted", color: "text-amber-600 dark:text-amber-400" },
    { value: "ready", label: "Sent", color: "text-blue-600 dark:text-blue-400" },
    { value: "signed", label: "Signed", color: "text-green-700 dark:text-green-300" },
  ];

  const currentStatusOption = contractStatusOptions.find(o => o.value === contractStatus) || contractStatusOptions[0];

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    
    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`/api/sprint-drafts/${row.id}/agreement-pdf`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      
      const data = await res.json();
      setContractPdfUrl(data.url);
      
      // Auto-update status to "drafted" if currently "not_linked"
      if (contractStatus === "not_linked") {
        await fetch(`/api/sprint-drafts/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contract_status: "drafted" }),
        });
        setContractStatus("drafted");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploadingPdf(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const handleRemovePdf = async () => {
    if (!confirm("Remove the uploaded PDF?")) return;
    
    try {
      setUploadingPdf(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}/agreement-pdf`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to remove PDF");
      }
      
      setContractPdfUrl(null);
    } catch (err) {
      console.error(err);
      alert("Failed to remove PDF");
    } finally {
      setUploadingPdf(false);
    }
  };

  // Invoice helpers
  const handleCreateInvoices = async () => {
    if (!confirm("Generate invoices from the current saved budget?")) return;
    try {
      setCreatingInvoices(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to create invoices");
      }
      const data = await res.json() as { invoices: SprintInvoice[] };
      setInvoices(data.invoices);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create invoices");
    } finally {
      setCreatingInvoices(false);
    }
  };

  const invoiceStatusOptions = [
    { value: "not_sent", label: "Not sent", color: "text-text-muted", bgColor: "bg-neutral-100 dark:bg-neutral-800" },
    { value: "sent", label: "Sent", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950" },
    { value: "paid", label: "Paid", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-50 dark:bg-green-950" },
    { value: "overdue", label: "Overdue", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950" },
    { value: "failed", label: "Failed", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-950" },
    { value: "voided", label: "Voided", color: "text-neutral-500 dark:text-neutral-400", bgColor: "bg-neutral-100 dark:bg-neutral-800" },
    { value: "refunded", label: "Refunded", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-50 dark:bg-amber-950" },
  ];

  const getInvoiceStatusOption = (status: string) =>
    invoiceStatusOptions.find(o => o.value === status) || invoiceStatusOptions[0];

  const handleInvoiceStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      setSavingInvoiceField(invoiceId);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update invoice status");
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, invoice_status: newStatus } : inv));
    } catch (err) {
      console.error(err);
      alert("Failed to update invoice status");
    } finally {
      setSavingInvoiceField(null);
    }
  };

  const handleSaveInvoiceUrl = async (invoiceId: string) => {
    try {
      setSavingInvoiceField(invoiceId);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_url: editingInvoiceUrlValue.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save invoice URL");
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, invoice_url: editingInvoiceUrlValue.trim() || null } : inv));
      setEditingInvoiceId(null);
      setEditingInvoiceUrlValue("");
    } catch (err) {
      console.error(err);
      alert("Failed to save invoice URL");
    } finally {
      setSavingInvoiceField(null);
    }
  };

  const handleInvoicePdfUpload = async (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    try {
      setUploadingInvoicePdfId(invoiceId);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices/${invoiceId}/pdf`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, invoice_pdf_url: data.url } : inv));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploadingInvoicePdfId(null);
      e.target.value = "";
    }
  };

  const handleRemoveInvoicePdf = async (invoiceId: string) => {
    if (!confirm("Remove the uploaded invoice PDF?")) return;
    try {
      setUploadingInvoicePdfId(invoiceId);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices/${invoiceId}/pdf`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove PDF");
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, invoice_pdf_url: null } : inv));
    } catch (err) {
      console.error(err);
      alert("Failed to remove PDF");
    } finally {
      setUploadingInvoicePdfId(null);
    }
  };

  const handleOpenStripeModal = (inv: SprintInvoice) => {
    setStripeModalInvoice(inv);
  };


  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      setDeletingInvoiceId(invoiceId);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete invoice");
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleBudgetStatusChange = async (newStatus: string) => {
    const isAgreeingBudget = newStatus === "agreed";
    try {
      setSavingBudgetStatus(true);
      if (isAgreeingBudget) setUpdatingBudgetToAgreed(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_status: newStatus,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update budget status");
      }
      setBudgetStatus(newStatus);

      // When transitioning to "agreed", reload the page so all sections refresh
      if (isAgreeingBudget) {
        window.location.reload();
        return;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update budget status");
      setUpdatingBudgetToAgreed(false);
    } finally {
      setSavingBudgetStatus(false);
    }
  };

  const budgetStatusOptions = [
    { value: "draft", label: "Draft", color: "text-text-muted", bgColor: "bg-gray-100 dark:bg-gray-800" },
    { value: "agreed", label: "Agreed", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-50 dark:bg-green-950" },
  ];

  const currentBudgetStatusOption = budgetStatusOptions.find(o => o.value === budgetStatus) || budgetStatusOptions[0];

  const handleRegenerateAgreement = async () => {
    try {
      setRegeneratingAgreement(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}/generate-agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to regenerate agreement");
      }
      const data = await res.json();
      setAgreement(data.agreement);
      setAgreementGeneratedAt(data.meta?.generatedAt || new Date().toISOString());
      // Keep modal open to show updated agreement
    } catch (err) {
      console.error("Error regenerating agreement:", err);
      alert("Failed to regenerate agreement");
    } finally {
      setRegeneratingAgreement(false);
    }
  };

  const handleAgreementGenerated = (newAgreement: string) => {
    setAgreement(newAgreement);
    setAgreementGeneratedAt(new Date().toISOString());
    setShowAgreementModal(true);
  };

  // Sprint status display options
  const sprintStatusOptions: Record<string, { label: string; bgColor: string; textColor: string }> = {
    draft: { label: "Draft", bgColor: "bg-gray-100 dark:bg-gray-800", textColor: "text-gray-700 dark:text-gray-300" },
    scheduled: { label: "Scheduled", bgColor: "bg-blue-100 dark:bg-blue-900", textColor: "text-blue-800 dark:text-blue-200" },
    in_progress: { label: "In Progress", bgColor: "bg-purple-100 dark:bg-purple-900", textColor: "text-purple-800 dark:text-purple-200" },
    complete: { label: "Complete", bgColor: "bg-green-100 dark:bg-green-900", textColor: "text-green-800 dark:text-green-200" },
  };

  const currentSprintStatus = sprintStatusOptions[row.status || "draft"] || sprintStatusOptions.draft;

  // Calculate duration in weeks from start and end dates
  // Uses business week (5 work days = 1 week) since sprints are typically Mon-Fri
  const calculateDurationWeeks = (start: string, end: string): number | null => {
    if (!start || !end) return null;
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    
    // Count business days (Mon-Fri) between start and end dates, inclusive
    let businessDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday, so 1-5 are Mon-Fri
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    // Divide by 5 to get weeks, round to nearest 0.5 week
    return Math.round((businessDays / 5) * 2) / 2;
  };

  const calculatedWeeks = calculateDurationWeeks(startDate, endDate);
  const displayWeeks = calculatedWeeks ?? row.weeks ?? 2;
  
  // For edit mode - calculate from editing values
  const editingCalculatedWeeks = calculateDurationWeeks(editingStartDate, editingEndDate);
  const editingDisplayWeeks = editingCalculatedWeeks ?? row.weeks ?? 2;

  const handleSaveOverview = async () => {
    try {
      setSavingOverview(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overview_update: {
            title: editingTitle.trim() || null,
            start_date: editingStartDate || null,
            due_date: editingEndDate || null,
            overview: editingPlanOverview.trim() || null,
            goals: editingPlanGoals.map((g) => g.trim()).filter(Boolean),
          },
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update overview");
      }
      setSprintTitle(editingTitle.trim());
      setStartDate(editingStartDate);
      setEndDate(editingEndDate);
      setPlanOverview(editingPlanOverview.trim());
      setPlanGoals(editingPlanGoals.map((g) => g.trim()).filter(Boolean));
      setEditingOverview(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update overview");
    } finally {
      setSavingOverview(false);
    }
  };

  const t = {
    pageTitle: `${typography.headingSection}`,
    subhead: `${getTypographyClassName("body-sm")} text-text-secondary`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    cardHeading: `${typography.headingCard}`,
  };

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6">
      {/* Admin View Mode Banner */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 overflow-hidden">
          {/* View toggle row */}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`${getTypographyClassName("mono-sm")} uppercase tracking-wide text-black/50 dark:text-white/50`}>View</span>
              <ViewModeToggle 
                isAdminView={viewAsAdmin} 
                onToggle={() => setViewAsAdmin(!viewAsAdmin)} 
              />
              {!viewAsAdmin && (
                <span className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400`}>
                  Showing client view — admin-only content is hidden
                </span>
              )}
            </div>
            {showAdminContent && (
              <AdminStatusChanger sprintId={row.id} currentStatus={row.status || "draft"} />
            )}
          </div>
        </section>
      )}

      {row.project_id && (
        <Link
          href={`/projects/${row.project_id}`}
          className={`${getTypographyClassName("body-sm")} inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors -mt-2`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to project
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isUpdateCycle && (
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-xs font-medium mb-2">
              Update Cycle
            </span>
          )}
          <h1 className={t.pageTitle} data-typography-id="h2">
            {sprintTitle || plan.sprintTitle?.trim() || (isUpdateCycle ? "Update cycle draft" : "Sprint draft")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isUpdateCycle && (isOwner || showAdminContent) && (row.status ?? "draft") === "draft" && (
            <Link
              href={`/dashboard/sprint-builder?sprintId=${row.id}`}
              className={`inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 hover:opacity-90 transition ${getTypographyClassName("button-sm")}`}
            >
              Edit in builder
            </Link>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* Book a Feedback Session / Friday Handoff */}
      {/* ============================================ */}
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white/40 dark:bg-black/40 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className={`${getTypographyClassName("subtitle-sm")} text-text-muted uppercase tracking-wide`}>Got questions?</p>
            <p className={`${getTypographyClassName("body-base")} text-black dark:text-white`}>Book a feedback session to talk through this sprint.</p>
          </div>
          <a
            href="https://cal.com/chrismeisner/feedback-sync"
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 inline-flex items-center rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-3 py-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition ${getTypographyClassName("button-sm")}`}
          >
            Book a session →
          </a>
        </section>
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white/40 dark:bg-black/40 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className={`${getTypographyClassName("subtitle-sm")} text-text-muted uppercase tracking-wide`}>Wrapping up?</p>
            <p className={`${getTypographyClassName("body-base")} text-black dark:text-white`}>Book a Friday handoff to review deliverables and next steps.</p>
          </div>
          <a
            href="https://cal.com/chrismeisner/sprint-final-walkthrough"
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 inline-flex items-center rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-3 py-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition ${getTypographyClassName("button-sm")}`}
          >
            Book handoff →
          </a>
        </section>
      </div>

      {/* ============================================ */}
      {/* EVERYONE SEES: Sprint Overview */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 bg-white/40 dark:bg-black/40`}>
        <div className="flex items-center justify-between">
          <h2 className={t.cardHeading}>Overview</h2>
          <span
            className={`inline-flex items-center rounded-full ${currentSprintStatus.bgColor} ${currentSprintStatus.textColor} px-2.5 py-0.5 ${getTypographyClassName("subtitle-sm")}`}
          >
            {currentSprintStatus.label}
          </span>
        </div>

        {editingOverview && showAdminContent ? (
          // Edit mode for admins
          <div className="space-y-3">
            <div className="space-y-1">
              <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block`}>
                Sprint title
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Enter sprint title..."
                className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                disabled={savingOverview}
              />
            </div>
            <div className={`grid gap-3 sm:grid-cols-2 ${t.bodySm}`}>
              <div>
                <span className={t.monoLabel}>duration:</span> {editingDisplayWeeks} week{editingDisplayWeeks !== 1 ? 's' : ''}
              </div>
              <div>
                <span className={t.monoLabel}>deliverables:</span> {row.deliverable_count ?? 0}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block`}>
                  Start date
                </label>
                <input
                  type="date"
                  value={editingStartDate}
                  onChange={(e) => setEditingStartDate(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingOverview}
                />
              </div>
              <div className="space-y-1">
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block`}>
                  End date
                </label>
                <input
                  type="date"
                  value={editingEndDate}
                  onChange={(e) => setEditingEndDate(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingOverview}
                />
              </div>
            </div>
            {/* Description */}
            <div className="space-y-1">
              <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block`}>
                Description
              </label>
              <textarea
                rows={4}
                value={editingPlanOverview}
                onChange={(e) => setEditingPlanOverview(e.target.value)}
                placeholder="Brief overview of this sprint..."
                className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
                disabled={savingOverview}
              />
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted`}>
                  Goals
                </label>
                <button
                  type="button"
                  onClick={() => setEditingPlanGoals((prev) => [...prev, ""])}
                  disabled={savingOverview}
                  className={`${getTypographyClassName("button-sm")} h-7 px-2 rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  + Add Goal
                </button>
              </div>
              {editingPlanGoals.map((goal, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) =>
                      setEditingPlanGoals((prev) =>
                        prev.map((g, i) => (i === idx ? e.target.value : g))
                      )
                    }
                    placeholder={`Goal ${idx + 1}...`}
                    className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    disabled={savingOverview}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPlanGoals((prev) => prev.filter((_, i) => i !== idx))
                    }
                    disabled={savingOverview}
                    className="size-8 flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 disabled:opacity-50 transition"
                    aria-label="Remove goal"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {editingPlanGoals.length === 0 && (
                <p className={`${getTypographyClassName("body-sm")} text-text-muted`}>No goals yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveOverview}
                disabled={savingOverview}
                className={`${getTypographyClassName("button-sm")} px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
              >
                {savingOverview ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingOverview(false);
                  setEditingTitle(sprintTitle);
                  setEditingStartDate(startDate);
                  setEditingEndDate(endDate);
                  setEditingPlanOverview(planOverview);
                  setEditingPlanGoals(planGoals);
                }}
                disabled={savingOverview}
                className={`${getTypographyClassName("button-sm")} px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className={`grid gap-2 sm:grid-cols-2 flex-1 ${t.bodySm}`}>
                <div>
                  <span className={t.monoLabel}>duration:</span> {displayWeeks} week{displayWeeks !== 1 ? 's' : ''}
                </div>
                {startDate && (
                  <div>
                    <span className={t.monoLabel}>starts:</span> {new Date(startDate + 'T00:00:00').toLocaleDateString()}
                  </div>
                )}
                {endDate && (
                  <div>
                    <span className={t.monoLabel}>ends:</span> {new Date(endDate + 'T00:00:00').toLocaleDateString()}
                  </div>
                )}
                {row.deliverable_count != null && row.deliverable_count > 0 && (
                  <div>
                    <span className={t.monoLabel}>deliverables:</span> {row.deliverable_count}
                  </div>
                )}
              </div>
              {showAdminContent && (
                <button
                  onClick={() => {
                    setEditingTitle(sprintTitle);
                    setEditingStartDate(startDate);
                    setEditingEndDate(endDate);
                    setEditingPlanOverview(planOverview);
                    setEditingPlanGoals(planGoals.length > 0 ? [...planGoals] : [""]);
                    setEditingOverview(true);
                  }}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Edit
                </button>
              )}
            </div>
            {planOverview && (
              <p className={`${t.bodySm} whitespace-pre-line border-t border-black/5 dark:border-white/10 pt-3`}>
                {planOverview}
              </p>
            )}
            {planGoals.length > 0 && (
              <div className="border-t border-black/5 dark:border-white/10 pt-3 space-y-1">
                <p className={t.monoLabel}>Goals</p>
                <ul className={`list-disc pl-5 space-y-0.5 ${t.bodySm}`}>
                  {planGoals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* ADMIN ONLY: Extended Sprint Details */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only" className="space-y-4">
          <div className="p-4 space-y-4">
            <h3 className={`${t.cardHeading}`}>Extended Sprint Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {row.email && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>email:</span> {row.email}
                </div>
              )}
              <div className={t.bodySm}>
                <span className={t.monoLabel}>created:</span>{" "}
                {new Date(row.created_at).toLocaleString()}
              </div>
              {row.updated_at && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>updated:</span>{" "}
                  {new Date(row.updated_at).toLocaleString()}
                </div>
              )}
              <div className={t.bodySm}>
                <span className={t.monoLabel}>document_id:</span> {row.document_id}
              </div>
              {row.project_id && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>project_id:</span> {row.project_id}
                </div>
              )}
              {row.account_id && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>account_id:</span> {row.account_id}
                </div>
              )}
            </div>

            {/* Full totals with points and hours for admin */}
            {(totalPoints != null || totalHours != null) && (
              <div className="pt-3 border-t border-amber-400/30">
                <SprintTotals
                  initialPoints={totalPoints}
                  initialHours={totalHours}
                  initialPrice={totalPrice}
                  isEditable={false}
                  showPointsAndHours={true}
                  showRate={true}
                  variant="inline"
                  hideHeading
                  baseRate={row.base_rate}
                  isUpdateCycle={isUpdateCycle}
                />
              </div>
            )}
          </div>
        </AdminOnlySection>
      )}

      {/* ============================================ */}
      {/* UPDATE CYCLES: Parent Sprint Reference */}
      {/* ============================================ */}
      {isUpdateCycle && (
        <section className={`space-y-4 ${t.bodySm}`}>
          {parentSprint && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide leading-none text-blue-700 dark:text-blue-400">
                Update Cycle
              </span>
              <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Iterating on work from a previous sprint:
              </p>
              <Link
                href={`/sprints/${parentSprint.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {parentSprint.title || "Untitled sprint"} &rarr;
              </Link>
            </div>
          )}

          {plan.overview && (
            <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-2">
              <h2 className={`${t.cardHeading}`}>Overview</h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {plan.overview}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ============================================ */}
      {/* EVERYONE SEES: Deliverables Table */}
      {/* ============================================ */}
      <section className={`space-y-6 ${t.bodySm}`}>
        {!isUpdateCycle && deliverables.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className={t.cardHeading}>Deliverables</h2>
              <span className={t.subhead}>{deliverables.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                  <tr>
                    <th className={`text-left px-4 py-3 ${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary`}>Name</th>
                    <th className={`text-left px-4 py-3 ${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary`}>Category</th>
                    {showAdminContent && (
                      <th className={`text-left px-4 py-3 ${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary`}>Points</th>
                    )}
                    <th className={`text-left px-4 py-3 ${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary`}>Link</th>
                    {showAdminContent && (
                      <th className={`text-center px-4 py-3 ${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary`}>Edit</th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-black/10 dark:divide-white/15 ${getTypographyClassName("body-sm")}`}>
                  {deliverables.map((d, i) => (
                    <tr
                      key={d.sprintDeliverableId || `${d.name}-${i}`}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          {d.deliverableId ? (
                            <Link
                              href={`/deliverables/${d.deliverableId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${getTypographyClassName("body-sm")} font-medium text-text-primary hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition`}
                            >
                              {d.name || "Untitled"}
                            </Link>
                          ) : (
                            <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>
                              {d.name || "Untitled"}
                            </span>
                          )}
                          {d.note && (
                            <p className={`${getTypographyClassName("body-sm")} text-text-muted italic whitespace-pre-wrap`}>
                              {d.note}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">{d.category ?? "—"}</td>
                      {showAdminContent && (
                        <td className="px-4 py-3 align-top">
                          {d.customPoints != null ? `${d.customPoints} pts` : "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 align-top">
                        {d.deliveryUrl ? (
                          <a
                            href={d.deliveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                          >
                            View <span className="opacity-50">↗</span>
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      {showAdminContent && (
                        <td className="px-4 py-3 align-top text-center">
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sprints Link - everyone sees */}
        <Link
          href="/sprints"
          className={`${t.bodySm} text-text-secondary hover:text-text-primary hover:underline transition`}
        >
          View all sprints →
        </Link>

        {/* ============================================ */}
        {/* EVERYONE SEES: Goals */}
        {/* ============================================ */}
        {plan.goals && plan.goals.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Goals</h2>
            <ul className="list-disc pl-5 space-y-1">
              {plan.goals.map((g, i) => (
                <li key={`${g}-${i}`}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Timeline (detailed planning) */}
        {/* ============================================ */}
        {showAdminContent && plan.timeline && plan.timeline.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-3`}>Timeline</h2>
              <ol className="space-y-3">
                {plan.timeline.map((entry, i) => (
                  <li key={`${entry.day || i}`} className="rounded border border-black/10 dark:border-white/15 p-3 bg-white/50 dark:bg-black/30">
                    <div className={t.bodySm}>
                      <div className={`${getTypographyClassName("subtitle-sm")} flex items-baseline gap-2 text-text-primary`}>
                        <span>Day {typeof entry.day === "number" ? entry.day : entry.day || i + 1}</span>
                        {entry.dayOfWeek && (
                          <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>({entry.dayOfWeek})</span>
                        )}
                        {entry.focus && <span className="text-text-secondary">— {entry.focus}</span>}
                      </div>
                      {entry.items && entry.items.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {entry.items.map((it, j) => (
                            <li key={`${it}-${j}`}>{it}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* EVERYONE SEES: Approach */}
        {/* ============================================ */}
        {plan.approach && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Approach</h2>
            <p className={`${t.bodySm} whitespace-pre-line`}>{plan.approach}</p>
          </div>
        )}

        {/* ============================================ */}
        {/* EVERYONE SEES: Sprint Outline */}
        {/* ============================================ */}
        {showSprintOutline && (
          <div className="space-y-4">
            <h2 className={t.sectionHeading}>Sprint Outline</h2>

            <div className={`grid gap-4 ${sprintWeekCount >= 2 ? "sm:grid-cols-2" : ""}`}>
              {Array.from({ length: sprintWeekCount }, (_, idx) => {
                const weekNum = idx + 1;
                const weekKey = `week${weekNum}`;
                const notes = allWeekNotesState[weekKey] || { kickoff: "", midweek: "", endOfWeek: "" };
                const weekHasNotes = !!(notes.kickoff || notes.midweek || notes.endOfWeek);

                // Use SPRINT_WEEKS data for weeks that have it
                const sprintWeekData = SPRINT_WEEKS[idx] || null;

                const noteEntries: { label: string; icon: string; value: string | null }[] = [
                  { label: "Kickoff", icon: "🚀", value: notes.kickoff },
                  { label: "Mid-Week", icon: "🔄", value: notes.midweek },
                  { label: "End of Week", icon: "🏁", value: notes.endOfWeek },
                ];

                return (
                  <div
                    key={weekKey}
                    className="rounded-lg border border-black/10 dark:border-white/15 bg-white/40 dark:bg-black/40 overflow-hidden"
                  >
                    {/* Week header */}
                    <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sprintWeekData && (
                            <span className="text-lg" aria-hidden="true">
                              {sprintWeekData.icon}
                            </span>
                          )}
                          <h3 className={t.cardHeading}>
                            Week {weekNum}
                          </h3>
                        </div>
                        {showAdminContent && (
                          <button
                            type="button"
                            onClick={() => openWeekEditor(weekNum)}
                            className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {sprintWeekData && (
                        <p className={`${t.bodySm} mt-1`}>{sprintWeekData.summary}</p>
                      )}
                    </div>

                    {/* Three-phase notes area */}
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                      {weekHasNotes ? (
                        noteEntries.map((entry) => (
                          <div key={entry.label} className="px-4 py-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-sm" aria-hidden="true">{entry.icon}</span>
                              <span className={t.monoLabel}>{entry.label}</span>
                            </div>
                            {entry.value ? (
                              <p className={`${t.bodySm} whitespace-pre-line`}>
                                {entry.value}
                              </p>
                            ) : (
                              <p className={`${t.bodySm} italic text-text-muted text-xs`}>
                                Not set
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4">
                          <p className={`${t.bodySm} italic text-text-muted`}>
                            No notes yet for this week.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Assumptions */}
        {/* ============================================ */}
        {showAdminContent && plan.assumptions && plan.assumptions.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Assumptions</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.assumptions.map((a, i) => (
                  <li key={`${a}-${i}`}>{a}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Risks */}
        {/* ============================================ */}
        {showAdminContent && plan.risks && plan.risks.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Risks</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.risks.map((r, i) => (
                  <li key={`${r}-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Notes */}
        {/* ============================================ */}
        {showAdminContent && plan.notes && plan.notes.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Notes</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.notes.map((n, i) => (
                  <li key={`${n}-${i}`}>{n}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}
      </section>

      {/* ============================================ */}
      {/* EVERYONE SEES: Daily Updates */}
      {/* ============================================ */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white/40 dark:bg-black/40">
        <SprintDailyUpdates
          sprintId={row.id}
          isAdmin={showAdminContent}
          startDate={typeof row.start_date === "string" ? row.start_date : null}
          weeks={row.weeks ?? 2}
          initialUpdates={initialDailyUpdates ?? []}
        />
      </section>

      {/* ============================================ */}
      {/* EVERYONE SEES: Links Section */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white/40 dark:bg-black/40`}>
        <SprintLinks sprintId={row.id} isAdmin={showAdminContent} />
      </section>

      {/* ============================================ */}
      {/* EVERYONE SEES: Budget Section */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4 bg-white/40 dark:bg-black/40`}>
        <div className="flex items-center justify-between">
          <h2 className={t.cardHeading}>Budget</h2>
          {/* Admin status dropdown */}
          {showAdminContent && (
            <select
              value={budgetStatus}
              onChange={(e) => handleBudgetStatusChange(e.target.value)}
              disabled={savingBudgetStatus}
              className={`${getTypographyClassName("body-sm")} ${currentBudgetStatusOption.color} bg-transparent border border-black/10 dark:border-white/15 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
            >
              {budgetStatusOptions.map((option) => (
                <option key={option.value} value={option.value} className="text-black dark:text-white bg-white dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {budgetPlan ? (
          <div className="space-y-4">
            {/* Budget Readout - visible to everyone */}
            {(() => {
              const { inputs, outputs } = budgetPlan;
              const isDeferred = inputs.isDeferred !== false; // default true for backwards compat
              const upfrontAmount = outputs.upfrontAmount ?? 0;
              const equityAmount = outputs.equityAmount ?? 0;
              const deferredAmount = outputs.deferredAmount ?? 0;
              const remainingOnCompletion = outputs.remainingOnCompletion ?? 0;
              const totalValue = outputs.totalProjectValue ?? (upfrontAmount + equityAmount + deferredAmount);
              const upfrontPercent = totalValue > 0 ? Math.round((upfrontAmount / totalValue) * 100) : 0;
              const equityPercent = totalValue > 0 ? Math.round((equityAmount / totalValue) * 100) : 0;
              const deferredPercent = totalValue > 0 ? Math.round((deferredAmount / totalValue) * 100) : 0;
              const completionPercent = totalValue > 0 ? Math.round((remainingOnCompletion / totalValue) * 100) : 0;
              const hasDeferred = isDeferred && deferredAmount > 0.01;
              const hasEquity = isDeferred && equityAmount > 0.01;
              const milestones = isDeferred ? (inputs.milestones ?? []) : [];
              
              // Payment timing labels
              const timingLabels: Record<string, string> = {
                on_start: "Due upon signing",
                net7: "Net 7",
                net14: "Net 14",
                net30: "Net 30",
              };
              const completionTimingLabels: Record<string, string> = {
                on_delivery: "Due upon delivery",
                net7: "Net 7",
                net15: "Net 15",
                net30: "Net 30",
              };
              const upfrontTiming = inputs.upfrontPaymentTiming
                ? timingLabels[inputs.upfrontPaymentTiming] ?? inputs.upfrontPaymentTiming
                : null;
              const completionTiming = inputs.completionPaymentTiming
                ? completionTimingLabels[inputs.completionPaymentTiming] ?? completionTimingLabels.on_delivery
                : null;
              
              return (
                <div className="space-y-4">
                  {/* Payment type indicator */}
                  <div className={`${t.bodySm}`}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isDeferred
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                    }`}>
                      {isDeferred ? "Deferred" : "Standard"}
                    </span>
                  </div>

                  {/* Payment breakdown - simple list */}
                  <div className={`space-y-2 ${t.bodySm}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">{isDeferred ? "Upfront:" : "Kickoff:"}</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(upfrontAmount)}</span>
                          <span className="text-text-muted ml-1">({upfrontPercent}%)</span>
                        </div>
                      </div>
                      {upfrontTiming && (
                        <div className="text-xs text-text-muted ml-0 mt-0.5">
                          {upfrontTiming}
                        </div>
                      )}
                    </div>
                    {!isDeferred && remainingOnCompletion > 0.01 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">On Completion:</span>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(remainingOnCompletion)}</span>
                            <span className="text-text-muted ml-1">({completionPercent}%)</span>
                          </div>
                        </div>
                        {completionTiming && (
                          <div className="text-xs text-text-muted ml-0 mt-0.5">
                            {completionTiming}
                          </div>
                        )}
                      </div>
                    )}
                    {hasEquity && (
                      <div>
                        <span className="text-text-muted">Equity:</span>{" "}
                        <span className="font-medium">{formatCurrency(equityAmount)}</span>
                        <span className="text-text-muted ml-1">({equityPercent}%)</span>
                      </div>
                    )}
                    {hasDeferred && (
                      <div>
                        <span className="text-text-muted">Deferred:</span>{" "}
                        <span className="font-medium">{formatCurrency(deferredAmount)}</span>
                        <span className="text-text-muted ml-1">({deferredPercent}%)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Milestones - only if deferred exists */}
                  {hasDeferred && milestones.length > 0 && (
                    <div className="space-y-2">
                      <div className={`${t.bodySm} text-text-muted`}>Performance Milestones</div>
                      <div className="space-y-1">
                        {milestones.map((m, i) => (
                          <div key={m.id ?? i} className={`${t.bodySm} flex items-center justify-between py-1 px-2 rounded bg-black/5 dark:bg-white/5`}>
                            <span>{m.summary || "Milestone"}</span>
                            <span className="text-text-muted">
                              {m.multiplier}x → {formatCurrency(deferredAmount * m.multiplier)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Admin controls */}
            {showAdminContent && (
              <div className="pt-3 border-t border-black/10 dark:border-white/15 flex items-center justify-between">
                <div className={`${t.bodySm} text-text-muted`}>
                  Last saved: {new Date(budgetPlan.created_at).toLocaleString()}
                </div>
                <Link
                  href={`/budget?sprintId=${row.id}&amountCents=${Math.round(
                    Number(row.total_fixed_price ?? 0) * 100
                  )}`}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                >
                  Edit budget
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`${t.bodySm} text-text-muted`}>No budget attached to this sprint.</span>
            {showAdminContent && (
              <Link
                href={`/budget?sprintId=${row.id}&amountCents=${Math.round(
                  Number(row.total_fixed_price ?? 0) * 100
                )}`}
                className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
              >
                Add budget
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* EVERYONE SEES: Agreement Section */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 bg-white/40 dark:bg-black/40`}>
        <div className="flex items-center justify-between">
          <h2 className={t.cardHeading}>Agreement</h2>
          <div className="flex items-center gap-2">
            {/* Status - editable for admins, read-only badge for others */}
            {showAdminContent ? (
              <select
                value={contractStatus}
                onChange={(e) => handleContractStatusChange(e.target.value)}
                disabled={savingContractStatus}
                className={`${getTypographyClassName("body-sm")} ${currentStatusOption.color} bg-transparent border border-black/10 dark:border-white/15 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
              >
                {contractStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-black dark:text-white bg-white dark:bg-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 ${currentStatusOption.color} ${getTypographyClassName("subtitle-sm")}`}
              >
                {currentStatusOption.label}
              </span>
            )}
          </div>
        </div>
        
        <p className={`${t.bodySm} text-text-secondary`}>
          {contractStatus === "ready" 
            ? "Agreements are signed via Google Docs eSignatures. Check your inbox for a link from Google Docs to sign."
            : "Agreements are signed via Google Docs eSignatures"
          }
        </p>
        
        {/* Admin-only: Signed by checkboxes */}
        {showAdminContent && (
          <div className="flex items-center gap-6 py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-black/5 dark:border-white/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={signedByStudio}
                onChange={(e) => handleSignedByChange("studio", e.target.checked)}
                disabled={savingSignedBy}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white disabled:opacity-50"
              />
              <span className={`${t.bodySm} ${signedByStudio ? "text-green-700 dark:text-green-400" : "text-text-secondary"}`}>
                Signed by Studio
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={signedByClient}
                onChange={(e) => handleSignedByChange("client", e.target.checked)}
                disabled={savingSignedBy}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white disabled:opacity-50"
              />
              <span className={`${t.bodySm} ${signedByClient ? "text-green-700 dark:text-green-400" : "text-text-secondary"}`}>
                Signed by Client
              </span>
            </label>
          </div>
        )}
        
        {/* Non-admin: Read-only signature status */}
        {!showAdminContent && (signedByStudio || signedByClient) && (
          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-1.5">
              <span className={`${t.bodySm} ${signedByStudio ? "text-green-700 dark:text-green-400" : "text-text-muted"}`}>
                {signedByStudio ? "✓" : "○"} Studio
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`${t.bodySm} ${signedByClient ? "text-green-700 dark:text-green-400" : "text-text-muted"}`}>
                {signedByClient ? "✓" : "○"} Client
              </span>
            </div>
          </div>
        )}
        
        {/* Agreement content - URL and/or PDF */}
        <div className="space-y-3">
          {/* Agreement URL section */}
          {showAdminContent ? (
            // Admin view: can edit URL
            editingContractUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={contractUrlValue}
                  onChange={(e) => setContractUrlValue(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingContractUrl}
                />
                <button
                  onClick={handleSaveContractUrl}
                  disabled={savingContractUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                >
                  {savingContractUrl ? "..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingContractUrl(false);
                    setContractUrlValue(contractUrl || "");
                  }}
                  disabled={savingContractUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  Cancel
                </button>
              </div>
            ) : contractUrl ? (
              <div className="flex items-center justify-between">
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                >
                  View agreement link <span className="opacity-50">↗</span>
                </a>
                <button
                  onClick={() => {
                    setEditingContractUrl(true);
                    setContractUrlValue(contractUrl || "");
                  }}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Edit URL
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No agreement URL linked.</span>
                <button
                  onClick={() => setEditingContractUrl(true)}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                >
                  Add URL
                </button>
              </div>
            )
          ) : (
            // Non-admin view: read-only URL
            contractUrl && (
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
              >
                View agreement link <span className="opacity-50">↗</span>
              </a>
            )
          )}

          {/* PDF upload/display section */}
          {showAdminContent ? (
            // Admin view: can upload/remove PDF
            contractPdfUrl ? (
              <div className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <a
                    href={contractPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                  >
                    View PDF <span className="opacity-50">↗</span>
                  </a>
                </div>
                <button
                  onClick={handleRemovePdf}
                  disabled={uploadingPdf}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition`}
                >
                  {uploadingPdf ? "..." : "Remove"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No PDF uploaded.</span>
                <label
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${getTypographyClassName("button-sm")} ${uploadingPdf ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {uploadingPdf ? "Uploading..." : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                </label>
              </div>
            )
          ) : (
            // Non-admin view: read-only PDF link
            contractPdfUrl && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-white/5">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <a
                  href={contractPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                >
                  View PDF <span className="opacity-50">↗</span>
                </a>
              </div>
            )
          )}

          {/* Show message if nothing available for non-admins */}
          {!showAdminContent && !contractUrl && !contractPdfUrl && (
            <span className={`${t.bodySm} text-text-muted`}>No agreement available yet.</span>
          )}
        </div>

        {/* AI-Generated Agreement Section - Admin Only */}
        {showAdminContent && (
          <div className="pt-3 border-t border-black/10 dark:border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`${getTypographyClassName("subtitle-sm")} text-text-muted uppercase tracking-wide`}>
                AI-Generated Agreement
              </h3>
              {agreement && (
                <span className={`${getTypographyClassName("body-sm")} text-green-600 dark:text-green-400 flex items-center gap-1`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generated {agreementGeneratedAt ? new Date(agreementGeneratedAt).toLocaleDateString() : ""}
                </span>
              )}
            </div>
            
            {agreement ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAgreementModal(true)}
                  className={`${getTypographyClassName("button-sm")} inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Agreement
                </button>
                <button
                  onClick={handleRegenerateAgreement}
                  disabled={regeneratingAgreement}
                  className={`${getTypographyClassName("button-sm")} inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  {regeneratingAgreement ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className={`${t.bodySm} text-text-secondary`}>
                  Generate a contract agreement based on this sprint&apos;s deliverables, pricing, and project details.
                </p>
                <GenerateAgreementButton 
                  sprintId={row.id} 
                  onAgreementGenerated={handleAgreementGenerated}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Agreement Modal */}
      {showAgreementModal && agreement && (
        <AgreementModal
          agreement={agreement}
          onClose={() => setShowAgreementModal(false)}
          onRegenerate={handleRegenerateAgreement}
          isRegenerating={regeneratingAgreement}
        />
      )}

      {/* ============================================ */}
      {/* EVERYONE SEES: Invoices Section (only when budget is agreed) */}
      {/* ============================================ */}
      {budgetStatus === "agreed" && (
        <section className={`rounded-md border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 bg-white/40 dark:bg-black/40`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={t.cardHeading}>Invoices</h2>
            {showAdminContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewInvoiceModal(true)}
                  className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors`}
                >
                  + New invoice
                </button>
                <button
                  onClick={handleCreateInvoices}
                  disabled={creatingInvoices || !budgetPlan}
                  className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity`}
                >
                  {creatingInvoices ? "Creating..." : "Create from budget"}
                </button>
              </div>
            )}
          </div>


          {invoices.length === 0 ? (
            <p className={`${t.bodySm} text-text-muted`}>
              No invoices yet.{showAdminContent ? " Use \u201cCreate from budget\u201d or \u201c+ New invoice\u201d to get started." : " They will be generated from the budget plan."}
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const statusOpt = getInvoiceStatusOption(inv.invoice_status);
                const isEditingUrl = editingInvoiceId === inv.id;
                const isSaving = savingInvoiceField === inv.id;
                const isUploadingPdf = uploadingInvoicePdfId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 p-3 space-y-2"
                  >
                    {/* Invoice header: label + amount + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`${getTypographyClassName("body-sm")} font-medium`}>
                          {inv.label}
                        </span>
                        {inv.amount != null && (
                          <span className={`${getTypographyClassName("body-sm")} text-text-muted tabular-nums`}>
                            {formatCurrency(inv.amount)}
                          </span>
                        )}
                      </div>
                      {/* Status badge/dropdown + delete */}
                      {showAdminContent ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={inv.invoice_status}
                            onChange={(e) => handleInvoiceStatusChange(inv.id, e.target.value)}
                            disabled={isSaving}
                            className={`${getTypographyClassName("body-sm")} ${statusOpt.color} bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 cursor-pointer`}
                          >
                            {invoiceStatusOptions.map((option) => (
                              <option key={option.value} value={option.value} className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {inv.invoice_status === "not_sent" && !inv.stripe_invoice_id && (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              disabled={deletingInvoiceId === inv.id}
                              title="Delete invoice"
                              className={`${getTypographyClassName("button-sm")} h-8 w-8 flex items-center justify-center rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors`}
                            >
                              {deletingInvoiceId === inv.id ? (
                                <span className="text-xs">...</span>
                              ) : (
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusOpt.bgColor} ${statusOpt.color}`}
                        >
                          {statusOpt.label}
                        </span>
                      )}
                    </div>

                    {/* Invoice URL section */}
                    {showAdminContent ? (
                      isEditingUrl ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={editingInvoiceUrlValue}
                            onChange={(e) => setEditingInvoiceUrlValue(e.target.value)}
                            placeholder="https://bill.com/..."
                            className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            disabled={isSaving}
                          />
                          <button
                            onClick={() => handleSaveInvoiceUrl(inv.id)}
                            disabled={isSaving}
                            className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity`}
                          >
                            {isSaving ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingInvoiceId(null);
                              setEditingInvoiceUrlValue("");
                            }}
                            disabled={isSaving}
                            className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : inv.invoice_url ? (
                        <div className="flex items-center justify-between">
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                          >
                            View invoice link <span className="opacity-50" aria-hidden="true">↗</span>
                          </a>
                          <button
                            onClick={() => {
                              setEditingInvoiceId(inv.id);
                              setEditingInvoiceUrlValue(inv.invoice_url || "");
                            }}
                            className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors`}
                          >
                            Edit URL
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={`${t.bodySm} text-text-muted`}>No URL linked</span>
                          <button
                            onClick={() => {
                              setEditingInvoiceId(inv.id);
                              setEditingInvoiceUrlValue("");
                            }}
                            className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors`}
                          >
                            Add URL
                          </button>
                        </div>
                      )
                    ) : (
                      inv.invoice_url && (
                        <a
                          href={inv.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                        >
                          View invoice link <span className="opacity-50" aria-hidden="true">↗</span>
                        </a>
                      )
                    )}

                    {/* Stripe send action */}
                    {showAdminContent && inv.amount != null && inv.amount > 0 && (
                      inv.stripe_invoice_id ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className={`${getTypographyClassName("body-sm")} text-indigo-600 dark:text-indigo-400 flex items-center gap-1`}>
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {inv.invoice_status === "sent" || inv.invoice_status === "paid" ? "Stripe invoice sent" : "Stripe link generated"}
                          </p>
                          <button
                            onClick={() => handleOpenStripeModal(inv)}
                            className={`${getTypographyClassName("button-sm")} h-7 px-2.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors`}
                          >
                            Manage
                          </button>
                        </div>
                      ) : (
                        inv.invoice_status === "not_sent" && (
                          <button
                            onClick={() => handleOpenStripeModal(inv)}
                            className={`${getTypographyClassName("button-sm")} w-full h-8 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5`}
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                            Send via Stripe
                          </button>
                        )
                      )
                    )}

                    {/* PDF section */}
                    {showAdminContent ? (
                      inv.invoice_pdf_url ? (
                        <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
                          <div className="flex items-center gap-2">
                            <svg className="size-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <a
                              href={inv.invoice_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                            >
                              View PDF <span className="opacity-50" aria-hidden="true">↗</span>
                            </a>
                          </div>
                          <button
                            onClick={() => handleRemoveInvoicePdf(inv.id)}
                            disabled={isUploadingPdf}
                            className={`${getTypographyClassName("button-sm")} h-8 px-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors`}
                          >
                            {isUploadingPdf ? "..." : "Remove"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={`${t.bodySm} text-text-muted`}>No PDF uploaded</span>
                          <label
                            className={`inline-flex items-center h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${getTypographyClassName("button-sm")} ${isUploadingPdf ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            {isUploadingPdf ? "Uploading..." : "Upload PDF"}
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleInvoicePdfUpload(inv.id, e)}
                              disabled={isUploadingPdf}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )
                    ) : (
                      inv.invoice_pdf_url && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
                          <svg className="size-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <a
                            href={inv.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                          >
                            View PDF <span className="opacity-50" aria-hidden="true">↗</span>
                          </a>
                        </div>
                      )
                    )}

                    {/* Non-admin: show message if nothing available */}
                    {!showAdminContent && !inv.invoice_url && !inv.invoice_pdf_url && (
                      <span className={`${t.bodySm} text-text-muted`}>Invoice not available yet.</span>
                    )}

                    {/* Stripe activity log — admin only */}
                    {showAdminContent && (() => {
                      const entries = invoiceChangelog.filter(
                        (e) => e.details?.invoice_id === inv.id
                      );
                      if (entries.length === 0) return null;
                      return (
                        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2 space-y-1.5">
                          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Activity</p>
                          <ul className="space-y-1">
                            {entries.map((entry) => {
                              const meta = INVOICE_ACTIVITY_META[entry.action] ?? { icon: "•", label: entry.action };
                              return (
                                <li key={entry.id} className="flex items-start gap-2 text-xs">
                                  <span className="shrink-0 mt-0.5">{meta.icon}</span>
                                  <span className="flex-1 text-text-muted leading-snug">{entry.summary}</span>
                                  <span
                                    className="shrink-0 text-text-muted opacity-60 whitespace-nowrap"
                                    title={new Date(entry.created_at).toLocaleString()}
                                  >
                                    {formatRelTime(entry.created_at)}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================ */}
      {/* ADMIN ONLY: Danger zone */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only">
          <div className="p-4">
            <DeleteSprintButton sprintId={row.id} visible={true} />
          </div>
        </AdminOnlySection>
      )}

      {/* ============================================ */}
      {/* Week Notes Edit Modal (admin only) */}
      {/* ============================================ */}
      {showAdminContent && (
        <dialog
          ref={weekDialogRef}
          onClick={handleWeekBackdropClick}
          className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-black/10 dark:border-white/10 p-0 max-w-lg w-full mx-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ margin: 0 }}
        >
          {editingWeek && (
            <div className="p-6 space-y-4">
              <h2 className={t.cardHeading}>
                Edit Week {editingWeek} Notes
              </h2>
              {editingWeek && SPRINT_WEEKS[editingWeek - 1] && (
                <p className={t.bodySm}>
                  {SPRINT_WEEKS[editingWeek - 1].summary}
                </p>
              )}

              {/* Kickoff */}
              <div className="space-y-1">
                <label className={`${t.monoLabel} flex items-center gap-1.5`}>
                  <span aria-hidden="true">🚀</span> Kickoff
                </label>
                <textarea
                  value={editKickoff}
                  onChange={(e) => setEditKickoff(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
                  placeholder="How does this week start? Goals, alignment, key decisions..."
                />
              </div>

              {/* Mid-Week */}
              <div className="space-y-1">
                <label className={`${t.monoLabel} flex items-center gap-1.5`}>
                  <span aria-hidden="true">🔄</span> Mid-Week
                </label>
                <textarea
                  value={editMidweek}
                  onChange={(e) => setEditMidweek(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
                  placeholder="What to expect midway - check-in, review, pivot point..."
                />
              </div>

              {/* End of Week */}
              <div className="space-y-1">
                <label className={`${t.monoLabel} flex items-center gap-1.5`}>
                  <span aria-hidden="true">🏁</span> End of Week
                </label>
                <textarea
                  value={editEndOfWeek}
                  onChange={(e) => setEditEndOfWeek(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
                  placeholder="How this week wraps up - deliverable, handoff, demo..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeWeekEditor}
                  className={`${getTypographyClassName("button-sm")} h-10 px-4 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWeekNotes}
                  disabled={savingWeekNotes}
                  className={`${getTypographyClassName("button-sm")} h-10 px-4 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                >
                  {savingWeekNotes ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </dialog>
      )}

      {/* ============================================ */}
      {/* Edit Deliverable Modal */}
      {/* ============================================ */}
      {editingDeliverable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={handleCloseEditModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <h2 className={t.cardHeading}>Edit Deliverable</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Deliverable Name (read-only) */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Deliverable
                </label>
                <p className={`${getTypographyClassName("body-md")} text-text-primary font-medium`}>
                  {editingDeliverable.name || "Untitled"}
                </p>
                {editingDeliverable.category && (
                  <p className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                    {editingDeliverable.category}
                  </p>
                )}
              </div>

              {/* Points */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Points
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editingPointsValue}
                    onChange={(e) => setEditingPointsValue(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-32 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    disabled={savingDeliverable}
                  />
                  <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                    pts
                  </span>
                  {editingDeliverable.basePoints != null && (
                    <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                      (base: {editingDeliverable.basePoints})
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery URL */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Delivery URL
                </label>
                <input
                  type="url"
                  value={editingUrlValue}
                  onChange={(e) => setEditingUrlValue(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingDeliverable}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Notes
                </label>
                <textarea
                  value={editingNoteValue}
                  onChange={(e) => setEditingNoteValue(e.target.value)}
                  placeholder="Add notes about this deliverable..."
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                  disabled={savingDeliverable}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={handleCloseEditModal}
                disabled={savingDeliverable}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeliverable}
                disabled={savingDeliverable}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
              >
                {savingDeliverable ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Custom Invoice Modal */}
      {showNewInvoiceModal && (
        <NewCustomInvoiceModal
          sprintId={row.id}
          onClose={() => setShowNewInvoiceModal(false)}
          onCreated={(invoice) => setInvoices((prev) => [...prev, invoice])}
        />
      )}

      {/* Stripe Invoice Modal */}
      {stripeModalInvoice && (
        <StripeInvoiceModal
          invoice={stripeModalInvoice}
          sprintId={row.id}
          sprintTitle={row.title}
          clientEmail={row.email ?? (projectMembers?.[0]?.email ?? null)}
          adminEmail={currentUserEmail ?? ""}
          adminRole="admin"
          projectMembers={projectMembers}
          onClose={() => setStripeModalInvoice(null)}
          onUpdate={(updated) => {
            setInvoices((prev) => prev.map((inv) => inv.id === updated.id ? updated : inv));
            setStripeModalInvoice(updated);
          }}
          onDeleted={(deletedId) => {
            setInvoices((prev) => prev.filter((inv) => inv.id !== deletedId));
            setStripeModalInvoice(null);
          }}
        />
      )}

      {/* Full-screen overlay when agreeing budget */}
      {updatingBudgetToAgreed && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className={`${getTypographyClassName("heading-sm")} text-white`}>Updating…</span>
          </div>
        </div>
      )}
    </main>
  );
}
