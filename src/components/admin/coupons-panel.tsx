"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
};

export function CouponsPanel({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      toast.add({ title: `Coupon "${code.toUpperCase()}" created`, type: "success" });
      setCode("");
      setDiscountValue("");
      setMinOrderAmount("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.add({ title: "Could not create coupon", description: data?.error, type: "error" });
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });

    if (res.ok) {
      toast.add({ title: active ? "Coupon deactivated" : "Coupon activated", type: "success" });
      router.refresh();
    } else {
      toast.add({ title: "Could not update coupon", type: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WELCOME10"
                required
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <Select value={discountType} onValueChange={(v) => v && setDiscountType(v as "PERCENTAGE" | "FIXED")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed (paise)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="discountValue">Value</Label>
              <Input
                id="discountValue"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                className="w-24"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="minOrderAmount">Min order (paise)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-32"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              <Plus className="size-4" />
              {submitting ? "Creating…" : "Create Coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No coupons yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className={!coupon.active ? "opacity-60" : undefined}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{coupon.code}</span>
                  <Badge variant="secondary">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : `₹${(coupon.discountValue / 100).toFixed(2)}`}
                  </Badge>
                  {!coupon.active && <Badge variant="destructive">Inactive</Badge>}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(coupon.id, coupon.active)}
                >
                  {coupon.active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
