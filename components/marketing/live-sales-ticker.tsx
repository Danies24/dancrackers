"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAMES = ["Senthil", "Karthik", "Ramesh", "Suresh", "Dinesh", "Kumar", "Rajesh", "Balaji", "Arun", "Vijay", "Prakash", "Ashok", "Siva", "Manoj", "Pradeep", "Vignesh"];
const CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Erode", "Vellore", "Tiruppur", "Kanyakumari", "Bengaluru", "Pondicherry", "Kochi"];
const PRODUCTS = ["Mega Combo Pack", "Family Combo", "Kids Special Combo", "Standard Combo", "Night Crackers Box", "Sparklers Value Pack", "1000-Wala Garland", "12-Shot Sky Flash"];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LiveSalesTicker() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ name: "", city: "", product: "", time: "Just now" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initial delay before first popup
    const initialTimer = setTimeout(() => {
      showNext();
    }, 5000); // 5 seconds after load
    
    let hideTimer: NodeJS.Timeout;
    let showTimer: NodeJS.Timeout;

    function showNext() {
      setData({
        name: getRandom(NAMES),
        city: getRandom(CITIES),
        product: getRandom(PRODUCTS),
        time: Math.random() > 0.5 ? "Just now" : `${Math.floor(Math.random() * 15) + 1} mins ago`,
      });
      setVisible(true);

      // Hide after 5 seconds
      hideTimer = setTimeout(() => {
        setVisible(false);
        // Show next after 10-25 seconds
        showTimer = setTimeout(showNext, Math.floor(Math.random() * 15000) + 10000);
      }, 5000);
    }

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 z-50 max-w-[280px] rounded-xl border border-border bg-surface p-3.5 shadow-2xl transition-all duration-700 ease-out sm:max-w-xs",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug text-ink">
            <span className="font-bold text-ink">{data.name}</span> from <span className="font-semibold text-ink-soft">{data.city}</span> just ordered
          </p>
          <p className="mt-0.5 truncate text-[13px] font-bold text-maroon-ink">
            {data.product}
          </p>
          <p className="mt-1 text-[10px] font-medium text-muted">
            {data.time} • Verified Purchase
          </p>
        </div>
      </div>
    </div>
  );
}
