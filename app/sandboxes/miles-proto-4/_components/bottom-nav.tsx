"use client";

import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BASE, p } from "@/app/sandboxes/miles-proto-4/_lib/nav";
import { Suspense, useEffect, useState } from "react";
import { useMilesSheet } from "@/app/sandboxes/miles-proto-4/_components/miles-sheet";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";

const FOOTER_NAV_MODE_STORAGE_KEY = "miles-proto-4-footer-nav-mode";
type FooterNavMode = "full" | "compact";

const HIDDEN_ON = new Set([
  BASE, BASE + "/",
  p("/hub"), p("/hub/"),
  ...(["/signup", "/signup-name", "/scan-device", "/permissions",
  "/billing", "/install", "/find-port", "/plug-in-device",
  "/pair-device", "/getting-online", "/help-port", "/help-port/vehicle",
  "/help-port/vehicle/result", "/help-port/vin", "/help-port/vin/result",
  "/device-detected",
  "/whos-driving", "/add-drivers", "/trip-indicator", "/settings",
  "/index", "/home-screen", "/notification"].flatMap((r) => [p(r), p(r) + "/"])),
]);

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-semantic-info" : "text-text-muted"}`}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M6.04253 19.4805V20.0425C6.04253 20.4499 5.8972 20.7914 5.60653 21.067C5.31603 21.3427 4.96786 21.4805 4.56203 21.4805H4.00003C3.5942 21.4805 3.24603 21.3352 2.95553 21.0445C2.66486 20.754 2.51953 20.4059 2.51953 20V11.9113L4.64778 5.84453C4.78545 5.44086 5.02436 5.11911 5.36453 4.87928C5.7047 4.63945 6.0832 4.51953 6.50003 4.51953H17.5C17.9169 4.51953 18.2954 4.63945 18.6355 4.87928C18.9757 5.11911 19.2146 5.44086 19.3523 5.84453L21.4805 11.9113V20C21.4805 20.4059 21.3352 20.754 21.0445 21.0445C20.754 21.3352 20.4059 21.4805 20 21.4805H19.438C19.0322 21.4805 18.684 21.3427 18.3935 21.067C18.1029 20.7914 17.9575 20.4499 17.9575 20.0425V19.4805H6.04253ZM5.99778 10H18.0023L17.0228 7.16953H6.97728L5.99778 10ZM7.58478 15.9153C8.00145 15.9153 8.35562 15.7694 8.64728 15.4778C8.93895 15.1861 9.08478 14.8319 9.08478 14.4153C9.08478 13.9986 8.93895 13.6444 8.64728 13.3528C8.35562 13.0611 8.00145 12.9153 7.58478 12.9153C7.16812 12.9153 6.81395 13.0611 6.52228 13.3528C6.23062 13.6444 6.08478 13.9986 6.08478 14.4153C6.08478 14.8319 6.23062 15.1861 6.52228 15.4778C6.81395 15.7694 7.16812 15.9153 7.58478 15.9153ZM16.4153 15.9153C16.8319 15.9153 17.1861 15.7694 17.4778 15.4778C17.7694 15.1861 17.9153 14.8319 17.9153 14.4153C17.9153 13.9986 17.7694 13.6444 17.4778 13.3528C17.1861 13.0611 16.8319 12.9153 16.4153 12.9153C15.9986 12.9153 15.6444 13.0611 15.3528 13.3528C15.0611 13.6444 14.9153 13.9986 14.9153 14.4153C14.9153 14.8319 15.0611 15.1861 15.3528 15.4778C15.6444 15.7694 15.9986 15.9153 16.4153 15.9153Z" />
    </svg>
  );
}

function TripsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-semantic-info" : "text-text-muted"}`}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M15 21.4945L9.00003 19.3945L4.51953 21.1522C4.03553 21.3421 3.5812 21.2881 3.15653 20.9902C2.73186 20.6924 2.51953 20.279 2.51953 19.75V5.74999C2.51953 5.42966 2.6127 5.14383 2.79903 4.89249C2.9852 4.64099 3.2337 4.45941 3.54453 4.34774L9.00003 2.50549L15 4.60549L19.4805 2.84774C19.9645 2.65791 20.4189 2.71191 20.8435 3.00974C21.2682 3.30758 21.4805 3.72099 21.4805 4.24999V18.25C21.4805 18.5703 21.3874 18.8562 21.201 19.1075C21.0149 19.359 20.7664 19.5406 20.4555 19.6522L15 21.4945ZM14 18.3522V7.04774L10 5.64774V16.9522L14 18.3522Z" />
    </svg>
  );
}

function MilesIcon({ active }: { active: boolean }) {
  return (
    <SymbolIcon
      name="auto_awesome"
      filled
      className={`transition-colors ${active ? "text-semantic-info" : "text-text-muted"}`}
    />
  );
}

function DriversIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-semantic-info" : "text-text-muted"}`}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M-0.226074 18.226V16.425C-0.226074 15.633 0.164092 14.9932 0.944426 14.5055C1.72493 14.0178 2.74343 13.774 3.99993 13.774C4.14126 13.774 4.27184 13.7758 4.39168 13.7793C4.51168 13.7829 4.63509 13.792 4.76193 13.8065C4.50026 14.1942 4.30643 14.6026 4.18043 15.0318C4.05426 15.4608 3.99118 15.9085 3.99118 16.375V18.226H-0.226074ZM5.77393 18.226V16.375C5.77393 15.8133 5.92209 15.2953 6.21843 14.8208C6.51476 14.3461 6.94376 13.9327 7.50543 13.5805C8.06693 13.2283 8.73034 12.9642 9.49568 12.788C10.2608 12.612 11.0954 12.524 11.9994 12.524C12.9208 12.524 13.7617 12.612 14.5222 12.788C15.2827 12.9642 15.9438 13.2283 16.5054 13.5805C17.0669 13.9327 17.4941 14.3461 17.7869 14.8208C18.0796 15.2953 18.2259 15.8133 18.2259 16.375V18.226H5.77393ZM20.0087 18.226V16.375C20.0087 15.891 19.9474 15.435 19.8249 15.007C19.7024 14.579 19.5188 14.1788 19.2739 13.8065C19.4008 13.792 19.5228 13.7829 19.6402 13.7793C19.7575 13.7758 19.8774 13.774 19.9999 13.774C21.2678 13.774 22.2891 14.0154 23.0639 14.4983C23.8386 14.9811 24.2259 15.6233 24.2259 16.425V18.226H20.0087ZM4.00118 12.8305C3.41268 12.8305 2.90843 12.6211 2.48843 12.2023C2.06859 11.7833 1.85868 11.2797 1.85868 10.6915C1.85868 10.0855 2.06809 9.57675 2.48693 9.16525C2.90576 8.75359 3.40926 8.54775 3.99743 8.54775C4.60343 8.54775 5.11226 8.75284 5.52393 9.16301C5.93543 9.57317 6.14118 10.0814 6.14118 10.6878C6.14118 11.2764 5.93609 11.7807 5.52593 12.2005C5.11576 12.6205 4.60751 12.8305 4.00118 12.8305ZM20.0012 12.8305C19.4127 12.8305 18.9084 12.6211 18.4884 12.2023C18.0686 11.7833 17.8587 11.2797 17.8587 10.6915C17.8587 10.0855 18.0681 9.57675 18.4869 9.16525C18.9058 8.75359 19.4093 8.54775 19.9974 8.54775C20.6034 8.54775 21.1123 8.75284 21.5239 9.16301C21.9354 9.57317 22.1412 10.0814 22.1412 10.6878C22.1412 11.2764 21.9361 11.7807 21.5259 12.2005C21.1158 12.6205 20.6075 12.8305 20.0012 12.8305ZM11.9999 11.788C11.1038 11.788 10.342 11.4743 9.71468 10.847C9.08751 10.2198 8.77393 9.45817 8.77393 8.562C8.77393 7.6555 9.08751 6.89117 9.71468 6.269C10.342 5.64684 11.1038 5.33575 11.9999 5.33575C12.9064 5.33575 13.6708 5.64684 14.2929 6.269C14.9149 6.89117 15.2259 7.6555 15.2259 8.562C15.2259 9.45817 14.9149 10.2198 14.2929 10.847C13.6708 11.4743 12.9064 11.788 11.9999 11.788Z" />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-semantic-info" : "text-text-muted"}`}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8.14769 13.9228C7.90136 13.6764 7.77819 13.3689 7.77819 13C7.77819 12.6312 7.90136 12.3236 8.14769 12.0773C8.39419 11.8308 8.70186 11.7075 9.07069 11.7075C9.43952 11.7075 9.74711 11.8308 9.99344 12.0773C10.2398 12.3236 10.3629 12.6312 10.3629 13C10.3629 13.3689 10.2398 13.6764 9.99344 13.9228C9.74711 14.1693 9.43952 14.2925 9.07069 14.2925C8.70186 14.2925 8.39419 14.1693 8.14769 13.9228ZM14.0064 13.9228C13.7601 13.6764 13.6369 13.3689 13.6369 13C13.6369 12.6312 13.7601 12.3236 14.0064 12.0773C14.2528 11.8308 14.5604 11.7075 14.9292 11.7075C15.298 11.7075 15.6057 11.8308 15.8522 12.0773C16.0985 12.3236 16.2217 12.6312 16.2217 13C16.2217 13.3689 16.0985 13.6764 15.8522 13.9228C15.6057 14.1693 15.298 14.2925 14.9292 14.2925C14.5604 14.2925 14.2528 14.1693 14.0064 13.9228ZM11.9999 19.8305C14.1768 19.8305 16.0284 19.0744 17.5549 17.562C19.0813 16.0497 19.8444 14.2051 19.8444 12.0283C19.8444 11.6283 19.8194 11.2479 19.7694 10.887C19.7194 10.5262 19.6278 10.1754 19.4944 9.83478C19.1444 9.91811 18.8015 9.98061 18.4657 10.0223C18.1299 10.0639 17.7703 10.0848 17.3869 10.0848C15.8984 10.0848 14.4957 9.76686 13.1787 9.13103C11.8617 8.4952 10.7329 7.60336 9.79244 6.45553C9.27794 7.71786 8.53427 8.81636 7.56144 9.75103C6.58861 10.6859 5.46269 11.3949 4.18369 11.8783V12.0283C4.18369 14.2051 4.94219 16.0497 6.45919 17.562C7.97619 19.0744 9.82311 19.8305 11.9999 19.8305ZM12.0142 22.4805C10.5649 22.4805 9.20361 22.2063 7.93044 21.6578C6.65727 21.1091 5.54711 20.3613 4.59994 19.4143C3.65277 18.4671 2.90494 17.3569 2.35644 16.0838C1.80794 14.8106 1.53369 13.4494 1.53369 12C1.53369 10.5507 1.80794 9.18945 2.35644 7.91628C2.90494 6.64311 3.65277 5.53295 4.59994 4.58578C5.54711 3.63878 6.65727 2.89095 7.93044 2.34228C9.20361 1.79378 10.5649 1.51953 12.0142 1.51953C13.4634 1.51953 14.8222 1.79378 16.0907 2.34228C17.3592 2.89095 18.467 3.63878 19.4142 4.58578C20.3612 5.53295 21.109 6.64311 21.6577 7.91628C22.2062 9.18945 22.4804 10.5507 22.4804 12C22.4804 13.4494 22.2062 14.8106 21.6577 16.0838C21.109 17.3569 20.3612 18.4671 19.4142 19.4143C18.467 20.3613 17.3592 21.1091 16.0907 21.6578C14.8222 22.2063 13.4634 22.4805 12.0142 22.4805Z" />
    </svg>
  );
}

// ── Tab definitions ──────────────────────────────────────────────────
// Every tab carries a stable `id`, an icon, a label, and a `match`
// predicate used purely to highlight the tab when on a related URL.
//
// Tab `kind`:
//   - "link"  → renders as a <Link>, navigates on tap.
//   - "sheet" → renders as a <button>, opens the Miles half-sheet on tap.
//
// Today only Miles is a sheet tab. The discrimination keeps the special-
// case from leaking into the render loop as string equality.

interface BaseTabDef {
  id: string;
  label: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  match: (pathname: string) => boolean;
}
interface LinkTabDef extends BaseTabDef {
  kind: "link";
  href: string;
}
interface SheetTabDef extends BaseTabDef {
  kind: "sheet";
}
type TabDef = LinkTabDef | SheetTabDef;

const TABS: TabDef[] = [
  {
    kind: "link",
    id: "dashboard",
    href: "/dashboard",
    label: "Vehicles",
    icon: DashboardIcon,
    match: (pn) =>
      pn === `${BASE}/dashboard` ||
      pn === `${BASE}/dashboard/` ||
      pn.startsWith(`${BASE}/dashboard?`),
  },
  {
    kind: "link",
    id: "trips",
    href: "/trips",
    label: "Trips",
    icon: TripsIcon,
    match: (pn) =>
      pn.startsWith(`${BASE}/trips`) ||
      pn.startsWith(`${BASE}/trip-`),
  },
  {
    kind: "sheet",
    id: "miles",
    label: "Ask Miles",
    icon: MilesIcon,
    // Deep-link fallback: highlight Miles when on the /miles URL even
    // when the sheet isn't open (rare, but possible from shared links).
    match: (pn) => pn === `${BASE}/miles` || pn === `${BASE}/miles/`,
  },
  {
    kind: "link",
    id: "drivers",
    href: "/drivers",
    label: "Drivers",
    icon: DriversIcon,
    match: (pn) => pn.startsWith(`${BASE}/drivers`),
  },
  {
    kind: "link",
    id: "profile",
    href: "/profile",
    label: "Profile",
    icon: AccountIcon,
    match: (pn) =>
      pn === `${BASE}/profile` ||
      pn === `${BASE}/profile/` ||
      pn.startsWith(`${BASE}/profile?`),
  },
];

// ── Active-state precedence cascade ─────────────────────────────────
// Returns the single active tab id. Order matters — earlier rules win.

function getActiveTabId({
  pathname,
  sheetOpen,
  sheetDetent,
  isVehicleModal,
  fromTab,
  isFamilyLiveTrip,
}: {
  pathname: string;
  sheetOpen: boolean;
  sheetDetent: "medium" | "large";
  isVehicleModal: boolean;
  fromTab: string | null;
  isFamilyLiveTrip: boolean;
}): string | null {
  // 1. Miles sheet at large detent owns active state. At medium the
  //    underlying page's tab keeps focus — see miles-sheet.tsx.
  if (sheetOpen && sheetDetent === "large") return "miles";
  // 2. Vehicle/health modals retain the tab the user came from.
  if (isVehicleModal && fromTab) {
    const t = TABS.find((x) => x.kind === "link" && x.href === `/${fromTab}`);
    if (t) return t.id;
  }
  // 3. A family-member live trip viewed from the dashboard belongs to Trips.
  if (isFamilyLiveTrip) return "trips";
  // 4. Default: first tab whose match() returns true for this pathname.
  const t = TABS.find((x) => x.match(pathname));
  return t?.id ?? null;
}

// ─── Tab item — icon on top, label below ──────────────────────────────────────
// Two render paths: NavTabLink (default, navigates) and NavTabButton (used by
// the Miles tab, which opens the global half-sheet instead of navigating).

const TAB_ITEM_CLASSES =
  "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 motion-safe:transition-transform motion-safe:duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-info focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function TabItemContents({
  tab,
  active,
  showBadgeDot,
}: {
  tab: TabDef;
  active: boolean;
  showBadgeDot: boolean;
}) {
  const Icon = tab.icon;
  return (
    <>
      <span className="relative flex items-center justify-center">
        <Icon active={active} />
        {showBadgeDot && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-semantic-info ring-2 ring-background" />
        )}
      </span>
      <span
        className={`text-[10px] font-medium leading-none transition-colors ${
          active ? "text-semantic-info" : "text-text-muted"
        }`}
      >
        {tab.label}
      </span>
    </>
  );
}

function NavTabLink({
  tab,
  active,
  showBadgeDot,
  onNavigate,
}: {
  tab: LinkTabDef;
  active: boolean;
  showBadgeDot: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={tab.href} onClick={onNavigate} className={TAB_ITEM_CLASSES}>
      <TabItemContents tab={tab} active={active} showBadgeDot={showBadgeDot} />
    </Link>
  );
}

function NavTabButton({
  tab,
  active,
  showBadgeDot,
  onClick,
}: {
  tab: SheetTabDef;
  active: boolean;
  showBadgeDot: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={TAB_ITEM_CLASSES}>
      <TabItemContents tab={tab} active={active} showBadgeDot={showBadgeDot} />
    </button>
  );
}

// ─── Inner nav (needs usePathname / useSearchParams) ──────────────────────────

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sheet = useMilesSheet();
  const [footerNavMode, setFooterNavMode] = useState<FooterNavMode>("full");

  useEffect(() => {
    const readMode = () => {
      try {
        const raw = window.localStorage.getItem(FOOTER_NAV_MODE_STORAGE_KEY);
        setFooterNavMode(raw === "compact" ? "compact" : "full");
      } catch {
        setFooterNavMode("full");
      }
    };

    readMode();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === FOOTER_NAV_MODE_STORAGE_KEY) {
        readMode();
      }
    };
    const handleCustomChange = () => readMode();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("miles-proto-4-footer-nav-mode-change", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("miles-proto-4-footer-nav-mode-change", handleCustomChange);
    };
  }, []);

  if (HIDDEN_ON.has(pathname)) return null;

  // When viewing a family member's live trip from the dashboard,
  // treat it as belonging to the Trips tab.
  const isFamilyLiveTrip =
    (pathname === `${BASE}/dashboard` || pathname === `${BASE}/dashboard/`) &&
    !!searchParams.get("vehicleLabel");

  // When on /vehicle or /device-health, retain the tab the user came from.
  const isVehicleModal =
    pathname === `${BASE}/vehicle` || pathname === `${BASE}/vehicle/` ||
    pathname === `${BASE}/device-health` || pathname === `${BASE}/device-health/`;
  const fromTab = isVehicleModal ? (searchParams.get("from") ?? "dashboard") : null;
  const tabsToRender =
    footerNavMode === "compact" ? TABS.filter((tab) => tab.label !== "Account") : TABS;

  const activeId = getActiveTabId({
    pathname,
    sheetOpen: sheet.open,
    sheetDetent: sheet.detent,
    isVehicleModal,
    fromTab,
    isFamilyLiveTrip,
  });

  // Tap a sheet-kind tab → always open at medium detent (the global
  // "Ask Miles previewed at 66%" rule). The sheet auto-expands to large
  // on the user's first interaction (see onUserInteraction wiring in
  // miles-sheet.tsx). Three cases:
  //   1. Sheet already open → bump to large (treat the re-tap as
  //      explicit engagement, same effect as auto-expand-on-interaction).
  //   2. Sheet closed but a saved thread exists → resume at medium.
  //   3. Otherwise → fresh "home" context at medium.
  function handleSheetTabTap() {
    if (sheet.open) {
      sheet.setDetent("large");
    } else if (sheet.savedThread) {
      sheet.openMilesSheet(sheet.savedThread.context, "medium");
    } else {
      sheet.openMilesSheet("home", "medium");
    }
  }

  // Tap any non-Miles tab while the sheet is open → close-with-save so
  // the conversation becomes resumable from the Miles tab. The Link
  // still navigates as normal afterwards; the sheet animates closed
  // alongside the page transition.
  function handleLinkTabTap() {
    if (sheet.open) sheet.closeMilesSheet({ save: true });
  }

  return (
    <>
      {/* Publish nav height as a CSS var so the Miles half-sheet (and any
          future overlays) can clamp themselves above the bottom nav. The
          var is removed automatically when this component returns null on
          chrome-free routes — overlays then fill to the viewport bottom. */}
      <style>{`:root { --miles-bottom-inset: calc(60px + env(safe-area-inset-bottom)); }`}</style>
      <nav
        className="sticky bottom-0 z-40 shrink-0 border-t border-stroke-muted bg-background"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex items-center justify-around px-2 py-2">
          {tabsToRender.map((tab) => {
            const active = tab.id === activeId;
            // Badge dot is purely a "convo in progress" signal. It only
            // appears on sheet-kind tabs when a saved thread exists and
            // the tab itself isn't currently active. No static "always
            // show" config — default is no dot.
            const showBadgeDot =
              tab.kind === "sheet" && !active && !!sheet.savedThread;
            return tab.kind === "sheet" ? (
              <NavTabButton
                key={tab.id}
                tab={tab}
                active={active}
                showBadgeDot={showBadgeDot}
                onClick={handleSheetTabTap}
              />
            ) : (
              <NavTabLink
                key={tab.id}
                tab={tab}
                active={active}
                showBadgeDot={false}
                onNavigate={handleLinkTabTap}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense>
      <BottomNavInner />
    </Suspense>
  );
}
