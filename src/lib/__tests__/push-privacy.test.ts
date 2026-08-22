import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => {
  process.env.VAPID_PUBLIC_KEY = "test-public";
  process.env.VAPID_PRIVATE_KEY = "test-private";

  return {
    pushSubscription: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  };
});

const authMock = vi.hoisted(() => vi.fn());
const sendNotification = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification },
}));

import { DELETE, POST } from "@/app/api/push/subscribe/route";
import { enviarPushNotificacion } from "@/lib/push";

const subscription = {
  endpoint: "https://push.example/a",
  keys: { p256dh: "p256dh", auth: "auth" },
};

describe("push subscription privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-a" } });
    prismaMock.pushSubscription.upsert.mockResolvedValue({});
    prismaMock.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.pushSubscription.findMany.mockResolvedValue([]);
    prismaMock.user.findFirst.mockResolvedValue(null);
    sendNotification.mockResolvedValue(undefined);
  });

  it("binds subscription creation and removal to the authenticated user", async () => {
    const postResponse = await POST(new NextRequest("https://example.com/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription),
    }));
    const deleteResponse = await DELETE(new NextRequest("https://example.com/api/push/subscribe", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }));

    expect(postResponse.status).toBe(200);
    expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint },
      create: { endpoint: subscription.endpoint, p256dh: "p256dh", auth: "auth", userId: "user-a" },
      update: { p256dh: "p256dh", auth: "auth", userId: "user-a" },
    });
    expect(deleteResponse.status).toBe(200);
    expect(prismaMock.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint, userId: "user-a" },
    });
  });

  it("delivers a lead notification only to its owner's subscriptions", async () => {
    prismaMock.pushSubscription.findMany.mockResolvedValue([
      { endpoint: "https://push.example/a", p256dh: "a", auth: "a", userId: "user-a" },
    ]);

    await enviarPushNotificacion({ title: "New lead", body: "Private lead", id: "lead-a" }, { userId: "user-a" });

    expect(prismaMock.pushSubscription.findMany).toHaveBeenCalledWith({ where: { userId: "user-a" } });
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "https://push.example/a", keys: { p256dh: "a", auth: "a" } },
      expect.stringContaining("lead-a")
    );
  });

  it("uses the active administrator for an unassigned lead and never broadcasts legacy subscriptions", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "admin-1" });
    prismaMock.pushSubscription.findMany.mockResolvedValue([
      { endpoint: "https://push.example/admin", p256dh: "a", auth: "a", userId: "admin-1" },
    ]);

    await enviarPushNotificacion({ title: "New lead", body: "Private lead" }, { userId: null });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { role: "administrador", active: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    expect(prismaMock.pushSubscription.findMany).toHaveBeenCalledWith({ where: { userId: "admin-1" } });
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it("does not send when a legacy subscription cannot be safely assigned", async () => {
    await enviarPushNotificacion({ title: "New lead", body: "Private lead" }, { userId: null });

    expect(prismaMock.pushSubscription.findMany).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
});

describe("push privacy migration", () => {
  it("keeps both schemas aligned and adds a PostgreSQL backfill migration", async () => {
    const root = process.cwd();
    const [postgresSchema, sqliteSchema, migration] = await Promise.all([
      readFile(path.join(root, "prisma/schema.prisma"), "utf8"),
      readFile(path.join(root, "prisma/schema.sqlite.prisma"), "utf8"),
      readFile(path.join(root, "prisma/migrations/20260822000000_scope_push_subscriptions/migration.sql"), "utf8"),
    ]);

    expect(postgresSchema).toContain('provider = "postgresql"');
    for (const schema of [postgresSchema, sqliteSchema]) {
      expect(schema).toContain("userId    String?");
      expect(schema).toContain("subscriber User?");
      expect(schema).toContain("@@index([userId])");
    }
    expect(migration).toContain('ADD COLUMN "userId" TEXT');
    expect(migration).toContain('UPDATE "PushSubscription"');
    expect(migration).toContain('"role" = \'administrador\'');
    expect(migration).toContain('FOREIGN KEY ("userId") REFERENCES "User"("id")');
  });
});
