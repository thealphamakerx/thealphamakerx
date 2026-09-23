import Image from "next/image";
import { Anek_Malayalam, Chilanka } from "next/font/google";
import { siteConfig } from "@/config/site";

// Malayalam landing pages: Chilanka (handwritten) for headlines, Anek Malayalam for
// reading text. Both include Latin, so mixed Malayalam/English lines stay consistent.
const malayalam = Anek_Malayalam({ subsets: ["malayalam", "latin"], variable: "--font-ml", display: "swap" });
const malayalamDisplay = Chilanka({ weight: "400", subsets: ["malayalam", "latin"], variable: "--font-ml-display", display: "swap" });

const LINKS = [
  ["My orders", "/orders"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy-policy"],
  ["Refunds", "/refund-policy"],
  ["Delivery", "/shipping-policy"],
  ["Contact", "/contact"],
] as const;

// Landing pages are distraction-free: a logo, the page, and the legal links a
// payment gateway requires — no store navigation to wander off into.
export default function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`${malayalam.variable} ${malayalamDisplay.variable} flex flex-1 flex-col bg-background`}>
      <div className="flex justify-center border-b border-border px-5 py-4">
        <Image src="/logo.png" alt={siteConfig.name} width={170} height={29} priority className="site-logo" />
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border px-5 py-8 pb-24 text-center text-xs text-muted-foreground">
        {/* Absolute links: on a landing domain these pages live on the main store. */}
        <nav aria-label="Legal" className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {LINKS.map(([label, path]) => (
            <a key={path} href={`${siteConfig.url}${path}`} className="hover:text-foreground">{label}</a>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} {siteConfig.legalName} · {siteConfig.contactEmail}</p>
      </footer>
    </div>
  );
}
