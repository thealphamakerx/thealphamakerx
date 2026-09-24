import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { MetaPixel } from "@/components/analytics/meta-pixel";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <MetaPixel />
    </div>
  );
}
