import { db } from "@/lib/db";
import { authPool } from "@/lib/auth";
import { ProductsManager, type AdminProduct } from "@/components/admin/products/products-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Unpublished products are listed too — their files must stay reachable for past buyers.
  const [products, features, images, { rows: stats }] = await Promise.all([
    db.orm.public.Product.orderBy((p) => p.createdAt.desc()).all(),
    db.orm.public.ProductFeature.orderBy((f) => f.position.asc()).all(),
    db.orm.public.ProductImage.orderBy((i) => i.position.asc()).all(),
    authPool.query<{ productId: string; orders: string; sold: string; revenue: string; landing: string }>(`
      select p.id as "productId",
        (select count(*) from public."orderItem" i where i."productId" = p.id) as orders,
        (select count(*) from public."orderItem" i join public."order" o on o.id = i."orderId" where i."productId" = p.id and o.status = 'PAID') as sold,
        (select coalesce(sum(i."finalPrice"), 0) from public."orderItem" i join public."order" o on o.id = i."orderId" where i."productId" = p.id and o.status = 'PAID') as revenue,
        (select count(*) from public."landingPage" l where l."productId" = p.id) as landing
      from public.product p`),
  ]);
  const statsById = new Map(stats.map((s) => [s.productId, s]));

  const rows: AdminProduct[] = products.map((p) => {
    const s = statsById.get(p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      price: p.price,
      originalPrice: p.originalPrice ?? null,
      badge: p.badge ?? null,
      isActive: p.isActive,
      downloadFile: p.digitalFileName
        ? { name: p.digitalFileName, size: p.digitalFileSize ?? null, uploadedAt: p.digitalFileUploadedAt ?? null }
        : null,
      previewFile: p.previewFileName
        ? { name: p.previewFileName, size: p.previewFileSize ?? null, uploadedAt: p.previewFileUploadedAt ?? null }
        : null,
      digitalAccessUrl: p.digitalAccessUrl ?? null,
      ratingOverride: p.ratingOverride ?? null,
      reviewCountOverride: p.reviewCountOverride ?? null,
      features: features.filter((f) => f.productId === p.id).map((f) => f.label),
      images: images.filter((i) => i.productId === p.id).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
      sold: Number(s?.sold ?? 0),
      revenue: Number(s?.revenue ?? 0),
      orders: Number(s?.orders ?? 0),
      landingPages: Number(s?.landing ?? 0),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground">Click a product to edit it, change its images and file, or publish and unpublish it.</p>
      </div>
      <ProductsManager products={rows} />
    </div>
  );
}
