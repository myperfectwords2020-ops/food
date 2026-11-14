import { applyMarketingUnsubscribe } from "@/modules/notifications/unsubscribe-token.service";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token;
  if (!token) {
    return (
      <main className="page-shell py-16 max-w-lg">
        <h1 className="page-title">Unsubscribe</h1>
        <p className="text-muted-foreground">This link is invalid or expired.</p>
      </main>
    );
  }

  const result = await applyMarketingUnsubscribe(token);

  return (
    <main className="page-shell py-16 max-w-lg">
      <h1 className="page-title">Email preferences</h1>
      {result.ok ? (
        <p role="status">
          You have been unsubscribed from marketing messages. Transactional emails may still be sent
          when required.
        </p>
      ) : (
        <p className="text-destructive" role="alert">
          {result.error}
        </p>
      )}
    </main>
  );
}
