import Link from "next/link";
import { ArrowUpRight, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="alpha-hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> THE WORK STARTS WITH YOU</span>
          <h1>Good intentions.<br />Real action.<br /><span>A better you.</span></h1>
          <p>Build the confidence, discipline, and relationships you want. Practical digital guides for men ready to take the next step.</p>
          <div className="hero-actions">
            <Link href="/shop" className="alpha-button">Find your guide <ArrowUpRight size={20} /></Link>
            <Link href="/about" className="alpha-text-link">Meet your coach <ArrowRight size={17} /></Link>
          </div>
          <div className="hero-assurance"><span><BookOpen size={16} /> Read anywhere</span><span><ShieldCheck size={16} /> Instant digital access</span></div>
        </div>
        <div className="hero-art" aria-label="Confidence, discipline, and growth: the foundations of your next chapter">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <span className="art-note">YOUR NEXT CHAPTER</span>
          <div className="guide-back"><span>THE ALPHA MAKER X</span><strong>BUILD<br />YOUR<br />DISCIPLINE.</strong><div className="book-lines" /></div>
          <div className="guide-front"><span className="book-brand">THE ALPHA MAKER <b>X</b></span><span className="book-edition">THE PERSONAL GROWTH COLLECTION</span><strong>IT STARTS<br />WITH<br /><em>YOU.</em></strong><div className="book-symbol" aria-hidden="true">↗</div><span className="book-bottom">LESS OVERTHINKING. MORE LIVING.</span></div>
          <div className="art-tag"><span className="tag-icon"><BookOpen size={20} /></span><span><strong>Small steps. Real growth.</strong><small>Your pace. Your next chapter.</small></span></div>
          <span className="art-caption">CONFIDENCE / FITNESS / RELATIONSHIPS</span>
        </div>
      </div>
      <div className="hero-bottom"><span>A stronger mindset. A more intentional life.</span><span>MADE FOR YOUR EVERYDAY ↗</span></div>
    </section>
  );
}
