import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const auditLog = await db.orm.public.AuditLog.orderBy((a) => a.createdAt.desc()).limit(20).all();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Payment, roles/permissions, and notification settings aren&apos;t built yet.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium">Audit Log</h2>
        {auditLog.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No admin actions logged yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <div className="flex flex-col divide-y divide-border">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-muted-foreground">
                    {entry.entityType} #{entry.entityId.slice(0, 8)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
