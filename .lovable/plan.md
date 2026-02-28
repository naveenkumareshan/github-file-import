

## Enhance User Table, Edit Dialog, and View Dialog

### Problem
1. Course and College columns take up space in the table -- user wants them only in the View dialog
2. Edit dialog is missing many profile fields (alternate phone, city, state, pincode, DOB, course preparing for)
3. View dialog doesn't show all available profile data
4. Service layer doesn't map all profile fields (missing: alternate_phone, city, state, pincode, date_of_birth, course_preparing_for, serial_number)

### Changes

**1. Update `src/api/adminUsersService.ts`**
- Add missing fields to the mapped profile: `alternatePhone`, `city`, `state`, `pincode`, `dateOfBirth`, `coursePreparingFor`, `serialNumber`
- Add these fields to `UserUpdateData` interface
- Map them in `updateUser` method (camelCase to snake_case)

**2. Update `src/pages/AdminStudents.tsx`**
- **Remove** Course and College columns from the table (lines 317-320, 341-345)
- **Update Student interface** to include: `alternatePhone`, `city`, `state`, `pincode`, `dateOfBirth`, `coursePreparingFor`, `serialNumber`
- **Enhance View Details dialog** with organized sections:
  - **Personal**: Name, Email, Phone, Alternate Phone, Gender, DOB, Bio
  - **Address**: Address, City, State, Pincode
  - **Academic**: Course Studying, Course Preparing For, College
  - **Contact**: Parent Mobile, Serial Number
  - For Partners: Login Info + Linked Properties (existing)
  - Booking History (existing)
- Make Edit button available for all roles (not just students)

**3. Rewrite `src/components/admin/StudentEditDialog.tsx`**
- Add all missing fields in a compact grid layout:
  - Row 1: Name, Email
  - Row 2: Phone, Alternate Phone
  - Row 3: Gender, Date of Birth
  - Row 4: Course Studying, Course Preparing For
  - Row 5: College, Parent Mobile
  - Row 6: City, State
  - Row 7: Pincode, Serial Number
  - Full width: Address (input), Bio (textarea)
  - Active Status switch
- Use compact text-xs labels, h-8 inputs matching admin style
- Update interface to include all new fields

### Technical Details

**Profile fields available in DB but not yet mapped:**
| DB Column | JS Field | Type |
|-----------|----------|------|
| alternate_phone | alternatePhone | text |
| city | city | text |
| state | state | text |
| pincode | pincode | text |
| date_of_birth | dateOfBirth | date |
| course_preparing_for | coursePreparingFor | text |
| serial_number | serialNumber | text |

### Files to Edit
| File | Change |
|------|--------|
| `src/api/adminUsersService.ts` | Map all profile fields, update UserUpdateData |
| `src/pages/AdminStudents.tsx` | Remove Course/College columns, enhance View dialog, update interface |
| `src/components/admin/StudentEditDialog.tsx` | Add all profile fields with compact layout |

