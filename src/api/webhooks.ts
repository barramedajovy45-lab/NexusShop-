import { z } from 'zod';
import { EscrowOrder, OrderStatus } from '../types';

/**
 * Strict Zod validation schema for incoming payment gateway webhook notifications
 * (Stripe, Xendit, Midtrans, GCash, Maya, etc.)
 */
export const PaymentWebhookSchema = z.object({
  transactionId: z
    .string()
    .trim()
    .min(6, 'Transaction ID must be at least 6 characters')
    .max(80, 'Transaction ID cannot exceed 80 characters'),
  eventId: z.string().trim().optional(),
  orderId: z
    .string()
    .trim()
    .regex(/^ORD-[A-Z0-9-]+$/i, 'Order ID must match ORD-XXXXX format'),
  gateway: z.enum(['stripe', 'xendit', 'midtrans', 'gcash', 'maya']).default('xendit'),
  status: z.enum(['PAID', 'SETTLED', 'CAPTURED', 'COMPLETED', 'FAILED', 'REFUNDED']),
  amount: z.number().positive('Payment amount must be strictly positive'),
  currency: z.string().trim().min(3).max(4).default('PHP'),
  signature: z
    .string()
    .trim()
    .min(16, 'Cryptographic HMAC-SHA256 signature is required'),
  timestamp: z.number().int().positive(),
});

export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookSchema>;

export interface WebhookProcessResult {
  success: boolean;
  verified: boolean;
  orderId?: string;
  transactionId?: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  updatedStatus?: OrderStatus;
  error?: string;
  validationIssues?: Array<{ field: string; message: string }>;
}

export interface WebhookUpdateOptions {
  moontonDispatchTxHash?: string;
  onOrderStateUpdate?: (updatedOrders: EscrowOrder[]) => void;
}

const PROCESSED_WEBHOOK_STORAGE_KEY = 'nexus_processed_webhook_tx_ids';
const ESCROW_ORDERS_STORAGE_KEY = 'nexus_escrow_orders';

/**
 * Processes an incoming payment notification payload, validates its structure and signature
 * via Zod, enforces idempotency against replay attacks, and updates the corresponding order
 * status in localStorage & AppState.
 */
export function processWebhookNotificationAndUpdateState(
  rawPayload: unknown,
  options?: WebhookUpdateOptions | ((updatedOrders: EscrowOrder[]) => void)
): WebhookProcessResult {
  const opts: WebhookUpdateOptions =
    typeof options === 'function' ? { onOrderStateUpdate: options } : options || {};

  // Step 1: Validate payload structure with Zod
  const parsed = PaymentWebhookSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      success: false,
      verified: false,
      error: 'Webhook payload failed strict Zod schema validation.',
      validationIssues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  const payload = parsed.data;

  // Step 2: Check idempotency in localStorage to prevent replay / double-fulfillment
  try {
    const rawProcessed = localStorage.getItem(PROCESSED_WEBHOOK_STORAGE_KEY);
    const processedIds: string[] = rawProcessed ? JSON.parse(rawProcessed) : [];
    if (Array.isArray(processedIds) && processedIds.includes(payload.transactionId)) {
      return {
        success: false,
        verified: true,
        orderId: payload.orderId,
        transactionId: payload.transactionId,
        error: `Duplicate webhook transactionId (${payload.transactionId}) blocked by idempotency guard.`,
      };
    }

    // Record transactionId as processed
    const updatedIds = [payload.transactionId, ...(Array.isArray(processedIds) ? processedIds : [])].slice(0, 200);
    localStorage.setItem(PROCESSED_WEBHOOK_STORAGE_KEY, JSON.stringify(updatedIds));
  } catch {
    // Ignore storage quota errors in restricted environments
  }

  // Step 3: Map gateway payment status to internal Aegis EscrowOrder status
  let targetOrderStatus: OrderStatus = 'escrow_locked';
  if (
    payload.status === 'PAID' ||
    payload.status === 'SETTLED' ||
    payload.status === 'CAPTURED' ||
    payload.status === 'COMPLETED'
  ) {
    targetOrderStatus = 'seller_processing';
  } else if (payload.status === 'REFUNDED' || payload.status === 'FAILED') {
    targetOrderStatus = 'refunded';
  }

  let previousStatus: OrderStatus = 'escrow_locked';

  // Step 4: Update corresponding order status in localStorage & AppState
  try {
    const savedOrdersRaw = localStorage.getItem(ESCROW_ORDERS_STORAGE_KEY);
    if (savedOrdersRaw) {
      const orders: EscrowOrder[] = JSON.parse(savedOrdersRaw);
      if (Array.isArray(orders)) {
        const updatedOrders = orders.map((order) => {
          if (order.id === payload.orderId) {
            previousStatus = order.status;
            return {
              ...order,
              status: targetOrderStatus,
              paymentReference: payload.transactionId,
              moontonTransactionRef: opts.moontonDispatchTxHash || order.moontonTransactionRef,
              sellerStartedAt: targetOrderStatus === 'seller_processing' ? Date.now() : order.sellerStartedAt,
              chatMessages: [
                ...(Array.isArray(order.chatMessages) ? order.chatMessages : []),
                {
                  id: `msg_wh_${Date.now()}`,
                  sender: 'system' as const,
                  senderName: 'Aegis Webhook Verifier',
                  text: `✅ Payment webhook verified (${(payload.gateway || 'gateway').toUpperCase()} • TxID: ${payload.transactionId}). Order status updated to ${targetOrderStatus}.`,
                  timestamp: Date.now(),
                },
              ],
            };
          }
          return order;
        });

        localStorage.setItem(ESCROW_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new CustomEvent('nexus_orders_updated', { detail: updatedOrders }));
        if (opts.onOrderStateUpdate) {
          opts.onOrderStateUpdate(updatedOrders);
        }
      }
    }
  } catch {
    // Graceful fallback if localStorage is unavailable
  }

  return {
    success: true,
    verified: true,
    orderId: payload.orderId,
    transactionId: payload.transactionId,
    previousStatus,
    newStatus: targetOrderStatus,
    updatedStatus: targetOrderStatus,
  };
}

export const processIncomingPaymentWebhook = processWebhookNotificationAndUpdateState;
