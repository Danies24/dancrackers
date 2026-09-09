import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Firecracker Safety Instructions (Tamil & English)",
};

// [BLOCKED — PRD §12.9, §42.1 item 9] This is a SAMPLE safety text, sourced
// from the representative sample catalogue (Selva Fancy Crackers 2026), not
// yet confirmed by the real Dan Crackers supplier. The English column is an
// unverified rendering for layout purposes only. Per the PRD's hard rule
// (§14.3/§12.9): "do not paraphrase or invent safety guidance" — this MUST
// be replaced with the real supplier's own text, in both languages, before
// launch. Item 8 was not legible in the source scan and is left blank
// rather than guessed.
const instructions: Array<{ ta: string; en: string | null }> = [
  { ta: "பட்டாசு வெடிக்க சிறிய தீக்குச்சிகள், சிறிய ஊதுபத்திகளை பயன்படுத்தக் கூடாது.", en: "Do not use small matchsticks or small incense sticks to light fireworks." },
  { ta: "மரங்கள் மற்றும் மின்சார ஒயர்கள் இருக்கும் இடங்களுக்கு கீழே பட்டாசுகளை வெடிக்க கூடாது.", en: "Do not burst crackers under trees or electrical wires." },
  { ta: "இரண்டு மூன்று வெடிகளை இணைத்து வெடிக்க கூடாது.", en: "Do not join two or three crackers together and light them at once." },
  { ta: "உபயோகப்படுத்தப்பட்ட பட்டாசுகளின் அருகில் எரியும் விளக்கு, ஊதுபத்தி போன்றவற்றை வைக்க கூடாது.", en: "Do not keep a lit lamp or incense stick near stored crackers." },
  { ta: "வெடிக்காமல் பாதியில் நின்று போன வெடிகளுக்கு அருகில் சென்று அவற்றை வெடிக்க வைக்கும் முயற்சியில் ஈடுபடக் கூடாது.", en: "Do not go near a cracker that failed to burst, or try to relight it." },
  { ta: "தெருக்கள் மற்றும் சாலைகளில் பொதுமக்கள் நடந்து செல்லும் பொழுதோ அல்லது வாகனங்களில் செல்லும் பொழுதோ வெடிகளை வீசுவது கூடாது.", en: "Do not throw lit crackers on streets or roads while people or vehicles are passing." },
  { ta: "எந்த ஒரு பட்டாசையும் மற்றவரை நோக்கி எறியவோ குறி வைத்து சுடவோ கூடாது.", en: "Never throw or aim a firework at another person." },
  { ta: null as unknown as string, en: null }, // illegible in source scan — left blank, not guessed
  { ta: "வீட்டிற்குள் பட்டாசுகளை வெடிக்கக் கூடாது.", en: "Do not burst crackers inside the house." },
  { ta: "நாம் பற்றவைத்த பட்டாசுகளை வெடிக்கவில்லை என்றால் அவற்றை கையில் தூக்கிப் பார்ப்பது அல்லது காலால் தள்ளுவது போன்றவைகளை செய்யக்கூடாது.", en: "If a lit cracker does not go off, do not pick it up or kick it." },
  { ta: "பட்டாசு வெடிக்கும் போது பருத்தியினால் ஆன ஆடைகளை அணிவது நல்லது.", en: "Wear cotton clothing while bursting crackers." },
  { ta: "பாதுகாப்பாக வெடித்து, மகிழ்ச்சியாக தீபாவளியை கொண்டாடுவோம்.", en: "Burst crackers safely and celebrate a happy Deepavali." },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Safety Instructions</h1>

      <div className="mt-4 rounded-md border border-amber/30 bg-gold-tint p-3 text-xs text-ink-soft">
        <strong>Draft content.</strong> These instructions are from a representative sample catalogue, not yet
        confirmed by our supplier. The English column is an unverified rendering. This page will be replaced
        with the supplier&apos;s own text, unaltered, before launch.
      </div>

      <ol className="mt-6 flex flex-col gap-3">
        {instructions.map((item, i) => (
          <li key={i} className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs font-semibold text-muted">{i + 1}.</span>
            {item.ta ? (
              <>
                <p lang="ta" className="mt-1 text-ink">
                  {item.ta}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{item.en}</p>
              </>
            ) : (
              <p className="mt-1 text-sm italic text-muted">Not legible in the source document — pending supplier confirmation.</p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-ink-soft">
        <p>
          Fireworks are explosives. Always burst them outdoors, in an open space, under adult supervision, and
          keep water or sand nearby.
        </p>
        <p className="mt-2">
          Permitted bursting hours and locations are set by local authorities and vary by city and year — it is
          your responsibility to observe them.
        </p>
        <p className="mt-2">
          See our{" "}
          <Link href="/compliance" className="font-semibold text-maroon">
            compliance page
          </Link>{" "}
          for the legal framework behind this.
        </p>
      </div>
    </div>
  );
}
