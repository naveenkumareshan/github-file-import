import { supabase } from '@/integrations/supabase/client';

const DEFAULT_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
};

/**
 * Normalizes a raw payment method value before saving to DB.
 * Converts synthetic fallback values like `custom___default_cash__` to canonical `cash`.
 * Keeps real custom_<uuid> values intact.
 */
export const normalizePaymentMethod = (method: string): string => {
  if (!method) return 'cash';
  if (method.includes('__default_cash__')) return 'cash';
  // If it's a known default, keep it
  if (DEFAULT_LABELS[method]) return method;
  // custom_<uuid> stays as-is for real partner payment modes
  return method;
};

/**
 * Returns true if the method represents a cash payment.
 */
export const isCashMethod = (method: string): boolean => {
  if (!method) return true;
  if (method === 'cash') return true;
  if (method.includes('__default_cash__')) return true;
  return false;
};

/**
 * Resolves custom_<uuid> payment method values to human-readable labels
 * by querying the partner_payment_modes table.
 */
export const resolvePaymentMethodLabels = async (
  methods: string[]
): Promise<Record<string, string>> => {
  // Guard: if methods is not actually an array, return empty
  if (!Array.isArray(methods)) return {};
  const customIds = methods
    .filter((m) => m?.startsWith('custom_') && !m.includes('__default_cash__'))
    .map((m) => m.replace('custom_', ''));
  if (customIds.length === 0) return {};
  const { data } = await supabase
    .from('partner_payment_modes')
    .select('id, label')
    .in('id', customIds);
  const map: Record<string, string> = {};
  data?.forEach((m) => {
    map[`custom_${m.id}`] = m.label;
  });
  return map;
};

/**
 * Resolves all custom payment mode labels for a given partner user.
 * Use this when you don't have specific method values but need all labels for display.
 */
export const resolvePartnerPaymentLabels = async (
  partnerUserId: string
): Promise<Record<string, string>> => {
  if (!partnerUserId) return {};
  const { data } = await supabase
    .from('partner_payment_modes')
    .select('id, label')
    .eq('partner_user_id', partnerUserId)
    .eq('is_active', true);
  const map: Record<string, string> = {};
  data?.forEach((m) => {
    map[`custom_${m.id}`] = m.label;
  });
  return map;
};

/**
 * Returns a display label for a payment method, checking defaults first,
 * then the resolved custom labels map.
 */
export const getMethodLabel = (
  method: string,
  customLabels?: Record<string, string>
): string => {
  if (!method) return 'Cash';
  // Normalize first
  if (method.includes('__default_cash__')) return 'Cash';
  if (DEFAULT_LABELS[method]) return DEFAULT_LABELS[method];
  if (customLabels?.[method]) return customLabels[method];
  // If it's custom_ but not resolved, show a cleaned version
  if (method.startsWith('custom_')) return 'Other Payment';
  return method;
};
