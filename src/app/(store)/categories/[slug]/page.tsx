export default async function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;

  return (
    <main className="flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">Category: {slug}</h1>
    </main>
  );
}
