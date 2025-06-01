# QA Acceptance Checklist

Copy this checklist into your PR description and check off completed items.

## Code Quality ✅

- [ ] **ESLint** - No linting errors (`npm run lint`)
- [ ] **Prettier** - Code is properly formatted (`npm run format:check`)
- [ ] **TypeScript** - No type errors (`npm run build`)
- [ ] **Unit Tests** - All tests pass with >80% coverage (`npm run test:coverage`)
- [ ] **E2E Tests** - Smoke tests pass (`npm run test:e2e`)

## Functionality Testing 🧪

- [ ] **Manual Testing** - Feature works as expected in dev environment
- [ ] **Cross-browser** - Tested in Chrome, Firefox, Safari
- [ ] **Mobile Responsive** - Layouts work on mobile devices
- [ ] **Data Loading** - Charts and widgets load correctly
- [ ] **Filter Integration** - Global filters work with new components
- [ ] **Error Handling** - Graceful error states and loading indicators

## Performance & Accessibility ⚡

- [ ] **Performance** - No significant performance regressions
- [ ] **Accessibility** - Basic a11y requirements met (keyboard nav, screen readers)
- [ ] **Loading States** - Proper loading/skeleton states implemented
- [ ] **Bundle Size** - No significant bundle size increases

## Integration & Data 🔌

- [ ] **Supabase Integration** - Database queries work correctly
- [ ] **Real-time Data** - Live data updates function properly
- [ ] **Export Features** - Data export works as expected
- [ ] **State Management** - Zustand store updates correctly

## Deployment Readiness 🚀

- [ ] **Environment Variables** - All required env vars documented
- [ ] **Build Process** - Production build succeeds (`npm run build:prod`)
- [ ] **Preview Mode** - Preview deployment works (`npm run preview`)
- [ ] **Documentation** - Code changes are documented where needed

## Security & Data 🔒

- [ ] **Data Validation** - Input validation implemented
- [ ] **Error Boundaries** - Error boundaries handle failures gracefully
- [ ] **Sensitive Data** - No secrets/tokens committed to code
- [ ] **RLS Policies** - Supabase RLS policies updated if needed

---

### QA Notes

<!-- Add any specific testing notes, edge cases, or special instructions -->

### Screenshots

<!-- Add before/after screenshots for UI changes -->

### Testing Devices/Browsers

<!-- List specific devices/browsers tested -->

### Performance Metrics

<!-- Add any performance testing results -->

---

**QA Reviewer:** ******\_\_\_\_******  
**Date Reviewed:** ******\_\_******  
**Status:** ⬜ Approved ⬜ Needs Revision ⬜ Rejected
