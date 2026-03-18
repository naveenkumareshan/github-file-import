

## Plan: Make Partner With Us Page Visually Stunning

Transform the current text-heavy, plain page into a vibrant, colorful landing page using the existing brand colors (brand-blue, brand-green, brand-teal, brand-navy) and gradient utilities already in tailwind config.

### Changes to `src/pages/partner/PartnerWithUs.tsx`

**1. Hero Section -- Bold gradient background with floating decorative shapes**
- Replace subtle `from-primary/5` gradient with a full `bg-gradient-hero` (navy-to-teal) dark hero
- White text on dark gradient for high contrast
- Add decorative CSS circles/blobs with brand colors (absolute positioned, opacity-limited)
- Animated badge with a pulse/glow effect
- Larger CTA buttons with gradient backgrounds and hover effects

**2. Stats Section -- Colorful stat cards instead of plain text**
- Each stat gets its own colored card with distinct brand color backgrounds (blue, green, teal, orange)
- White text on colored cards, rounded-xl with shadow
- Add subtle icons behind the numbers for visual depth

**3. Why InhaleStays Section -- Gradient icon backgrounds + colored left borders**
- Each card gets a unique colored left border (blue, green, teal, purple)
- Icon containers with gradient backgrounds instead of flat `/10` tints
- Hover transform (scale + shadow) on cards

**4. Features Section -- Colorful tabbed filter + gradient feature cards**
- Property type filter buttons get their distinct colors (not just default/outline)
- Feature cards get colored top borders and gradient icon circles
- Common features section gets a colored grid with alternating light backgrounds

**5. How It Works -- Connected timeline with gradient step circles**
- Step circles with gradient backgrounds (brand gradient)
- Connecting line/dots between steps
- Each step card with a light colored background

**6. Demo Form -- Gradient header banner + colored form card**
- Form section gets a gradient top banner
- Card with colored shadow and border accent
- Submit button with brand gradient

**7. FAQ Section -- Colored accordion with brand accents**
- Accordion items with colored hover states and brand-colored triggers

**8. Footer CTA -- Full gradient background (already has primary bg, enhance it)**
- Use `bg-gradient-hero` instead of plain `bg-primary`
- Add decorative floating elements

### Key Technical Details
- All visual changes use existing Tailwind utilities and brand colors from `tailwind.config.ts`
- Use existing animations (`animate-fade-in`, `animate-float`) for decorative elements
- Add `hover:scale-105 transition-all duration-300` transforms on cards
- Add CSS gradient blobs via `before:/after:` pseudo-elements or absolute-positioned divs
- No new dependencies needed

### File to modify
- `src/pages/partner/PartnerWithUs.tsx` -- complete visual overhaul of all sections

