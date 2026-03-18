

## Plan: Transform GuestHome into a Vibrant, Colorful Public Landing Page

### Overview
Complete redesign of the `GuestHome` component in `src/pages/Index.tsx` to be a stunning, colorful marketing page showcasing all 4 services (Reading Rooms, Hostels, Mess, Laundry) with app download buttons for iOS and Android.

### Changes to `src/pages/Index.tsx` (GuestHome section only)

**1. Hero Section -- Bold gradient with floating blobs + app download CTAs**
- Full `bg-gradient-to-br from-brand-navy via-primary to-brand-teal` dark hero with decorative animated blobs
- "India's First Student Ecosystem" badge
- Headline: "Your Complete Student Living App"
- Two prominent app download buttons (App Store + Google Play) styled as white pill buttons with store icons
- Stats row (500+ Students, 50+ Rooms, 24/7 Access) with glassmorphism cards

**2. Our Services Section -- Colorful 2x2 grid with unique gradients per service**
- Each service gets a vibrant gradient card:
  - Reading Rooms: blue gradient (`from-brand-blue to-brand-blue-light`)
  - Hostels: teal gradient (`from-brand-teal to-brand-teal-light`)
  - Mess: green gradient (`from-brand-green to-brand-green-light`)
  - Laundry: purple/orange gradient (`from-purple-500 to-pink-500`)
- White text, icons, and short descriptions on each card
- Cards link to respective pages, with hover scale effects

**3. Why InhaleStays -- Expanded colorful feature grid (not just carousel)**
- Replace single carousel with a vibrant vertical list of 5 features
- Each feature card has a colored left border and gradient icon container
- Features: Premium Spaces, Safe & Secure, Open 24/7, High-Speed WiFi, Amenities

**4. How It Works -- Connected timeline with gradient circles**
- 3 steps with gradient step numbers and connecting line
- Each step on a light colored background card

**5. Testimonials -- Colorful review cards**
- Keep horizontal scroll but add colored top borders to each card
- Larger avatars with brand gradient backgrounds

**6. Download App CTA Section -- New section before footer**
- Full-width gradient banner (brand-green to brand-teal)
- Phone mockup placeholder or app icon
- "Download the App" headline
- iOS + Android buttons side by side
- "Available on" badges

**7. Footer CTA -- Enhanced gradient with floating elements**
- `bg-gradient-to-br from-brand-navy to-primary` with decorative blobs
- "Ready to get started?" with Explore button

### Technical Details
- All styling uses existing brand colors from `tailwind.config.ts`
- App store buttons will use `<a>` tags with placeholder `#` hrefs (can be updated with real store links later)
- Use `Download` and `Smartphone` icons from lucide-react for store buttons
- Add `hover:scale-105 transition-all duration-300` on interactive cards
- No new dependencies needed

### File to modify
- `src/pages/Index.tsx` -- rewrite the `GuestHome` component

