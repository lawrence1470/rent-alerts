# Alert Form Implementation Guide

Complete implementation of the alert creation/editing workflow for the NYC Rental Notifications application.

## Overview

This implementation provides a comprehensive, user-friendly workflow for creating and editing rental alerts with:
- Tag-based neighborhood autocomplete (100+ NYC neighborhoods)
- Real-time form validation with Zod
- Responsive design (mobile-first)
- Accessible UI components
- Type-safe forms with react-hook-form
- Toast notifications for feedback

## Architecture

### Route Structure

**Unified Route Pattern:**
- `/dashboard/alerts/new` → Create mode
- `/dashboard/alerts/[uuid]` → Edit mode

**Rationale:** Single route handler reduces code duplication and ensures consistent behavior between create and edit flows.

### File Structure

```
lib/
├── constants/
│   └── nyc-areas.ts              # NYC neighborhood data (150+ areas)
└── validations/
    └── alert.ts                  # Zod schemas and helpers

components/
└── alerts/
    ├── alert-form.tsx            # Main form component
    ├── area-autocomplete.tsx     # Custom neighborhood selector
    ├── price-range-inputs.tsx    # Price filter component
    ├── bedroom-bath-inputs.tsx   # Bed/bath selectors
    └── index.ts                  # Barrel export

app/
└── dashboard/
    └── alerts/
        └── [id]/
            └── page.tsx          # Route handler (create/edit)
```

## Key Components

### 1. NYC Areas Constants (`lib/constants/nyc-areas.ts`)

**Purpose:** Centralized neighborhood data for autocomplete and validation.

**Features:**
- 150+ NYC neighborhoods across all 5 boroughs
- Grouped by borough for better UX
- API-compatible values (lowercase, hyphenated)
- Helper functions for search, parsing, and formatting

**Example Usage:**
```typescript
import { searchNeighborhoods, formatAreasString } from "@/lib/constants/nyc-areas";

const results = searchNeighborhoods("williamsburg"); // Fuzzy search
const areas = formatAreasString(["williamsburg", "greenpoint"]); // "williamsburg,greenpoint"
```

### 2. Validation Schema (`lib/validations/alert.ts`)

**Purpose:** Type-safe form validation with comprehensive business rules.

**Validation Rules:**
- Required: `name`, `areas` (at least one neighborhood)
- Price range: `minPrice ≤ maxPrice`
- Bedroom range: `minBeds ≤ maxBeds`
- Notifications: At least one method must be enabled
- All numeric values must be positive integers

**Example:**
```typescript
import { alertFormSchema, type AlertFormValues } from "@/lib/validations/alert";

const result = alertFormSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

### 3. Area Autocomplete (`components/alerts/area-autocomplete.tsx`)

**Purpose:** Tag-based neighborhood selection with keyboard navigation.

**UX Features:**
- Real-time search with fuzzy matching
- Tag display for selected neighborhoods
- Click or keyboard (Enter) to select
- Backspace to remove last tag when input is empty
- Arrow keys for navigation
- Click outside to close suggestions
- Grouped results by borough

**Accessibility:**
- ARIA labels for screen readers
- Keyboard navigation support
- Error message association
- Focus management

**Example:**
```tsx
<AreaAutocomplete
  value={areas}
  onChange={(value) => setValue("areas", value)}
  error={errors.areas?.message}
  disabled={isSubmitting}
/>
```

### 4. Price Range Inputs (`components/alerts/price-range-inputs.tsx`)

**Purpose:** Dual input for price filtering with validation.

**Features:**
- Dollar sign prefix for clarity
- Null handling for "no minimum/maximum"
- Real-time validation feedback
- Responsive grid layout

### 5. Bedroom/Bath Inputs (`components/alerts/bedroom-bath-inputs.tsx`)

**Purpose:** Dropdown selectors for bedroom and bathroom counts.

**Options:**
- Bedrooms: Any, Studio, 1-5+ beds
- Bathrooms: Any, 1-3+ baths
- Null handling for "Any"

### 6. Alert Form (`components/alerts/alert-form.tsx`)

**Purpose:** Main form orchestration with react-hook-form.

**Sections:**
1. **Alert Details:** Name and neighborhoods
2. **Filters:** Price, bedrooms, bathrooms, boolean filters
3. **Notification Preferences:** SMS and email toggles

**Features:**
- Real-time validation
- Loading states during submission
- Toast notifications for success/error
- Cancel button with router.back()
- Automatic redirect to dashboard on success

**Form Flow:**
```
1. User fills form
2. Client-side validation (Zod)
3. Submit → POST/PATCH to API
4. Server-side validation
5. Database update
6. Batch rebuild (for cost optimization)
7. Success toast + redirect
```

### 7. Route Handler (`app/dashboard/alerts/[id]/page.tsx`)

**Purpose:** Server component that handles both create and edit modes.

**Mode Detection:**
```typescript
const isCreateMode = params.id === "new";
```

**Data Fetching (Edit Mode):**
- Direct database query (server component)
- User ownership verification
- 404 if alert not found or unauthorized

**Metadata Generation:**
- Dynamic title based on mode
- SEO-friendly descriptions

## API Integration

### Create Alert
```
POST /api/alerts
Body: AlertFormValues (validated payload)
Response: { success: true, alert: Alert }
```

### Update Alert
```
PATCH /api/alerts/[id]
Body: Partial<AlertFormValues>
Response: { success: true, alert: Alert }
```

### Get Alert
```
GET /api/alerts/[id]
Response: { alert: Alert }
```

## Navigation Integration

### Sidebar Updates

**Added:**
1. **Create Alert Button** (primary action, top of sidebar)
   - Prominent placement with Plus icon
   - Full-width button for visibility
   - Closes mobile sidebar after click

2. **My Alerts Navigation**
   - Renamed from "My Searches" for consistency
   - Links to `/dashboard/alerts` (alerts list view)

**Visual Hierarchy:**
```
┌─────────────────────┐
│ Logo                │
├─────────────────────┤
│ + Create Alert      │ ← Primary action
├─────────────────────┤
│ Dashboard           │
│ My Alerts           │ ← View all alerts
│ Notifications       │
│ Settings            │
└─────────────────────┘
```

## User Flows

### Creating an Alert

1. Click "Create Alert" in sidebar
2. Redirected to `/dashboard/alerts/new`
3. Fill out form:
   - Enter alert name (required)
   - Search and select neighborhoods (required)
   - Set optional filters (price, beds, baths)
   - Choose notification preferences
4. Click "Create Alert"
5. Form validation
6. API call to create alert
7. Success toast
8. Redirect to dashboard

### Editing an Alert

1. Navigate to alert from dashboard
2. Click edit button (to be implemented in alerts list)
3. Redirected to `/dashboard/alerts/[id]`
4. Form pre-populated with existing values
5. Make changes
6. Click "Update Alert"
7. API call to update alert
8. Success toast
9. Redirect to dashboard

### Validation Errors

**Client-side:**
- Real-time validation as user types
- Error messages below each field
- Submit button remains enabled (allows validation feedback)

**Server-side:**
- API returns 400 with error message
- Toast notification shows error
- User can correct and resubmit

## Responsive Design

### Breakpoints

- **Mobile (< 768px):**
  - Single column layout
  - Stacked form sections
  - Full-width buttons
  - Mobile sidebar overlay

- **Tablet (768px - 1024px):**
  - Two-column grid for price/bed/bath
  - Desktop sidebar visible
  - Increased padding

- **Desktop (> 1024px):**
  - Optimal spacing
  - Desktop sidebar
  - Maximum content width

### Mobile Optimizations

- Touch-friendly targets (min 44x44px)
- Autocomplete dropdown fits viewport
- Sticky form actions on scroll
- Collapsible filter sections

## Accessibility Features

### Keyboard Navigation

- Tab through all form fields
- Arrow keys for autocomplete navigation
- Enter to select neighborhood
- Backspace to remove last tag
- Escape to close autocomplete

### Screen Reader Support

- ARIA labels on all interactive elements
- Error message association with `aria-describedby`
- Invalid state with `aria-invalid`
- Focus management on autocomplete

### Visual Indicators

- Clear focus states (ring-2)
- Error states (red border + message)
- Loading states (spinner + disabled)
- Success feedback (toast notification)

## Performance Optimizations

### Client-Side

- Debounced autocomplete search (300ms)
- Memoized neighborhood filtering
- Controlled component updates only when needed
- Lazy loading of autocomplete results

### Server-Side

- Direct database queries (no API roundtrip)
- Server component for initial data
- Edge runtime compatible (Neon HTTP)
- Parallel batch rebuilding

## Type Safety

### Form Types

```typescript
// Inferred from Zod schema
type AlertFormValues = {
  name: string;
  areas: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minBeds?: number | null;
  maxBeds?: number | null;
  minBaths?: number | null;
  noFee: boolean;
  filterRentStabilized: boolean;
  enablePhoneNotifications: boolean;
  enableEmailNotifications: boolean;
  isActive: boolean;
};
```

### API Types

```typescript
// From lib/schema.ts
type Alert = typeof alerts.$inferSelect;
type NewAlert = typeof alerts.$inferInsert;
```

## Error Handling

### Client-Side Errors

```typescript
try {
  const response = await fetch(url, { method, body });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
} catch (error) {
  toast.error(error.message || "Failed to save alert");
}
```

### Server-Side Errors

- Validation errors → 400 with message
- Authentication errors → 401
- Not found → 404
- Server errors → 500 with generic message

## Testing Recommendations

### Unit Tests

- Validation schema edge cases
- Neighborhood search algorithm
- Form value transformations

### Integration Tests

- Form submission flow
- API error handling
- Navigation after success

### E2E Tests

- Complete create alert flow
- Complete edit alert flow
- Validation error scenarios
- Mobile navigation

## Future Enhancements

### Phase 1 (MVP Complete)
- ✅ Alert creation/editing
- ✅ Neighborhood autocomplete
- ✅ Form validation
- ✅ API integration

### Phase 2 (Planned)
- Alerts list page (`/dashboard/alerts`)
- Alert detail view
- Delete confirmation dialog
- Duplicate alert feature

### Phase 3 (Future)
- Saved search templates
- Alert analytics (match count, notification history)
- Bulk alert management
- Export/import alerts

## Known Limitations

1. **Neighborhood Data:** Currently static list, not synced with StreetEasy API
2. **Preview:** No preview of matching listings before creating alert
3. **Testing:** No automated tests yet
4. **Optimistic Updates:** Form doesn't use optimistic UI updates

## Troubleshooting

### "At least one neighborhood is required"
- User hasn't selected any neighborhoods
- Check that `areas` field has value

### "Minimum price cannot exceed maximum price"
- User entered minPrice > maxPrice
- Clear one field or adjust values

### Form not submitting
- Check browser console for errors
- Verify API route is accessible
- Check Clerk authentication status

### Autocomplete not showing results
- Verify search query is not empty
- Check that neighborhoods aren't already selected
- Verify NYC_NEIGHBORHOODS data is loaded

## Summary

This implementation provides a production-ready alert management workflow with:
- Excellent UX through tag-based autocomplete
- Strong validation at client and server levels
- Full type safety with TypeScript and Zod
- Responsive design for all devices
- Accessibility compliance
- Integration with existing dashboard architecture

All components follow Next.js 15+ App Router best practices and shadcn/ui design patterns.
