import { getAllOffers } from "@/lib/offers";
import { getAllProducts } from "@/lib/products";
import { OffersManager } from "@/components/admin/offers-manager";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const [offers, { products }] = await Promise.all([getAllOffers(), getAllProducts(1, { includeInactive: true })]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Combos</h1>
        <p className="text-sm text-muted-foreground">
          Bundles of products at one price. Active combos appear on their products&apos; pages, at checkout, and on landing pages you add them to.
        </p>
      </div>
      <OffersManager offers={offers} products={products.map((p) => ({ id: p.id, name: p.name, price: p.price, isActive: p.isActive }))} />
    </div>
  );
}
