"use client";

import { useToast } from "@/lib/toast-context";
import Toast from "@/components/ui/Toast";

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            variant={toast.variant}
            duration={0} // Duration handled by context
            onClose={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
