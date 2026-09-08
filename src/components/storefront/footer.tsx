import Link from "next/link";
import Image from "next/image";
import { AtSign, Video, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FOOTER_LINKS } from "@/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-chrome text-chrome-foreground">
      <div className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-2 gap-8 px-6 py-12 md:grid-cols-5 md:px-16">
        <div className="col-span-2 flex flex-col gap-3">
          <Image
            src="/logo.png"
            alt="The Alpha Maker X"
            width={627}
            height={108}
            className="h-7 w-auto"
          />
          <p className="max-w-xs text-sm text-chrome-foreground/70">{siteConfig.description}</p>
          <div className="mt-2 flex items-center gap-4">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-chrome-foreground/70 transition-colors hover:text-chrome-foreground"
            >
              <AtSign className="size-4" />
            </a>
            <a
              href={siteConfig.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="text-chrome-foreground/70 transition-colors hover:text-chrome-foreground"
            >
              <Video className="size-4" />
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              aria-label="Email"
              className="text-chrome-foreground/70 transition-colors hover:text-chrome-foreground"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <FooterColumn title="Shop" links={FOOTER_LINKS.shop} />
        <FooterColumn title="Account" links={FOOTER_LINKS.account} />
        <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col items-center justify-between gap-2 px-6 py-6 text-center text-xs text-chrome-foreground/60 sm:flex-row sm:text-left md:px-16">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-chrome-foreground">
            {siteConfig.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-chrome-foreground">{title}</span>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-chrome-foreground/70 transition-colors hover:text-chrome-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
