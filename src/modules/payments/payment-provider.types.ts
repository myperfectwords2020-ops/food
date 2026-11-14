export type ProviderInitializeInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
};

export type ProviderInitializeResult = {
  authorizationUrl: string;
  accessCode?: string;
  reference: string;
};

export type ProviderVerifyResult = {
  status: "success" | "failed" | "pending" | "abandoned";
  amountMinor: number;
  currency: string;
  reference: string;
  providerTransactionId?: string;
  failureReason?: string;
};

export interface PaymentProvider {
  readonly name: string;
  initializeTransaction(input: ProviderInitializeInput): Promise<ProviderInitializeResult>;
  verifyTransaction(reference: string): Promise<ProviderVerifyResult>;
}
