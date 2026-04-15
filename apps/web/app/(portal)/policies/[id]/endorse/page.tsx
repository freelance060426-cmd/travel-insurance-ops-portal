export default async function EndorsePolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">ENDORSE POLICY</p>
        <h1 className="page-title">Endorsement flow for policy {id}</h1>
        <p className="page-subtitle">
          This route is reserved for the next implementation step. The current milestone keeps the
          navigation complete for the meeting while we finish the actual endorsement form next.
        </p>
      </section>
    </div>
  );
}
