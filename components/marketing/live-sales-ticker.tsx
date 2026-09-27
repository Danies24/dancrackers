"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAMES = ["Senthil", "Karthik", "Ramesh", "Suresh", "Dinesh", "Kumar", "Rajesh", "Balaji", "Arun", "Vijay", "Prakash", "Ashok", "Siva", "Manoj", "Pradeep", "Vignesh"];
const CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Erode", "Vellore", "Tiruppur", "Kanyakumari", "Bengaluru", "Pondicherry", "Kochi"];
const PRODUCTS = ["Mega Family Combo", "Kids Special Combo", "Standard Combo", "Night Crackers Box", "Sparklers Value Pack", "1000-Wala Garland"];
const SHOPS = ["Sri Ram Crackers", "Gurusamy Fireworks", "Standard Fireworks", "Bullet Crackers"];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LiveSalesTicker() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initial delay: 6 minutes (360,000 ms) as requested for realism
    // Note: Most users leave before 6 mins, but this strictly follows the business tactic requested.
    const initialTimer = setTimeout(() => {
      showNext();
    }, 6 * 60 * 1000);
    
    let hideTimer: NodeJS.Timeout;
    let showTimer: NodeJS.Timeout;

    function showNext() {
      const name = getRandom(NAMES);
      const city = getRandom(CITIES);
      const product = getRandom(PRODUCTS);
      const shop = getRandom(SHOPS);
      const price = Math.floor(Math.random() * (12000 - 3000 + 1)) + 3000; // ₹3000 to ₹12000

      // Randomly pick between product enquiry or price enquiry
      const isPriceEnquiry = Math.random() > 0.5;
      const includeCity = Math.random() > 0.5;

      let text = "";
      if (isPriceEnquiry) {
        text = `${name}${includeCity ? ` from ${city}` : ""} enquired for ₹${price} worth of crackers from ${shop}`;
      } else {
        text = `${name}${includeCity ? ` from ${city}` : ""} enquired ${product} from ${shop}`;
      }

      setMessage(text);
      setTime(Math.random() > 0.5 ? "Just now" : `${Math.floor(Math.random() * 5) + 1} mins ago`);
      setVisible(true);

      // Hide popup after 6 seconds
      hideTimer = setTimeout(() => {
        setVisible(false);
        // Next popup in 5 to 10 minutes (300,000 to 600,000 ms)
        const nextDelay = (Math.floor(Math.random() * 6) + 5) * 60 * 1000; 
        showTimer = setTimeout(showNext, nextDelay);
      }, 6000);
    }

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, []);

  if (!mounted || pathname !== "/") return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 z-50 max-w-[320px] rounded-xl border border-border bg-surface p-3.5 shadow-2xl transition-all duration-700 ease-out sm:max-w-sm",
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
          <p className="text-[13px] leading-snug text-ink capitalize-first">
            {message}
          </p>
          <p className="mt-1 text-[10px] font-medium text-muted">
            {time} • Verified Enquiry
          </p>
        </div>
      </div>
    </div>
  );
}
