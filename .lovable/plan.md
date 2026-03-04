

# Enhanced Business Performance Dashboard + Partner Payment Modes

## Three Features Requested

### Feature 1: Date-wise filtering for Business Performance
**Current state**: Filters by single month + year dropdowns only.
**Needed**: Today, Yesterday, 7 days, This Month, Last Month, Custom date range.

**Changes**:
- **`src/hooks/usePartnerPerformance.ts`**: Replace `month`/`year` filters with `dateFilter` type (today, yesterday, 7days, this_month, last_month, custom) + optional `startDate`/`endDate`. Compute date ranges accordingly and use them for all receipt/booking queries.
- **`src/pages/partner/BusinessPerformance.tsx`**: Replace month/year `Select` dropdowns with the existing `DateFilterSelector` component (already used in DepositManagement). Add "Yesterday" and "7 Days" options.

### Feature 2: Payment mode-wise collection breakdown
**Current state**: Revenue breakdown shows Room Fees, Food, Deposits, Other — but not by payment method (Cash, UPI, Bank, Online).
**Needed**: Show how much was collected via each payment method.

**Changes**:
- **`src/hooks/usePartnerPerformance.ts`**: Add `payment_method` to the receipt `select()` queries. Aggregate totals by payment method (cash, upi, bank_transfer, online). Return new fields: `collectionsByMethod: { cash, upi, bank_transfer, online }` and previous month equivalents.
- **`src/pages/partner/BusinessPerformance.tsx`**: Add a new "Collections by Payment Mode" card/table showing Cash, UPI, Bank Transfer, Online totals with growth badges. Also show partner's custom bank account labels if configured.

### Feature 3: Partner-configurable payment modes (bank accounts)
**Current state**: Payment methods are hardcoded: Cash, UPI, Bank Transfer, Online.
**Needed**: Partners can add custom payment modes like "ICICI Bank 303", "HDFC" — these appear during offline receipt collection in both reading room and hostel flows.

**Changes**:
- **Database migration**: Create `partner_payment_modes` table:
  ```sql
  CREATE TABLE partner_payment_modes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_user_id uuid NOT NULL,
    label text NOT NULL,        -- e.g. "ICICI Bank 303"
    mode_type text NOT NULL DEFAULT 'bank_transfer',  -- cash, upi, bank_transfer, online
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ```
  With RLS: partners can manage own rows, admins can manage all.

- **New component `src/components/vendor/PaymentModesManager.tsx`**: Simple CRUD UI for partners to add/edit/delete their payment modes (accessible from partner profile or settings).

- **Update `CollectDrawer` in `CheckInFinancials.tsx`**: Fetch partner's custom payment modes. Replace hardcoded RadioGroup with dynamic list: default modes (Cash, UPI, Bank, Online) + partner's custom modes. Store the selected `payment_method` value (e.g., "icici_bank_303" or the custom label).

- **Update `src/pages/vendor/VendorSeats.tsx`** and **`src/pages/admin/HostelBedMap.tsx`**: Where offline receipts are created, also load partner payment modes and show them as options.

- **Business Performance dashboard**: Group collections by payment method label, including custom ones.

## Files Changed
1. **Migration SQL**: Create `partner_payment_modes` table + RLS + indexes
2. **`src/hooks/usePartnerPerformance.ts`**: Add date range filtering + payment method aggregation
3. **`src/pages/partner/BusinessPerformance.tsx`**: Date filter UI + payment mode breakdown section
4. **`src/components/vendor/PaymentModesManager.tsx`** (new): CRUD for partner payment modes
5. **`src/components/admin/operations/CheckInFinancials.tsx`**: Dynamic payment modes in CollectDrawer
6. **`src/pages/vendor/VendorSeats.tsx`**: Dynamic payment modes in receipt collection
7. **`src/pages/admin/HostelBedMap.tsx`**: Dynamic payment modes in receipt collection

