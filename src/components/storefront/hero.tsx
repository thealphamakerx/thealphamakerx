import Link from "next/link";
import { ArrowUpRight, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="alpha-hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> DATING &amp; ATTRACTION FOR MEN</span>
          <h1>Stop guessing.<br />Start understanding<br /><span>women.</span></h1>
          <p>The attraction, dating and relationship truths most men learn too late — in short, practical ebooks you can read tonight and use tomorrow.</p>
          <div className="hero-actions">
            <Link href="/shop" className="alpha-button">See the guides <ArrowUpRight size={20} /></Link>
            <Link href="/about" className="alpha-text-link">Meet your coach <ArrowRight size={17} /></Link>
          </div>
          <div className="hero-assurance"><span><BookOpen size={16} /> Read on any device</span><span><ShieldCheck size={16} /> Private, instant download</span></div>
        </div>
        <div className="hero-art" aria-label="Dating, attraction and confidence guides for men">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <span className="art-note">THE BROTHERHOOD LIBRARY</span>
          <div className="guide-back"><span>THE ALPHA MAKER X</span><strong>KNOW<br />WHAT SHE<br />WON&apos;T SAY.</strong><div className="book-lines" /></div>
          <div className="guide-front"><span className="book-brand">THE ALPHA MAKER <b>X</b></span><span className="book-edition">THE DATING &amp; ATTRACTION COLLECTION</span><strong>BECOME<br />THE MAN<br /><em>SHE CHOOSES.</em></strong><div className="book-symbol" aria-hidden="true">↗</div><span className="book-bottom">LESS GUESSING. MORE CONFIDENCE.</span></div>
          <div className="art-tag"><span className="tag-icon"><BookOpen size={20} /></span><span><strong>No BS. Just what works.</strong><small>Written for ordinary men.</small></span></div>
          <span className="art-caption">DATING / ATTRACTION / CONFIDENCE</span>
        </div>
      </div>
      <div className="hero-bottom"><span>Respect, attraction and confidence — learned, not luck.</span><span>INSTANT DOWNLOAD ↗</span></div>
    </section>
  );
}
