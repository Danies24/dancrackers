"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DURATION_MS = 4000;
const MAX_STACK = 2;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, action?: ToastAction) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-(MAX_STACK - 1)), { id, message, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "flex w-full max-w-sm items-center justify-between gap-3 rounded-md bg-ink px-4 py-3 text-sm text-white shadow-lg",
            )}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={toast.action.onClick}
                className="shrink-0 font-semibold text-gold underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
