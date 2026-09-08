"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | Date;
};

export function ReviewModerationRow({ review }: { review: Review }) {
  const router = useRouter();

  async function setStatus(status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      toast.add({
        title: status === "APPROVED" ? "Review approved" : "Review rejected",
        type: status === "APPROVED" ? "success" : "info",
      });
    } else {
      toast.add({ title: "Could not update review", type: "error" });
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <StarRating rating={review.rating} />
          <Badge variant={review.status === "PENDING" ? "secondary" : "default"}>
            {review.status}
          </Badge>
        </div>
        {review.comment && <p className="text-sm">{review.comment}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
          {review.status === "PENDING" && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus("REJECTED")}>
                Reject
              </Button>
              <Button size="sm" onClick={() => setStatus("APPROVED")}>
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
