

# Fix: Mandatory Food Should Not Add Extra Charges

## Problem
When food policy is **mandatory** (food included in rent), the system is currently:
1. Calculating `foodAmount` and adding it on top of the bed price in `totalPrice`
2. Showing a separate "Food Charges" line in the price breakdown
3. Displaying the food charges amount inside the Food Plan section

This means the user is being **double-charged** for food -- once in the bed price (which already includes food) and again as a separate `foodAmount`.

## Solution

Update `src/pages/HostelRoomDetails.tsx` with these changes:

### 1. Set foodAmount to 0 for mandatory policy (line ~421)
When food is mandatory, the bed price already includes food. So `foodAmount` should be 0:
```
Before: const foodAmount = foodOpted ? (calculation...) : 0;
After:  const foodAmount = (foodOpted && effectiveFoodPolicy !== 'mandatory') ? (calculation...) : 0;
```

### 2. Replace "Food Charges" in Food Plan section with just a badge (lines ~876-883)
When mandatory, instead of showing the calculated food charges amount, just show the "Food Included" badge (already done at lines 848-854). Remove the redundant food charges display inside the mandatory block.

### 3. Update Price Breakdown to show "Food Included" tag instead of charges (lines ~936-941)
For mandatory food, instead of showing a "Food Charges" line with an amount, show a small informational badge/note like "Food Included in Rent" with no extra amount.

### 4. Set food_amount to 0 in booking data for mandatory (line ~297)
Ensure the booking record also stores `food_amount: 0` when food is mandatory, since it's already in the rent.

## Files to modify
| File | Change |
|------|--------|
| `src/pages/HostelRoomDetails.tsx` | Skip food charge calculation for mandatory; show "Food Included" tag in price breakdown instead of a charge line; set food_amount=0 in booking data for mandatory |

## Result
- Mandatory food: Bed price stays as-is (food already included), "Food Included" badge shown, no extra charges
- Optional food: Works as before -- checkbox to add, separate charge line
- Not available: No food section shown

