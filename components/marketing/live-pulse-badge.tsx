"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function LivePulseBadge() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(14); // Initial random-looking number
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    // Set initial count between 10 and 30
    setCount(Math.floor(Math.random() * (30 - 10 + 1)) + 10);

    // Randomly fluctuate the number every 8 to 20 seconds
    const interval = setInterval(() => {
      setCount((prev) => {
        // Change by -3 to +3
        const change = Math.floor(Math.random() * 7) - 3;
        let newCount = prev + change;
        if (newCount < 10) newCount = 10 + Math.abs(change);
        if (newCount > 30) newCount = 30 - Math.abs(change);
        return newCount;
      });
    }, Math.floor(Math.random() * 12000) + 8000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || pathname !== "/") return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex animate-fade-in-up items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 shadow-lg sm:right-6">
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
      </div>
      <span className="text-[11px] font-medium text-ink-soft sm:text-xs">
        <strong className="font-bold text-ink">{count}</strong> people looking right now
      </span>
    </div>
  );
}
