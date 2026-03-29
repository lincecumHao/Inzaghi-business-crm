export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <h1>訂單詳情</h1>
      <p>{id}</p>
    </div>
  )
}
