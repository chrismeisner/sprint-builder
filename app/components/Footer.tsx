import Link from "next/link";
import { typography } from "./typography";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="container py-10 space-y-4 text-center">
        <p className={`${typography.bodyBase} text-white`}>© {new Date().getFullYear()} Meisner Design</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className={`${typography.bodySm} text-white`}>
            Privacy
          </Link>
          <Link href="/terms" className={`${typography.bodySm} text-white`}>
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

