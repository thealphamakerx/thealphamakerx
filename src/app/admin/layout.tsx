import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Toaster } from "@/components/ui/toast";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <Toaster>
      <div className="flex min-h-screen flex-1">
        <AdminSidebar name={session.user.name} email={session.user.email} />
        <div className="flex-1 overflow-x-auto px-8 py-8">{children}</div>
      </div>
    </Toaster>
  );
}
