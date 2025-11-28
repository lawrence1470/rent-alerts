# HeroUI Migration Plan
## Complete shadcn/ui → HeroUI Migration Analysis

**Status:** Analysis Complete | **Effort:** 40-55 hours | **Risk:** 🟡 MODERATE

---

## Executive Summary

This document provides a comprehensive analysis and execution plan for migrating all components from shadcn/ui to HeroUI v3 (formerly NextUI). The migration is **technically viable** with all shadcn/ui components having HeroUI equivalents, but represents a **significant undertaking** affecting 70+ files and requiring API-level changes across the codebase.

### Key Findings

✅ **All components have equivalents** - No blockers identified
⚠️ **Breaking API changes** - onClick → onPress, different prop patterns
📦 **Bundle impact: Neutral** - Already using framer-motion, will remove Radix UI
🎨 **Feature upgrade** - Gain loading states, animations, unified theming
⏱️ **Time investment** - 40-55 development hours estimated

---

## 1. Component Mapping Matrix

### Direct Equivalents (Same Name/Similar API)

| shadcn/ui | HeroUI | Notes |
|-----------|--------|-------|
| Button | Button | Change: onClick → onPress, no asChild |
| Card | Card | Change: CardContent → CardBody |
| Input | Input | Enhanced: built-in clear, validation |
| Label | Label | Similar API |
| Checkbox | Checkbox | Similar API |
| Switch | Switch | Similar API |
| Select | Select | Enhanced in v3 |
| Popover | Popover | Similar API |
| Tooltip | Tooltip | Similar API |
| Accordion | Accordion | Similar API |
| Tabs | Tabs | Similar API |
| Form | Form | Similar API |
| Avatar | Avatar | ✅ Available |
| Slider | Slider | ✅ Available |
| Spinner | Spinner | ✅ Available |

### Name Changes

| shadcn/ui | HeroUI | Migration Notes |
|-----------|--------|-----------------|
| Badge | **Chip** | Rename component import |
| Dialog | **Modal** | Rename + ModalContent wrapper |
| Alert-dialog | **Alert Dialog** | New in v3! |
| Dropdown-menu | **Dropdown** | New in v3! |
| Sonner (Toast) | **Toast** | Built-in v2.7.0+ |

### Components Needing Adaptation

| shadcn/ui | HeroUI Solution | Strategy |
|-----------|-----------------|----------|
| Sheet | Modal with placement | Use Modal's placement props |
| Navigation-menu | ListBox + Dropdown | Combine components |
| Scroll-area | Built-in scrolling | Most HeroUI components handle scroll |
| Table | Table | ✅ Available with virtualization |

### Custom Animation Components (Preserve)

These are custom/magic-ui components - keep as-is:
- AnimatedList, AnimatedBeam, AnimatedModal
- HyperText, AnimatedShinyText
- NumberTicker, TypingAnimation
- OrbitingCircles, TextReveal
- BentoGrid, BackgroundOverlayCard
- StickyScrollReveal, VideoText
- ShinyButton, StatefulButton
- RentStabilizedBadge

---

## 2. Breaking API Changes

### Event Handlers: onClick → onPress

**Impact:** ~200+ instances across codebase

**Before (shadcn/ui):**
```tsx
<Button onClick={() => handleClick()}>
  Click Me
</Button>
```

**After (HeroUI):**
```tsx
<Button onPress={() => handleClick()}>
  Click Me
</Button>
```

**Migration Strategy:** Find and replace with manual verification per file

### Component Composition: asChild Pattern Lost

**Impact:** All Link-wrapped buttons

**Before (shadcn/ui):**
```tsx
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

**After (HeroUI):**
```tsx
<Button as={Link} href="/dashboard">
  Go to Dashboard
</Button>
```

**Migration Strategy:** Update Link pattern, test navigation thoroughly

### Card Structure Changes

**Before (shadcn/ui):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**After (HeroUI):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardBody>Content here</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Migration Strategy:** Find/replace CardContent → CardBody

### Provider Requirement

**Impact:** app/layout.tsx must wrap with HeroUIProvider

**Before (shadcn/ui):**
```tsx
// No provider needed
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>
}
```

**After (HeroUI):**
```tsx
import { HeroUIProvider } from "@heroui/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  )
}
```

---

## 3. Phased Migration Plan

### Phase 1: Setup & Infrastructure (2-3 hours)

**Goal:** Install HeroUI and configure environment

**Tasks:**
1. Install HeroUI packages
   ```bash
   npm install @heroui/react framer-motion
   # OR individual packages
   npm install @heroui/button @heroui/card @heroui/input ...
   ```

2. Add HeroUIProvider to app/layout.tsx
   ```tsx
   import { HeroUIProvider } from "@heroui/react"
   ```

3. Create hero.ts config for Tailwind
   ```typescript
   import { heroui } from "@heroui/react"
   export default heroui()
   ```

4. Update tailwind.config.ts to use HeroUI plugin

5. Test: Verify dev server runs, no build errors

**Validation:** `npm run dev` successful, no console errors

---

### Phase 2: Core Components (6-8 hours)

**Goal:** Migrate most-used components with high visibility

**Priority Order:**
1. **Button** (~40+ usages)
   - Update all onClick → onPress
   - Replace asChild with as={Link}
   - Test: All buttons clickable, navigation works
   - Files: hero.tsx, navbar.tsx, cta.tsx, alert-form.tsx

2. **Card** (~15+ usages)
   - Replace CardContent → CardBody
   - Test: All cards render correctly
   - Files: features.tsx, pricing.tsx, dashboard pages

3. **Badge → Chip** (~10+ usages)
   - Rename import and component
   - Test: Visual consistency
   - Files: alerts pages, subscription-badges.tsx

**Validation Checklist:**
- [ ] Landing page renders correctly
- [ ] All buttons respond to clicks
- [ ] Cards display properly
- [ ] Badges/Chips styled correctly
- [ ] No console errors

---

### Phase 3: Form Components (8-10 hours)

**Goal:** Migrate form inputs with react-hook-form integration

**Priority Order:**
1. **Input, Label** (~20+ usages)
   - Update Input imports
   - Test with react-hook-form
   - Files: All step-*.tsx files in alerts/

2. **Checkbox, Switch** (~8+ usages)
   - Update component imports
   - Verify controlled behavior
   - Files: step-two.tsx, step-three.tsx, step-four.tsx

3. **Select** (~5+ usages)
   - Update Select component
   - Test dropdown behavior
   - Files: step-one.tsx, step-three.tsx, bedroom-bath-inputs.tsx

**Validation Checklist:**
- [ ] Alert creation flow works end-to-end
- [ ] Form validation functions correctly
- [ ] All inputs accept user input
- [ ] Select dropdowns populate and select
- [ ] Checkboxes and switches toggle
- [ ] Form submission successful

**Critical:** This phase affects the core user flow - test extensively!

---

### Phase 4: Overlay Components (6-8 hours)

**Goal:** Migrate modals, dialogs, dropdowns

**Priority Order:**
1. **Dialog → Modal** (~5+ usages)
   - Rename to Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
   - Update open/close handlers
   - Files: alerts/page.tsx (delete dialog)

2. **Alert-dialog** (~2+ usages)
   - Update to HeroUI Alert Dialog
   - Test confirmation flows
   - Files: alerts/page.tsx

3. **Dropdown-menu** (~2+ usages)
   - Update to HeroUI Dropdown
   - Test menu interactions
   - Files: alerts/page.tsx, navbar.tsx

4. **Popover** (~3+ usages)
   - Update Popover component
   - Test positioning
   - Files: step-three.tsx, step-six.tsx

5. **Tooltip** (~1+ usage)
   - Update Tooltip component
   - Files: rent-stabilized-badge.tsx

**Validation Checklist:**
- [ ] Modals open and close properly
- [ ] Alert dialogs show confirmation
- [ ] Dropdown menus appear and select
- [ ] Popovers position correctly
- [ ] Tooltips display on hover

---

### Phase 5: Navigation & Feedback (4-6 hours)

**Goal:** Migrate remaining UI components

**Priority Order:**
1. **Accordion** (~2+ usages)
   - Update Accordion component
   - Files: faq.tsx, app/faq/page.tsx

2. **Tabs** (~1+ usage)
   - Update Tabs component
   - Files: TBD

3. **Navigation-menu** (~1+ usage)
   - Migrate to Dropdown or ListBox
   - Files: navbar.tsx

4. **Toast (replace Sonner)** (~1+ usage)
   - Replace Sonner with HeroUI Toast
   - Update toast.ts utility if exists
   - Files: app/layout.tsx

5. **Sheet** (~2+ usages)
   - Replace with Modal using placement
   - Files: navbar.tsx, mobile-nav.tsx

6. **Table** (if used)
   - Update Table component
   - Test sorting, pagination

**Validation Checklist:**
- [ ] FAQ accordion expands/collapses
- [ ] Navigation menu works on mobile
- [ ] Toasts appear and dismiss
- [ ] Mobile sheet/drawer opens
- [ ] Tables display and sort correctly

---

### Phase 6: Cleanup & Polish (3-4 hours)

**Goal:** Remove old dependencies and finalize

**Tasks:**
1. Remove shadcn/ui packages
   ```bash
   npm uninstall @radix-ui/react-accordion @radix-ui/react-alert-dialog \
     @radix-ui/react-checkbox @radix-ui/react-dialog \
     @radix-ui/react-dropdown-menu @radix-ui/react-label \
     @radix-ui/react-navigation-menu @radix-ui/react-popover \
     @radix-ui/react-scroll-area @radix-ui/react-select \
     @radix-ui/react-slot @radix-ui/react-switch \
     @radix-ui/react-tabs @radix-ui/react-tooltip \
     class-variance-authority sonner
   ```

2. Delete components/ui/ files (keep custom animations)
   - Remove: button.tsx, card.tsx, input.tsx, etc.
   - Keep: All animated-* components, custom components

3. Update import paths project-wide
   ```tsx
   // Before
   import { Button } from "@/components/ui/button"

   // After
   import { Button } from "@heroui/react"
   ```

4. Remove unused utilities (if any)
   - Check if cn() utility still needed
   - Remove buttonVariants if not used

5. Update CLAUDE.md documentation
   - Change Tech Stack section
   - Update component patterns
   - Update import alias examples

6. Visual regression testing
   - Compare screenshots: before vs after
   - Check dark mode consistency
   - Test responsive breakpoints

7. Performance testing
   - Measure bundle size change
   - Check lighthouse scores
   - Verify no performance regressions

**Final Validation Checklist:**
- [ ] All imports from @heroui
- [ ] No errors or warnings in console
- [ ] All pages render correctly
- [ ] Dark mode works properly
- [ ] Mobile responsive
- [ ] No unused dependencies in package.json
- [ ] Documentation updated

---

## 4. Risk Assessment & Mitigation

### HIGH RISK ⚠️

**Risk 1: Form Integration Breaking**
- **Impact:** Alert creation flow unusable (core feature)
- **Probability:** Medium (30%)
- **Mitigation:**
  - Extensive testing in Phase 3
  - Keep shadcn form components until HeroUI versions proven stable
  - Fallback plan: Revert Phase 3 if issues found
- **Detection:** Test all alert creation steps after migration

**Risk 2: Event Handler Misses (onClick → onPress)**
- **Impact:** Non-functional buttons, broken interactions
- **Probability:** Medium-High (40%)
- **Mitigation:**
  - Systematic find/replace with verification
  - Use TypeScript to catch mismatches
  - Test every interactive element
- **Detection:** Click testing on every page

**Risk 3: Link Navigation Breaking**
- **Impact:** Users can't navigate between pages
- **Probability:** Low-Medium (25%)
- **Mitigation:**
  - Test all internal links after Button migration
  - Verify Next.js Link compatibility
  - Manual testing of all navigation paths
- **Detection:** Navigation testing on all routes

### MEDIUM RISK 🟡

**Risk 4: Styling Regressions**
- **Impact:** Inconsistent UI, poor user experience
- **Probability:** High (60%)
- **Mitigation:**
  - Side-by-side visual comparison
  - Use HeroUI's classNames prop for customization
  - Maintain design system consistency
- **Detection:** Visual regression testing

**Risk 5: Dark Mode Inconsistencies**
- **Impact:** Broken dark mode experience
- **Probability:** Medium (35%)
- **Mitigation:**
  - Test both themes after each phase
  - Verify HeroUI dark mode config
  - Use next-themes integration
- **Detection:** Manual dark mode testing

**Risk 6: TypeScript Type Errors**
- **Impact:** Build failures, development friction
- **Probability:** Medium (40%)
- **Mitigation:**
  - Fix types incrementally per phase
  - Use type assertions where needed temporarily
  - Leverage HeroUI's TypeScript support
- **Detection:** `npm run build` after each phase

### LOW RISK ✅

**Risk 7: Performance Degradation**
- **Impact:** Slower page loads, poor UX
- **Probability:** Very Low (10%)
- **Mitigation:**
  - Framer-motion already installed (no bundle increase)
  - HeroUI well-optimized
  - Monitor lighthouse scores
- **Detection:** Performance testing in Phase 6

**Risk 8: Custom Animation Component Conflicts**
- **Impact:** Broken animations, visual glitches
- **Probability:** Low (20%)
- **Mitigation:**
  - Test all animation components after Phase 2
  - Adjust CSS if needed
  - Keep animation components separate
- **Detection:** Visual testing of landing page

---

## 5. Testing Strategy

### Per-Phase Testing

**Phase 2 (Core Components):**
- [ ] Click all buttons across landing/dashboard
- [ ] Verify cards render with correct spacing
- [ ] Check badges display correct colors/text

**Phase 3 (Forms):**
- [ ] Complete alert creation flow end-to-end
- [ ] Test form validation (required fields, formats)
- [ ] Try all input types (text, select, checkbox, switch)
- [ ] Submit form and verify data saved

**Phase 4 (Overlays):**
- [ ] Open/close all modals and dialogs
- [ ] Test confirmation dialog flows
- [ ] Click dropdown menus and select items
- [ ] Hover tooltips and verify content

**Phase 5 (Navigation):**
- [ ] Expand/collapse FAQ accordion
- [ ] Navigate through all menu items
- [ ] Test mobile navigation drawer
- [ ] Trigger toast notifications

### Cross-Cutting Testing

**After Each Phase:**
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No console errors in browser
- [ ] Dark mode still works

**Final Testing (Phase 6):**
- [ ] Full smoke test of entire application
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing
- [ ] Performance benchmarking
- [ ] Accessibility testing

---

## 6. Rollback Strategy

### Phase-Level Rollback

Each phase should be committed separately to enable easy rollback:

```bash
# After Phase 2 complete
git add .
git commit -m "Phase 2: Migrate core components (Button, Card, Badge)"

# If Phase 3 has issues
git revert HEAD~1  # Rollback to Phase 2
```

### Component-Level Rollback

Keep shadcn/ui components temporarily during migration:

```bash
# Rename instead of delete
mv components/ui components/ui-shadcn-backup

# If needed to rollback a specific component
cp components/ui-shadcn-backup/button.tsx components/ui/
```

### Full Rollback Plan

If migration needs to be abandoned:

1. Revert all commits since migration start
   ```bash
   git revert <migration-start-commit>..HEAD
   ```

2. Reinstall shadcn/ui dependencies
   ```bash
   npm install @radix-ui/react-* class-variance-authority sonner
   ```

3. Restore components/ui/ directory from backup

4. Remove HeroUI packages
   ```bash
   npm uninstall @heroui/react
   ```

---

## 7. Effort Estimation

### Detailed Breakdown

| Phase | Tasks | Hours | Complexity |
|-------|-------|-------|------------|
| **Phase 1** | Setup & Config | 2-3 | Low |
| **Phase 2** | Core Components | 6-8 | Medium |
| **Phase 3** | Form Components | 8-10 | High |
| **Phase 4** | Overlay Components | 6-8 | Medium |
| **Phase 5** | Navigation & Feedback | 4-6 | Medium |
| **Phase 6** | Cleanup & Polish | 3-4 | Low |
| **Testing** | Comprehensive Testing | 10-15 | Medium |
| **Fixes** | Bug Fixes & Adjustments | 5-10 | Variable |
| **TOTAL** | **Complete Migration** | **44-64** | **Medium-High** |

**Realistic Estimate: 40-55 hours** (excluding major blockers)

### Parallel Work Opportunities

Some phases can be partially parallelized:
- Custom animation testing during core component migration
- Documentation updates during cleanup phase
- Performance testing throughout migration

---

## 8. Decision Framework

### When to Proceed with Migration

✅ **Proceed if:**
- Want more feature-rich components (loading states, animations built-in)
- Prefer opinionated design system with unified theming
- Team values React Aria patterns for accessibility
- Looking to consolidate dependencies (remove Radix UI)
- Have 40-55 hours available for migration
- Can tolerate short-term risk for long-term consistency

❌ **Reconsider if:**
- Happy with current shadcn/ui setup and it meets all needs
- Prefer lightweight dependencies and minimal bundle size
- Want full control over component source code
- Team strongly prefers standard React patterns (onClick, asChild)
- Limited development time/resources available
- Project has tight deadlines or feature pressure

### Hybrid Approach Option

**Selective Migration:** Migrate only high-value components
- Keep: Form components (working well with react-hook-form)
- Migrate: Button, Card, Badge (visual consistency)
- Evaluate: Overlay components on case-by-case basis

**Pros:** Lower risk, faster timeline (15-20 hours)
**Cons:** Inconsistent design system, two UI libraries in dependencies

---

## 9. Recommended Next Steps

### Option A: Full Migration (Recommended for Long-term)

1. **Review this plan** with team/stakeholders
2. **Align on goals** - Why migrate? What's the business value?
3. **Allocate timeline** - 1-2 weeks of focused effort
4. **Start Phase 1** - Setup and basic testing
5. **Proceed incrementally** - Complete each phase fully before next
6. **Test extensively** - Don't rush, quality over speed

### Option B: Proof of Concept First

1. **Create separate branch** - `feature/heroui-poc`
2. **Migrate 3-5 components** - Button, Card, Input only
3. **Build test page** - Compare side-by-side with shadcn
4. **Evaluate experience** - Developer experience, visual quality, performance
5. **Make decision** - Proceed with full migration or stay with shadcn

### Option C: Stay with shadcn/ui

1. **Document decision** - Why shadcn/ui meets needs
2. **Optimize current setup** - Improve what you have
3. **Monitor HeroUI** - Revisit decision in 6-12 months
4. **Focus on features** - Invest time in business value, not migration

---

## 10. Code Examples

### Button Migration Example

**Before (shadcn/ui):**
```tsx
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        asChild
        className="min-w-[200px]"
      >
        <Link href="/dashboard">
          <Bell className="mr-2 h-4 w-4" />
          Create Your Alert Now
        </Link>
      </Button>

      <Button onClick={() => console.log('clicked')}>
        Click Me
      </Button>
    </div>
  )
}
```

**After (HeroUI):**
```tsx
import { Button } from "@heroui/react"
import Link from "next/link"
import { Bell } from "lucide-react"

export function Hero() {
  return (
    <div>
      <Button
        size="lg"
        variant="bordered"
        as={Link}
        href="/dashboard"
        className="min-w-[200px]"
        startContent={<Bell className="size-4" />}
      >
        Create Your Alert Now
      </Button>

      <Button onPress={() => console.log('pressed')}>
        Click Me
      </Button>
    </div>
  )
}
```

**Key Changes:**
- `variant="outline"` → `variant="bordered"`
- `asChild` → `as={Link}` with `href` prop
- `onClick` → `onPress`
- Icon as `startContent` prop (optional pattern)

---

### Card Migration Example

**Before (shadcn/ui):**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function Feature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instant Alerts</CardTitle>
        <CardDescription>Get notified immediately</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Never miss your perfect rental.</p>
      </CardContent>
    </Card>
  )
}
```

**After (HeroUI):**
```tsx
import { Card, CardHeader, CardBody } from "@heroui/react"

export function Feature() {
  return (
    <Card>
      <CardHeader>
        <h3>Instant Alerts</h3>
        <p className="text-small text-default-500">Get notified immediately</p>
      </CardHeader>
      <CardBody>
        <p>Never miss your perfect rental.</p>
      </CardBody>
    </Card>
  )
}
```

**Key Changes:**
- `CardContent` → `CardBody`
- `CardTitle`/`CardDescription` → plain elements with styling
- Use HeroUI's semantic color tokens (`text-default-500`)

---

### Form Input Migration Example

**Before (shadcn/ui + react-hook-form):**
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"

export function AlertForm() {
  const { register } = useForm()

  return (
    <div>
      <Label htmlFor="name">Alert Name</Label>
      <Input
        id="name"
        placeholder="Enter alert name"
        {...register("name")}
      />
    </div>
  )
}
```

**After (HeroUI + react-hook-form):**
```tsx
import { Input } from "@heroui/react"
import { useForm } from "react-hook-form"

export function AlertForm() {
  const { register } = useForm()

  return (
    <Input
      label="Alert Name"
      placeholder="Enter alert name"
      labelPlacement="outside"
      {...register("name")}
    />
  )
}
```

**Key Changes:**
- Combined Label into Input's `label` prop
- `labelPlacement="outside"` for external label styling
- Simplified structure (one component vs two)

---

## 11. Frequently Asked Questions

### Q: Will this break my existing features?
**A:** There's risk during migration, but with the phased approach and extensive testing, we can minimize disruption. The biggest risk is the form integration in Phase 3, which we'll test thoroughly before proceeding to other phases.

### Q: Can we migrate gradually or does it need to be all-at-once?
**A:** The phased plan allows gradual migration! Each phase is independent and can be tested/deployed separately. You could even stop after Phase 2 if needed (though not recommended).

### Q: What about bundle size impact?
**A:** Likely **neutral or smaller**. We're removing 15+ Radix UI packages and class-variance-authority, and framer-motion is already installed. HeroUI is built on Tailwind (no runtime styles), so bundle impact should be minimal.

### Q: Will this affect my existing custom components?
**A:** Custom animation components (AnimatedList, HyperText, etc.) will stay as-is. They may need minor CSS adjustments but fundamentally should work. We'll test them in Phase 2.

### Q: How much will this cost in development time?
**A:** **40-55 hours** of focused development work, plus testing time. Could be done in 1-2 weeks with dedicated effort, or spread over 3-4 weeks alongside other work.

### Q: What if we hit a blocker and can't continue?
**A:** Each phase is git-committed separately, allowing easy rollback. We also keep shadcn/ui code temporarily. If a critical blocker appears, we can revert to previous phase and reassess.

### Q: Does HeroUI have good documentation?
**A:** Yes! HeroUI (formerly NextUI) has comprehensive docs at heroui.com, active community, and is actively maintained. It's a mature library with good TypeScript support.

### Q: Will this improve or hurt performance?
**A:** Should be **neutral**. HeroUI is well-optimized and uses Tailwind (compile-time CSS). The biggest factor is framer-motion (already installed), so no new performance impact expected.

---

## 12. Conclusion

This migration is **technically viable** and **strategically sound** if you value:
- More feature-rich components out-of-the-box
- Unified, opinionated design system
- Better built-in accessibility (React Aria)
- Consolidation of dependencies

However, it's a **significant investment** (40-55 hours) that should align with clear business/technical goals. The phased approach minimizes risk and allows for gradual adoption.

**My Recommendation:**
1. Start with **Option B (Proof of Concept)** - Migrate 3-5 components to evaluate
2. Based on PoC results, decide: Full migration, Hybrid, or Stay with shadcn/ui
3. If proceeding, follow the phased plan strictly with extensive testing

**Next Action:** Review this plan and decide which option aligns with your project goals and timeline.

---

## Appendix A: File Impact Analysis

### Most Affected Files (Require Immediate Attention)

**Components:**
- `components/ui/button.tsx` - DELETE
- `components/ui/card.tsx` - DELETE
- `components/ui/input.tsx` - DELETE
- `components/landing/hero.tsx` - UPDATE (Button usage)
- `components/landing/navbar.tsx` - UPDATE (Button + Sheet)
- `components/alerts/alert-form.tsx` - UPDATE (All form components)
- `app/alerts/page.tsx` - UPDATE (Dialog, Alert-dialog, Dropdown)

**Pages:**
- `app/layout.tsx` - ADD HeroUIProvider
- `app/page.tsx` - TEST landing page
- `app/dashboard/page.tsx` - TEST dashboard
- `app/alerts/**` - UPDATE extensively

### Low-Risk Files (Minimal Changes)

- Custom animation components (keep as-is)
- API routes (no changes needed)
- Database/service layer (no changes needed)
- Utility functions (minimal impact)

---

## Appendix B: Dependency Changes

### Packages to Remove

```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "REMOVE",
    "@radix-ui/react-alert-dialog": "REMOVE",
    "@radix-ui/react-checkbox": "REMOVE",
    "@radix-ui/react-dialog": "REMOVE",
    "@radix-ui/react-dropdown-menu": "REMOVE",
    "@radix-ui/react-label": "REMOVE",
    "@radix-ui/react-navigation-menu": "REMOVE",
    "@radix-ui/react-popover": "REMOVE",
    "@radix-ui/react-scroll-area": "REMOVE",
    "@radix-ui/react-select": "REMOVE",
    "@radix-ui/react-slot": "REMOVE",
    "@radix-ui/react-switch": "REMOVE",
    "@radix-ui/react-tabs": "REMOVE",
    "@radix-ui/react-tooltip": "REMOVE",
    "class-variance-authority": "REMOVE",
    "sonner": "REMOVE"
  }
}
```

### Packages to Add

```json
{
  "dependencies": {
    "@heroui/react": "ADD - main library",
    "framer-motion": "ALREADY INSTALLED ✅"
  }
}
```

### Net Dependency Change

- **Remove:** 16 packages (Radix UI ecosystem)
- **Add:** 1 package (@heroui/react)
- **Net:** -15 packages

---

*Document prepared by Claude Code - Last updated: 2025-01-21*
