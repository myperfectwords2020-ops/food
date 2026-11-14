"use server";

import { getSessionUser } from "@/lib/auth/index";
import { rankProducts } from "@/modules/recommendations/recommendation.engine";
import {
  persistCustomerRecommendation,
  recommendRoutine,
} from "@/modules/recommendations/routine-recommendation.service";
import { listPublicProducts } from "@/modules/catalog/public-catalog.service";
import type { RoutineAnswers } from "@/types/commerce";

export async function recommendRoutineAction(answers: RoutineAnswers) {
  const result = await recommendRoutine(answers);

  const user = await getSessionUser();
  if (user?.role === "CUSTOMER" && user.tenantId) {
    const { prisma } = await import("@/lib/db/prisma");
    const customer = await prisma.customer.findFirst({
      where: { userId: user.id, tenantId: user.tenantId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });
    if (customer) {
      const { createLead } = await import("@/modules/leads/lead.service");
      const name =
        [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() || customer.email;
      void createLead({
        tenantId: user.tenantId,
        source: "ROUTINE",
        name,
        email: customer.email,
        phone: customer.phone,
        concern: answers.concern,
        interest: answers.goals,
        customerId: customer.id,
        routineCompleted: true,
        actorUserId: user.id,
      }).catch(() => undefined);
      const { items } = await listPublicProducts({ pageSize: 50 });
      const scored = rankProducts(items, answers)
        .slice(0, 6)
        .map((r) => ({
          productId: r.product.id,
          score: r.score,
          reasons: r.reasons,
        }));
      await persistCustomerRecommendation({
        tenantId: user.tenantId,
        customerId: customer.id,
        profile: answers,
        scored,
      });

      const { upsertSkinProfile } = await import("@/modules/customers/customer-preference.service");
      await upsertSkinProfile(user.tenantId, customer.id, {
        skinType: answers.skinType,
        concerns: answers.concern ? [answers.concern] : [],
        goals: answers.goals ? [answers.goals] : [],
        budgetPreference: answers.budget,
        fragrancePreference: answers.preferences,
        routineComplexity: answers.currentRoutine,
      });
    }
  }

  return result;
}
