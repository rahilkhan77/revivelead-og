import { db } from "@/lib/db";

export async function UnreadNotificationsDot({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const unread = await db.notification.count({
    where: { userId, organizationId, readAt: null },
  });
  if (unread <= 0) return null;
  return <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />;
}
