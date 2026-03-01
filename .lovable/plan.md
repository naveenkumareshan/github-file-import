

## Fix gl-matrix Build Error

### Problem
The only build error is from `node_modules/gl-matrix/index.d.ts` -- a third-party library (dependency of `maplibre-gl`) using the `module` keyword instead of `namespace`, which TypeScript 5.x flags as TS1540. Despite `skipLibCheck: true` and `node_modules` in the `exclude` array, these errors persist because the `exclude` setting only affects file inclusion from the `include` glob -- it does not prevent TypeScript from type-checking imported modules.

### Note on "Old Pages"
After navigating to the live preview, both the **Hostels** listing and **Reading Rooms** listing pages are rendering the **new mobile-first UI** correctly. The hostel detail page shows the 5-step booking flow, and the reading room detail page shows the modern card-based layout. No "old pages" are visible. The build error may be preventing the latest code from deploying to production, which could explain why the user sees outdated content on the published URL.

### Fix
Override the gl-matrix type declarations by creating a custom type declaration file that silences the error.

**Create `src/gl-matrix.d.ts`:**
- Declare the `gl-matrix` module with `export {}` to override the problematic type definitions
- This tells TypeScript to accept any imports from gl-matrix without checking its bundled types

```typescript
declare module 'gl-matrix' {
  const glMatrix: any;
  export default glMatrix;
  export const mat2: any;
  export const mat2d: any;
  export const mat3: any;
  export const mat4: any;
  export const quat: any;
  export const quat2: any;
  export const vec2: any;
  export const vec3: any;
  export const vec4: any;
  export const glMatrix: any;
}
```

This approach overrides the problematic `.d.ts` file from node_modules with a simple ambient declaration that avoids the TS1540 error entirely. No other files need changes -- the hostel and reading room pages are already showing the correct new UI.

### Files
| File | Action |
|------|--------|
| `src/gl-matrix.d.ts` | Create -- override gl-matrix types |

