import Link from "next/link";
import { Button } from "@/components/ui/button";

/** §33 case 26 — a dead product link gets a search box and category links, never a dead end. */
export default function ProductNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-xl font-semibold text-ink">We couldn&apos;t find that product</h1>
      <p className="text-sm text-ink-soft">It may have been renamed or is no longer available.</p>
      <Link href="/products">
        <Button>Search the full catalogue →</Button>
      </Link>
    </div>
  );
}
