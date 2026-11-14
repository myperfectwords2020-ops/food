/** Refund boundary for a future phase — provider confirmation required before REFUNDED status. */
export class RefundService {
  async requestRefund(_input: {
    tenantId: string;
    paymentId: string;
    amountMinor?: number;
    reason?: string;
  }): Promise<never> {
    throw new Error("Refunds are not implemented yet.");
  }
}

export const refundService = new RefundService();
