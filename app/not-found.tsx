import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-ink-soft">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/products" className="font-semibold text-maroon-ink">
        Browse Crackers →
      </Link>
    </div>
  );
}
