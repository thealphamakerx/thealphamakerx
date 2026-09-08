import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User } from "lucide-react";
import { NAV_LINKS } from "@/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-chrome/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--breakpoint-xl) items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="The Alpha Maker X"
            width={627}
            height={108}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-chrome-foreground/70 transition-colors hover:text-chrome-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-chrome-foreground">
          <Link href="/account/orders" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link href="/cart" aria-label="Cart">
            <ShoppingBag className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
