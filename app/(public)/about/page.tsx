import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "About Dan Crackers" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">About Us</h1>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        <p>
          Dan Crackers is run by Dan and Arun. Dan is based in Avudiyapuram, Virudhunagar District — about an
          hour from the Sivakasi fireworks belt — and handles the catalogue, technology, and the order desk.
          Arun handles captain relationships and customer calls, largely in Chennai.
        </p>
        <p>
          We are not the manufacturer or seller of the fireworks on this site.{" "}
          <strong>{siteConfig.supplier.name}</strong> manufactures and sells every product here, and holds the
          licences required to do so. We facilitate your order — building a clear, priced catalogue,
          collecting your enquiry, and connecting you with the supplier so you can confirm and pay them
          directly.
        </p>
        <p>
          Because Dan lives close to the mills, we can visit in person, check products, and photograph them
          ourselves — rather than relying on a photocopied price list. That is the whole reason this site
          exists: to replace a hard-to-read paper list with something you can actually see, search and trust.
        </p>
        <p>
          For product quality, warranty or manufacturing questions, the supplier is directly reachable — see
          our <a href="/contact" className="font-semibold text-maroon">Contact</a> page.
        </p>
      </div>
    </div>
  );
}
