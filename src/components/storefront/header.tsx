import Link from "next/link";
import { ShoppingBag, User, ArrowUpRight } from "lucide-react";
import { NAV_LINKS } from "@/constants";

export function Header() {
  return (
    <header className="alpha-header">
      <div className="header-inner">
        <Link href="/" className="alpha-wordmark" aria-label="The Alpha Maker X home"><span className="brand-symbol">A<span>↗</span></span><span>THE ALPHA<br /><b>MAKER X</b></span></Link>
        <nav className="header-nav" aria-label="Main navigation">{NAV_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
        <div className="header-actions"><Link href="/account/orders" className="header-icon" aria-label="Account"><User size={20} /></Link><Link href="/cart" className="header-icon" aria-label="Cart"><ShoppingBag size={20} /></Link><Link href="/shop" className="header-shop">Explore guides <ArrowUpRight size={16} /></Link></div>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">{NAV_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    </header>
  );
}
