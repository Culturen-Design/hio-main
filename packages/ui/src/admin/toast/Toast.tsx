"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../cn";
import type { ToastDescriptor } from "./toastResult";

const AUTO_DISMISS_MS = 4000;

type ToastItem = ToastDescriptor & { id: number };

const ToastContext = createContext<((toast: ToastDescriptor) => void) | null>(null);

export function useToast(): (toast: ToastDescriptor) => void {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used inside <ToastProvider>");
  return push;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(0);
  useEffect(() => setMounted(true), []);

  const push = useCallback((toast: ToastDescriptor) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...toast, id }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
            >
              {toasts.map((toast) => (
                <button
                  key={toast.id}
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left text-sm shadow-sm",
                    toast.kind === "error"
                      ? "border-destructive/30 bg-background text-destructive"
                      : "border-border bg-background text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 inline-block size-2 rounded-full align-middle",
                      toast.kind === "error" ? "bg-destructive" : "bg-success",
                    )}
                  />
                  {toast.message}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}
