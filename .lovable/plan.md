

## Plan: Add Copiable Partner Page Link to Enquiries Dashboard

Add a small section at the top of the Partner Enquiries page (`src/pages/admin/PartnerEnquiries.tsx`) showing the public partner page URL (`https://inhalestays.com/partner-with-us`) with a copy-to-clipboard button next to it.

### Implementation
- In the header area of `PartnerEnquiries.tsx`, add an inline element with the URL text and a copy icon button
- On click, copy the full URL to clipboard using `navigator.clipboard.writeText()` and show a toast confirmation
- Use the existing `getPublicAppUrl()` from `src/utils/appUrl.ts` to construct the URL

### File to modify
- `src/pages/admin/PartnerEnquiries.tsx` — add copiable link in the header section

