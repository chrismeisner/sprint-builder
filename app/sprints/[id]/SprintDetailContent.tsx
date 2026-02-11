"use client";

import { useState } from "react";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { hoursFromPoints } from "@/lib/pricing";
import AdminStatusChanger from "./AdminStatusChanger";
import DeleteSprintButton from "./DeleteSprintButton";
import SprintTotals from "./SprintTotals";
import AdminOnlySection from "./AdminOnlySection";
import ViewModeToggle from "./ViewModeToggle";
import GenerateAgreementButton from "./GenerateAgreementButton";
import AgreementModal from "./AgreementModal";
import SprintLinks from "./SprintLinks";

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
  totalProjectValue?: number;
  upfrontPayment?: number;
  upfrontPaymentTiming?: string;
  equitySplit?: number;
  milestones?: BudgetMilestone[];
  milestoneMissOutcome?: string;
};

type BudgetOutputs = {
  upfrontAmount?: number;
  equityAmount?: number;
  deferredAmount?: number;
  milestoneBonusAmount?: number;
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
};

type AgreementData = {
  agreement: string | null;
  generatedAt: string | null;
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
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  } = props;
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
  
  // Invoice URL and status state
  const [invoiceUrl, setInvoiceUrl] = useState(row.invoice_url);
  const [editingInvoiceUrl, setEditingInvoiceUrl] = useState(false);
  const [invoiceUrlValue, setInvoiceUrlValue] = useState(row.invoice_url || "");
  const [savingInvoiceUrl, setSavingInvoiceUrl] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState(row.invoice_status || "not_sent");
  const [savingInvoiceStatus, setSavingInvoiceStatus] = useState(false);
  
  // Invoice PDF state
  const [invoicePdfUrl, setInvoicePdfUrl] = useState(row.invoice_pdf_url);
  const [uploadingInvoicePdf, setUploadingInvoicePdf] = useState(false);
  
  // Budget status state
  const [budgetStatus, setBudgetStatus] = useState(row.budget_status || "draft");
  const [savingBudgetStatus, setSavingBudgetStatus] = useState(false);
  
  // Agreement state
  const [agreement, setAgreement] = useState(agreementData?.agreement || null);
  const [agreementGeneratedAt, setAgreementGeneratedAt] = useState(agreementData?.generatedAt || null);
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  
  // Overview state (title and dates)
  const [sprintTitle, setSprintTitle] = useState(row.title || "");
  const [startDate, setStartDate] = useState(row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : "");
  const [endDate, setEndDate] = useState(row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : "");
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingTitle, setEditingTitle] = useState(sprintTitle);
  const [editingStartDate, setEditingStartDate] = useState(startDate);
  const [editingEndDate, setEditingEndDate] = useState(endDate);
  const [savingOverview, setSavingOverview] = useState(false);
  
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

  const handleSaveInvoiceUrl = async () => {
    try {
      setSavingInvoiceUrl(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_url: invoiceUrlValue.trim() || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save invoice URL");
      }
      setInvoiceUrl(invoiceUrlValue.trim() || null);
      setEditingInvoiceUrl(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save invoice URL");
    } finally {
      setSavingInvoiceUrl(false);
    }
  };

  const handleInvoiceStatusChange = async (newStatus: string) => {
    try {
      setSavingInvoiceStatus(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_status: newStatus,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update invoice status");
      }
      setInvoiceStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to update invoice status");
    } finally {
      setSavingInvoiceStatus(false);
    }
  };

  const handleInvoicePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    
    try {
      setUploadingInvoicePdf(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoice-pdf`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      
      const data = await res.json();
      setInvoicePdfUrl(data.url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploadingInvoicePdf(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const handleRemoveInvoicePdf = async () => {
    if (!confirm("Remove the uploaded invoice PDF?")) return;
    
    try {
      setUploadingInvoicePdf(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}/invoice-pdf`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to remove PDF");
      }
      
      setInvoicePdfUrl(null);
    } catch (err) {
      console.error(err);
      alert("Failed to remove PDF");
    } finally {
      setUploadingInvoicePdf(false);
    }
  };

  const invoiceStatusOptions = [
    { value: "not_sent", label: "Not sent", color: "text-text-muted", bgColor: "bg-gray-100 dark:bg-gray-800" },
    { value: "sent", label: "Sent", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950" },
    { value: "paid", label: "Paid", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-50 dark:bg-green-950" },
    { value: "overdue", label: "Overdue", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950" },
  ];

  const currentInvoiceStatusOption = invoiceStatusOptions.find(o => o.value === invoiceStatus) || invoiceStatusOptions[0];

  const handleBudgetStatusChange = async (newStatus: string) => {
    try {
      setSavingBudgetStatus(true);
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
    } catch (err) {
      console.error(err);
      alert("Failed to update budget status");
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
  // Uses business week (5 days = 1 week) since sprints are typically Mon-Fri
  const calculateDurationWeeks = (start: string, end: string): number | null => {
    if (!start || !end) return null;
    const startMs = new Date(start + 'T00:00:00').getTime();
    const endMs = new Date(end + 'T00:00:00').getTime();
    if (isNaN(startMs) || isNaN(endMs)) return null;
    const diffMs = endMs - startMs;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Add 1 to include both start and end dates, divide by 5 for business week
    const businessDays = diffDays + 1;
    // Round to nearest 0.5 week
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
          },
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update overview");
      }
      setSprintTitle(editingTitle.trim());
      setStartDate(editingStartDate);
      setEndDate(editingEndDate);
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
      {/* Admin Controls Section */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-black/5 dark:bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`${getTypographyClassName("mono-sm")} uppercase tracking-wide text-black dark:text-white`}>Admin Controls</span>
              <ViewModeToggle 
                isAdminView={viewAsAdmin} 
                onToggle={() => setViewAsAdmin(!viewAsAdmin)} 
              />
            </div>
            {showAdminContent && (
              <AdminStatusChanger sprintId={row.id} currentStatus={row.status || "draft"} />
            )}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className={t.pageTitle} data-typography-id="h2">
            {sprintTitle || plan.sprintTitle?.trim() || "Sprint draft"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(isOwner || showAdminContent) && (row.status ?? "draft") === "draft" && (
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
                  setEditingOverview(true);
                }}
                className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
              >
                Edit
              </button>
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
                />
              </div>
            )}
          </div>
        </AdminOnlySection>
      )}

      {/* ============================================ */}
      {/* EVERYONE SEES: Deliverables Table */}
      {/* ============================================ */}
      <section className={`space-y-6 ${t.bodySm}`}>
        {deliverables.length > 0 && (
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
        {/* EVERYONE SEES: Approach & Weekly Overview */}
        {/* ============================================ */}
        {(plan.approach || plan.week1?.overview || plan.week2?.overview || plan.week1?.kickoff || plan.week2?.kickoff) && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Approach & Weekly Overview</h2>
            <div className="space-y-4">
              {plan.approach && (
                <div>
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary mb-1`}>Approach</div>
                  <p className={t.bodySm}>{plan.approach}</p>
                </div>
              )}
              {/* Week 1 */}
              {(plan.week1?.kickoff || plan.week1?.midweek || plan.week1?.endOfWeek || plan.week1?.overview) && (
                <div className="space-y-2">
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary`}>Week 1</div>
                  {(plan.week1?.kickoff || plan.week1?.midweek || plan.week1?.endOfWeek) ? (
                    <div className="space-y-1.5 pl-2 border-l-2 border-black/10 dark:border-white/10">
                      {plan.week1?.kickoff && (
                        <div>
                          <span className={`${t.monoLabel}`}>🚀 kickoff:</span>{" "}
                          <span className={t.bodySm}>{plan.week1.kickoff}</span>
                        </div>
                      )}
                      {plan.week1?.midweek && (
                        <div>
                          <span className={`${t.monoLabel}`}>🔄 mid-week:</span>{" "}
                          <span className={t.bodySm}>{plan.week1.midweek}</span>
                        </div>
                      )}
                      {plan.week1?.endOfWeek && (
                        <div>
                          <span className={`${t.monoLabel}`}>🏁 end of week:</span>{" "}
                          <span className={t.bodySm}>{plan.week1.endOfWeek}</span>
                        </div>
                      )}
                    </div>
                  ) : plan.week1?.overview ? (
                    <p className={t.bodySm}>{plan.week1.overview}</p>
                  ) : null}
                </div>
              )}
              {/* Week 2 */}
              {(plan.week2?.kickoff || plan.week2?.midweek || plan.week2?.endOfWeek || plan.week2?.overview) && (
                <div className="space-y-2">
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary`}>Week 2</div>
                  {(plan.week2?.kickoff || plan.week2?.midweek || plan.week2?.endOfWeek) ? (
                    <div className="space-y-1.5 pl-2 border-l-2 border-black/10 dark:border-white/10">
                      {plan.week2?.kickoff && (
                        <div>
                          <span className={`${t.monoLabel}`}>🚀 kickoff:</span>{" "}
                          <span className={t.bodySm}>{plan.week2.kickoff}</span>
                        </div>
                      )}
                      {plan.week2?.midweek && (
                        <div>
                          <span className={`${t.monoLabel}`}>🔄 mid-week:</span>{" "}
                          <span className={t.bodySm}>{plan.week2.midweek}</span>
                        </div>
                      )}
                      {plan.week2?.endOfWeek && (
                        <div>
                          <span className={`${t.monoLabel}`}>🏁 end of week:</span>{" "}
                          <span className={t.bodySm}>{plan.week2.endOfWeek}</span>
                        </div>
                      )}
                    </div>
                  ) : plan.week2?.overview ? (
                    <p className={t.bodySm}>{plan.week2.overview}</p>
                  ) : null}
                </div>
              )}
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
              const upfrontAmount = outputs.upfrontAmount ?? 0;
              const equityAmount = outputs.equityAmount ?? 0;
              const deferredAmount = outputs.deferredAmount ?? 0;
              const totalValue = outputs.totalProjectValue ?? (upfrontAmount + equityAmount + deferredAmount);
              const upfrontPercent = totalValue > 0 ? Math.round((upfrontAmount / totalValue) * 100) : 0;
              const equityPercent = totalValue > 0 ? Math.round((equityAmount / totalValue) * 100) : 0;
              const deferredPercent = totalValue > 0 ? Math.round((deferredAmount / totalValue) * 100) : 0;
              const hasDeferred = deferredAmount > 0.01;
              const hasEquity = equityAmount > 0.01;
              const milestones = inputs.milestones ?? [];
              
              return (
                <div className="space-y-4">
                  {/* Payment breakdown - simple list */}
                  <div className={`space-y-1 ${t.bodySm}`}>
                    <div>
                      <span className="text-text-muted">Upfront:</span>{" "}
                      <span className="font-medium">{formatCurrency(upfrontAmount)}</span>
                      <span className="text-text-muted ml-1">({upfrontPercent}%)</span>
                    </div>
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
                  href={`/deferred-compensation?sprintId=${row.id}&amountCents=${Math.round(
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
                href={`/deferred-compensation?sprintId=${row.id}&amountCents=${Math.round(
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
      {/* EVERYONE SEES: Invoice Section */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 bg-white/40 dark:bg-black/40`}>
        <div className="flex items-center justify-between">
          <h2 className={t.cardHeading}>Invoice</h2>
          <div className="flex items-center gap-2">
            {/* Status badge - visible to all */}
            {showAdminContent ? (
              <select
                value={invoiceStatus}
                onChange={(e) => handleInvoiceStatusChange(e.target.value)}
                disabled={savingInvoiceStatus}
                className={`${getTypographyClassName("body-sm")} ${currentInvoiceStatusOption.color} bg-transparent border border-black/10 dark:border-white/15 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
              >
                {invoiceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-black dark:text-white bg-white dark:bg-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${currentInvoiceStatusOption.bgColor} ${currentInvoiceStatusOption.color} ${getTypographyClassName("subtitle-sm")}`}
              >
                {currentInvoiceStatusOption.label}
              </span>
            )}
          </div>
        </div>
        
        <p className={`${t.bodySm} text-text-secondary`}>
          Invoices are sent via Bill.com
        </p>
        
        {/* Invoice content - URL and/or PDF */}
        <div className="space-y-3">
          {/* Invoice URL section */}
          {showAdminContent ? (
            // Admin view: can edit URL
            editingInvoiceUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={invoiceUrlValue}
                  onChange={(e) => setInvoiceUrlValue(e.target.value)}
                  placeholder="https://bill.com/..."
                  className="flex-1 min-w-[200px] rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingInvoiceUrl}
                />
                <button
                  onClick={handleSaveInvoiceUrl}
                  disabled={savingInvoiceUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                >
                  {savingInvoiceUrl ? "..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingInvoiceUrl(false);
                    setInvoiceUrlValue(invoiceUrl || "");
                  }}
                  disabled={savingInvoiceUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  Cancel
                </button>
              </div>
            ) : invoiceUrl ? (
              <div className="flex items-center justify-between">
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                >
                  View invoice link <span className="opacity-50">↗</span>
                </a>
                <button
                  onClick={() => {
                    setEditingInvoiceUrl(true);
                    setInvoiceUrlValue(invoiceUrl || "");
                  }}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Edit URL
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No invoice URL linked.</span>
                <button
                  onClick={() => setEditingInvoiceUrl(true)}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                >
                  Add URL
                </button>
              </div>
            )
          ) : (
            // Non-admin view: read-only URL
            invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
              >
                View invoice link <span className="opacity-50">↗</span>
              </a>
            )
          )}

          {/* PDF upload/display section */}
          {showAdminContent ? (
            // Admin view: can upload/remove PDF
            invoicePdfUrl ? (
              <div className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <a
                    href={invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                  >
                    View invoice PDF <span className="opacity-50">↗</span>
                  </a>
                </div>
                <button
                  onClick={handleRemoveInvoicePdf}
                  disabled={uploadingInvoicePdf}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition`}
                >
                  {uploadingInvoicePdf ? "..." : "Remove"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No invoice PDF uploaded.</span>
                <label
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${getTypographyClassName("button-sm")} ${uploadingInvoicePdf ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {uploadingInvoicePdf ? "Uploading..." : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleInvoicePdfUpload}
                    disabled={uploadingInvoicePdf}
                    className="hidden"
                  />
                </label>
              </div>
            )
          ) : (
            // Non-admin view: read-only PDF link
            invoicePdfUrl && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-white/5">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <a
                  href={invoicePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                >
                  View invoice PDF <span className="opacity-50">↗</span>
                </a>
              </div>
            )
          )}

          {/* Show message if nothing available for non-admins */}
          {!showAdminContent && !invoiceUrl && !invoicePdfUrl && (
            <span className={`${t.bodySm} text-text-muted`}>No invoice available yet.</span>
          )}
        </div>
      </section>

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
    </main>
  );
}
