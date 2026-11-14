import {
  getAccountAddresses,
  getAccountPreferences,
  getAccountProfile,
  getAccountRecommendations,
  listAccountOrderSummaries,
} from "@/modules/account/account.service";
import type { AccountService } from "./account.service";

export const liveAccountService: AccountService = {
  getProfile: getAccountProfile,
  getAddresses: getAccountAddresses,
  getPreferences: getAccountPreferences,
  getRecommendations: getAccountRecommendations,
  listOrderSummaries: listAccountOrderSummaries,
};
