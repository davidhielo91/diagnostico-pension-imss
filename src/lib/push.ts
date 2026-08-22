import webpush from "web-push";
import { prisma } from "./prisma";

const vapidPublic  = process.env.VAPID_PUBLIC_KEY  ?? "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
const adminEmail   = process.env.NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@localhost";

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(`mailto:${adminEmail}`, vapidPublic, vapidPrivate);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** Lead id so the service worker can stack notifications per lead (D18). */
  id?: string;
}

export async function enviarPushNotificacion(payload: PushPayload): Promise<void> {
  if (!vapidPublic || !vapidPrivate) return;

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return;

  const json = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      })
    )
  );
}
