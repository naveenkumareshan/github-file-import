

## Fix Console Warning in BookingRenewal

### Issues Found

**1. React ref warning on BookingRenewal component**
The console shows: "Function components cannot be given refs. Check the render method of BookingRenewal."

This happens because `BookingRenewal` is rendered inside a parent that may attempt to pass a ref to it (via Radix UI's internal composition). The fix is to wrap the component with `React.forwardRef` so it can properly accept and forward refs.

**2. gl-matrix TypeScript errors**
These are pre-existing errors from the `gl-matrix` dependency in `node_modules`. They are NOT caused by any recent changes and don't affect the app's functionality since `skipLibCheck: true` is already configured. These can be safely ignored.

### Plan

**File: `src/components/booking/BookingRenewal.tsx`**
- Convert the component from a plain function to use `React.forwardRef`
- Change the export from:
  `export const BookingRenewal = ({ booking, onRenewalComplete }: BookingRenewalProps) => {`
  to:
  `export const BookingRenewal = React.forwardRef<HTMLDivElement, BookingRenewalProps>(({ booking, onRenewalComplete }, ref) => {`
- Add `ref` to the outermost `<Dialog>` wrapper element
- Close with `});` and add a display name: `BookingRenewal.displayName = "BookingRenewal";`

This is a one-file, minimal change that eliminates the console warning.

