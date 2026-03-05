

# Compact Business Performance Page

## Problem
The page is too spread out with oversized cards, excessive spacing, and redundant sections. Needs to match the admin panel's high-density `text-[11px]` compact standard.

## Approach

Redesign **`src/pages/partner/BusinessPerformance.tsx`** into a compact, table-driven layout:

### 1. Replace all SummaryCard grids with a single compact stats table
Instead of 16+ large cards spread across 4 rows, consolidate into **two side-by-side compact tables**:

**Left table — Occupancy & Students:**
| Metric | Value | Growth |
|--------|-------|--------|
| Total Seats/Beds | 29 | |
| Occupied | 4 | |
| Available | 25 | |
| Occupancy % | 14 | +367% |
| New Admissions | 4 | |
| Renewals | 0 | |
| Dropouts | 0 | |

**Right table — Financials:**
| Metric | Value | Growth |
|--------|-------|--------|
| Seat Fees | ₹0 | |
| Bed Fees | ₹0 | |
| Locker Amount | ₹0 | |
| Security Deposit | ₹0 | |
| Food Collection | ₹0 | |
| Total Collections | ₹2,760 | -45% |
| Pending Dues | ₹5,000 | |
| Net Earnings | ₹0 | |

### 2. Remove duplicate sections
- **Remove** Section C (Dues & Refund mini-cards) — data already in the financials table
- **Remove** Section G (Settlement & Earnings) — merge into financials table  
- **Remove** Section H (Student Insights) — merge into occupancy table
- **Keep** Revenue Breakdown table and Payment Mode table as-is (already compact)
- **Keep** Charts but reduce height to 180px
- **Keep** Floor Performance table as-is
- **Keep** Insight cards but make them smaller

### 3. Compact styling
- Reduce `space-y-6` to `space-y-3`
- Header: `text-lg` instead of `text-2xl`
- Table cells: `text-[11px]`, `py-1.5` padding
- Chart heights: 180px instead of 250px
- Remove icons from the stat tables (pure data density)

### File to Change
| File | Change |
|------|--------|
| `src/pages/partner/BusinessPerformance.tsx` | Full redesign: replace card grids with 2 compact stat tables, remove duplicate sections, tighten spacing |

