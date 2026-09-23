// Real messages readers sent after buying — shown as the original screenshots.
const SCREENSHOTS = [
  { url: "https://ik.imagekit.io/thealphamakerx/alphamakerx/testimonials/female-secrets-review-1.jpg", alt: "A reader's message after finishing Female Secrets" },
  { url: "https://ik.imagekit.io/thealphamakerx/alphamakerx/testimonials/female-secrets-review-2.jpg", alt: "A reader's message saying he read Female Secrets in one sitting" },
  { url: "https://ik.imagekit.io/thealphamakerx/alphamakerx/testimonials/female-secrets-review-3.jpg", alt: "A reader's message wishing he had found the guide earlier" },
];

export function Testimonials() {
  return (
    <section className="w-full mx-auto max-w-(--breakpoint-xl) px-6 py-24 md:px-16">
      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <span className="text-sm font-medium tracking-wide text-primary uppercase">From Our Readers</span>
        <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">What Readers Are Saying</h2>
        <p className="max-w-md text-sm text-muted-foreground">Unedited messages readers sent us after reading Female Secrets.</p>
      </div>
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
        {SCREENSHOTS.map((s) => (
          <figure key={s.url} className="break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- screenshots keep their natural height; ImageKit resizes them */}
            <img src={`${s.url}?tr=w-700`} alt={s.alt} loading="lazy" className="block w-full" />
          </figure>
        ))}
      </div>
    </section>
  );
}
