import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}
