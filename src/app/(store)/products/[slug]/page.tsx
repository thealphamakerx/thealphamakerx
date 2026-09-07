export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;

  return (
    <main className="flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">Product: {slug}</h1>
    </main>
  );
}
