import { db } from "@/lib/db";
import { ReviewModerationRow } from "@/components/admin/review-moderation-row";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await db.orm.public.Review
    .orderBy((r) => r.createdAt.desc())
    .all();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reviews</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewModerationRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
