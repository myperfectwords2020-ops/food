"use server";

import { getRequestContext } from "@/lib/auth/request-context";
import {
  listCustomerNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/notification.service";

export async function listAccountNotificationsAction(page = 1) {
  const ctx = await getRequestContext();
  if (!ctx?.customerId || !ctx.tenantId) {
    return { ok: false as const, error: "Sign in to view notifications." };
  }
  const data = await listCustomerNotifications(ctx.tenantId, ctx.customerId, page, 20);
  return { ok: true as const, data };
}

export async function markNotificationReadAction(id: string) {
  const ctx = await getRequestContext();
  if (!ctx?.customerId || !ctx.tenantId) {
    return { ok: false as const, error: "Unauthorized." };
  }
  await markNotificationRead(ctx.tenantId, ctx.customerId, id);
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const ctx = await getRequestContext();
  if (!ctx?.customerId || !ctx.tenantId) {
    return { ok: false as const, error: "Unauthorized." };
  }
  await markAllNotificationsRead(ctx.tenantId, ctx.customerId);
  return { ok: true as const };
}
