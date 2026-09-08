import { db } from "@/lib/db";
import { CouponsPanel } from "@/components/admin/coupons-panel";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await db.orm.public.Coupon.orderBy((c) => c.createdAt.desc()).all();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Coupons</h1>
      <CouponsPanel coupons={coupons} />
    </div>
  );
}
