import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, ArrowUpRight } from "lucide-react";
import { NAV_LINKS } from "@/constants";

export function Header() {
  return (
    <header className="alpha-header">
      <div className="header-inner">
        <Link href="/" className="alpha-wordmark" aria-label="The Alpha Maker X home">
          <Image src="/logo.png" alt="The Alpha Maker X" width={188} height={32} priority className="site-logo" />
        </Link>
        <nav className="header-nav" aria-label="Main navigation">{NAV_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
        <div className="header-actions"><Link href="/account/orders" className="header-icon" aria-label="Account"><User size={20} /></Link><Link href="/cart" className="header-icon" aria-label="Cart"><ShoppingBag size={20} /></Link><Link href="/shop" className="header-shop">Explore guides <ArrowUpRight size={16} /></Link></div>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">{NAV_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    </header>
  );
}
