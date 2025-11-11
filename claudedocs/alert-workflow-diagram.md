# Alert Workflow Visual Diagrams

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alert Form Workflow                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Route: /dashboard/alerts/[id]                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Server Component (page.tsx)                              │  │
│  │  • Handles route parameter                                │  │
│  │  • Detects mode: "new" vs UUID                            │  │
│  │  • Fetches alert data (edit mode)                         │  │
│  │  • Wraps in DashboardLayout                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Client Component (AlertForm)                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  react-hook-form + Zod validation                   │  │  │
│  │  │  • Manages form state                                │  │  │
│  │  │  • Real-time validation                              │  │  │
│  │  │  • API submission                                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  Child Components:                                          │  │
│  │  ┌──────────────────┐  ┌─────────────────┐                │  │
│  │  │ AreaAutocomplete │  │ PriceRangeInputs│                │  │
│  │  │ • Tag UI         │  │ • Min/Max       │                │  │
│  │  │ • Search         │  │ • Validation    │                │  │
│  │  │ • Keyboard nav   │  │ • $ prefix      │                │  │
│  │  └──────────────────┘  └─────────────────┘                │  │
│  │                                                             │  │
│  │  ┌──────────────────┐  ┌─────────────────┐                │  │
│  │  │ BedroomBathInputs│  │ Checkbox Groups │                │  │
│  │  │ • Dropdowns      │  │ • No Fee        │                │  │
│  │  │ • Min/Max        │  │ • Rent Stab     │                │  │
│  │  │ • Any option     │  │ • Notifications │                │  │
│  │  └──────────────────┘  └─────────────────┘                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Routes                                                │  │
│  │  • POST /api/alerts (create)                               │  │
│  │  • PATCH /api/alerts/[id] (update)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Create Alert Flow                           │
└─────────────────────────────────────────────────────────────────┘

User Action                Form State              Validation           API
    │                          │                        │                │
    │  1. Click Create         │                        │                │
    │─────────────────────────→│                        │                │
    │                          │                        │                │
    │  2. Type "Williamsburg"  │                        │                │
    │─────────────────────────→│  Search NYC areas      │                │
    │                          │  Show suggestions      │                │
    │                          │←──────────────────────│                │
    │  3. Click suggestion     │                        │                │
    │─────────────────────────→│  Add to areas array    │                │
    │                          │  areas = "williamsburg"│                │
    │                          │                        │                │
    │  4. Enter price range    │                        │                │
    │─────────────────────────→│  minPrice = 1500       │                │
    │                          │  maxPrice = 2500       │                │
    │                          │                        │  Validate      │
    │                          │                        │  min ≤ max     │
    │                          │                        │←──────────────│
    │                          │  Show validation ✓     │                │
    │                          │←──────────────────────│                │
    │                          │                        │                │
    │  5. Click Create         │                        │                │
    │─────────────────────────→│  Trigger validation    │                │
    │                          │───────────────────────→│                │
    │                          │                        │  Check all     │
    │                          │                        │  rules         │
    │                          │  Valid ✓               │                │
    │                          │←──────────────────────│                │
    │                          │  Submit to API         │                │
    │                          │────────────────────────────────────────→│
    │                          │                        │                │
    │                          │                        │  Insert DB     │
    │                          │                        │  Rebuild batch │
    │                          │  Success response      │                │
    │                          │←────────────────────────────────────────│
    │  Toast: "Alert created"  │                        │                │
    │←─────────────────────────│                        │                │
    │  Redirect to dashboard   │                        │                │
    │                          │                        │                │
```

## Neighborhood Selection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              AreaAutocomplete Interaction Flow                  │
└─────────────────────────────────────────────────────────────────┘

Initial State:
┌───────────────────────────────────────────────────────────┐
│ Search neighborhoods...                                   │
│                                                           │
└───────────────────────────────────────────────────────────┘

User types "will":
┌───────────────────────────────────────────────────────────┐
│ will|                                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ Williamsburg                      Brooklyn        │ │
│ │   East Williamsburg                 Brooklyn        │ │
│ └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘

After selecting Williamsburg:
┌───────────────────────────────────────────────────────────┐
│ [Williamsburg ×]                                          │
│ Add more neighborhoods...                                 │
│                                                           │
└───────────────────────────────────────────────────────────┘

Multiple selections:
┌───────────────────────────────────────────────────────────┐
│ [Williamsburg ×] [Greenpoint ×] [Bushwick ×]             │
│ Add more neighborhoods...                                 │
│                                                           │
└───────────────────────────────────────────────────────────┘

Keyboard Navigation:
┌───────────────────────────────────────────────────────────┐
│ soh|                                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │   SoHo                          Manhattan           │ │
│ │ → NoHo                          Manhattan    ← Focus│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Keys: ↑↓ Navigate  ⏎ Select  ⌫ Remove  Esc Close        │
└───────────────────────────────────────────────────────────┘
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Validation State Machine                      │
└─────────────────────────────────────────────────────────────────┘

Field: areas (neighborhoods)
   ┌──────────────┐
   │ Empty/Invalid│
   │   "areas": ""│
   └──────────────┘
          │
          │ User selects neighborhood
          ↓
   ┌──────────────┐
   │ Valid        │
   │   "areas":   │
   │ "williamsburg"│
   └──────────────┘

Field: Price Range
   ┌──────────────┐       ┌──────────────┐
   │ Invalid      │       │ Valid        │
   │ min: 2500    │──────→│ min: 1500    │
   │ max: 1500    │ Fix   │ max: 2500    │
   │ Error: ✗     │       │ Success: ✓   │
   └──────────────┘       └──────────────┘

Field: Notifications
   ┌──────────────┐       ┌──────────────┐
   │ Invalid      │       │ Valid        │
   │ SMS: false   │──────→│ SMS: false   │
   │ Email: false │ Enable│ Email: true  │
   │ Error: ✗     │       │ Success: ✓   │
   └──────────────┘       └──────────────┘

Form State:
┌─────────────────────────────────────────────────────────────┐
│ All Fields Valid? ─→ Yes ─→ Enable Submit                  │
│        │                                                    │
│        └─→ No ─→ Show Errors + Disable Submit              │
└─────────────────────────────────────────────────────────────┘
```

## Mobile vs Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Responsive Breakpoints                       │
└─────────────────────────────────────────────────────────────────┘

Mobile (< 768px):
┌──────────────────────────┐
│ ☰ Dashboard             │
├──────────────────────────┤
│ Create Alert            │
│                         │
│ Alert Details           │
│ ┌────────────────────┐  │
│ │ Name               │  │
│ └────────────────────┘  │
│ ┌────────────────────┐  │
│ │ Neighborhoods      │  │
│ └────────────────────┘  │
│                         │
│ Filters                 │
│ ┌────────────────────┐  │
│ │ Min Price          │  │
│ └────────────────────┘  │
│ ┌────────────────────┐  │
│ │ Max Price          │  │
│ └────────────────────┘  │
│                         │
│ ┌────────────────────┐  │
│ │ Create Alert       │  │
│ └────────────────────┘  │
└──────────────────────────┘

Tablet/Desktop (> 768px):
┌────────┬────────────────────────────────────────────┐
│ [Logo] │ Create Alert                              │
│        │                                            │
│ + New  │ Alert Details                             │
│        │ ┌──────────────────────────────────────┐  │
│ Home   │ │ Name                                 │  │
│ Alerts │ └──────────────────────────────────────┘  │
│ Notifs │ ┌──────────────────────────────────────┐  │
│ Settings│ Neighborhoods                         │  │
│        │ └──────────────────────────────────────┘  │
│        │                                            │
│        │ Filters                                    │
│        │ ┌────────────────┐ ┌─────────────────┐   │
│        │ │ Min Price      │ │ Max Price       │   │
│        │ └────────────────┘ └─────────────────┘   │
│        │                                            │
│        │ ┌────────┐ ┌────────┐ ┌──────────────┐   │
│        │ │Min Beds│ │Max Beds│ │ Min Baths    │   │
│        │ └────────┘ └────────┘ └──────────────┘   │
│        │                                            │
│        │              ┌────────────────────┐        │
│        │              │ Create Alert       │        │
│        │              └────────────────────┘        │
└────────┴────────────────────────────────────────────┘
```

## Error State Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Handling Flow                         │
└─────────────────────────────────────────────────────────────────┘

Client Validation Error:
┌───────────────────────────────────────────────────────────┐
│ Alert Name                                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│ ✗ Alert name is required                                  │
└───────────────────────────────────────────────────────────┘

API Error:
┌───────────────────────────────────────────────────────────┐
│ Toast Notification (top-right)                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✗ Failed to create alert                            │   │
│ │   Minimum price cannot exceed maximum price         │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘

Network Error:
┌───────────────────────────────────────────────────────────┐
│ Toast Notification (top-right)                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✗ Failed to save alert                              │   │
│ │   Please check your connection and try again        │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Navigation Paths                        │
└─────────────────────────────────────────────────────────────────┘

Dashboard View:
   /dashboard
      │
      ├─→ Click "Create Alert" button (sidebar)
      │   │
      │   └─→ /dashboard/alerts/new
      │       │
      │       ├─→ Fill form + Submit → Success
      │       │   │
      │       │   └─→ Redirect to /dashboard
      │       │
      │       └─→ Click Cancel
      │           │
      │           └─→ Back to /dashboard
      │
      ├─→ Click "My Alerts" (sidebar)
      │   │
      │   └─→ /dashboard/alerts (list view)
      │       │
      │       └─→ Click Edit on alert
      │           │
      │           └─→ /dashboard/alerts/[id]
      │               │
      │               ├─→ Edit + Submit → Success
      │               │   │
      │               │   └─→ Redirect to /dashboard
      │               │
      │               └─→ Click Cancel
      │                   │
      │                   └─→ Back to previous page
      │
      └─→ Direct URL: /dashboard/alerts/new
          │
          └─→ Create alert flow
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│              Form State Management (react-hook-form)            │
└─────────────────────────────────────────────────────────────────┘

Form State Object:
{
  // User inputs
  name: string
  areas: string                    // "williamsburg,greenpoint"
  minPrice: number | null
  maxPrice: number | null
  minBeds: number | null
  maxBeds: number | null
  minBaths: number | null

  // Boolean flags
  noFee: boolean
  filterRentStabilized: boolean
  enablePhoneNotifications: boolean
  enableEmailNotifications: boolean
  isActive: boolean
}

Validation Errors:
{
  name?: { message: "Alert name is required" }
  areas?: { message: "At least one neighborhood required" }
  maxPrice?: { message: "Min cannot exceed max" }
  enableEmailNotifications?: { message: "Select one method" }
}

UI State:
{
  isSubmitting: boolean             // Loading state
  mode: "create" | "edit"          // Form mode
  showAutocomplete: boolean         // Dropdown visibility
  focusedSuggestion: number        // Keyboard nav index
}
```

## Component Hierarchy

```
Page (Server Component)
└── DashboardLayout
    ├── Sidebar
    │   └── "Create Alert" Button
    └── Main Content
        └── AlertForm (Client Component)
            ├── Card: Alert Details
            │   ├── Input (name)
            │   └── AreaAutocomplete
            │       ├── Tags (selected areas)
            │       ├── Search Input
            │       └── Suggestions Dropdown
            ├── Card: Filters
            │   ├── PriceRangeInputs
            │   │   ├── Min Input ($)
            │   │   └── Max Input ($)
            │   ├── BedroomBathInputs
            │   │   ├── Min Beds Select
            │   │   ├── Max Beds Select
            │   │   └── Min Baths Select
            │   └── Checkbox Group
            │       ├── No Fee
            │       └── Rent Stabilized
            ├── Card: Notifications
            │   └── Checkbox Group
            │       ├── SMS
            │       └── Email
            └── Form Actions
                ├── Cancel Button
                └── Submit Button
```
