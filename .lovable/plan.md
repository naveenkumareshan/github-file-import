

# Reformat Manual Mess Booking to Vertical Student-Style Layout

## Problem
Current `ManualMessBooking.tsx` uses a horizontal stepper with separate Card-per-step and grid layouts. The user wants it to match the **student-side mess booking** (`MessDetail.tsx`) — a single vertical scrolling page where each step is an inline section with numbered circles, `<Separator>` dividers, pill-based selectors, and compact inline fields. No cards wrapping each step, no horizontal step indicator bar.

## Solution
Rewrite the JSX of `ManualMessBooking.tsx` to use the `MessDetail.tsx` layout pattern:

### Layout Pattern (from MessDetail.tsx)
- Single `max-w-3xl mx-auto` container
- Each step section: `<Separator>` → `px-3 pt-2` div → numbered circle (h-6 w-6 rounded-full bg-secondary) + Label → content
- **Step 1 (Student)**: Numbered circle + search input + collapsible create — shown inline, not in a Card
- **Step 2 (Mess)**: Pill-based selector buttons (`px-3 py-1.5 rounded-full text-xs font-semibold`) for each mess — appears after student selected
- **Step 3 (Package)**: Same pill buttons for packages — appears after mess selected
- **Step 4 (Dates)**: Inline `bg-muted/20 rounded-xl p-2.5 border` section with start date input + end date badge — appears after package selected
- **Step 5 (Payment)**: Inline section with payment fields in compact layout, discount/advance inputs, payment method pills, payment summary in `bg-muted/30 rounded-xl`
- **Step 6 (Review & Create)**: Summary in `bg-muted/30 rounded-xl border divide-y` with Create button — same as MessDetail's "Review & Pay" section

### Key Differences from Current
- Remove horizontal step indicator bar entirely
- Remove separate Card wrappers per step
- All steps visible vertically on one scrolling page (each appears when previous is completed)
- Use pill/chip selectors instead of card grids for mess and package selection
- Use `<Separator>` between sections instead of step navigation
- Back buttons removed — user can click any previous section to change selection
- Compact `text-xs` / `text-sm` sizing matching student UI

## File Modified
- `src/pages/admin/ManualMessBooking.tsx` — full JSX rewrite, logic unchanged

