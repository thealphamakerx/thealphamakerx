export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="w-64 border-r px-4 py-6">Admin</aside>
      <div className="flex-1 px-6 py-6">{children}</div>
    </div>
  );
}
