# SEO Quick Reference Guide

## Files Modified

### 1. `/app/layout.tsx`
- Enhanced title with NYC keywords
- Added comprehensive Open Graph tags
- Added Twitter Card metadata
- Configured robots and verification

### 2. `/app/page.tsx`
- Added page-specific metadata
- Implemented SoftwareApplication schema (JSON-LD)
- Implemented Service schema for local SEO
- Added structured data scripts

### 3. `/components/landing/hero.tsx`
- Added ARIA labels for accessibility
- Added video descriptions
- Marked decorative elements with aria-hidden

### 4. `/components/landing/showcase.tsx`
- Added section aria-labelledby
- Improved semantic structure

### 5. `/components/landing/live-feed.tsx`
- Changed to semantic `<header>` element
- Enhanced h2 with NYC keywords
- Added descriptive subtitle

### 6. `/components/landing/pricing.tsx`
- Semantic `<header>` element
- NYC-focused heading
- Enhanced description

---

## Required Actions Before Launch

### Critical (Do Before Deploy)

1. **Environment Variable**
   ```bash
   # .env.local
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Create Open Graph Image**
   - File: `/public/og-image.png`
   - Size: 1200x630px
   - Content: App dashboard or hero screenshot

3. **Create Screenshot**
   - File: `/public/screenshot.png`
   - Use: Schema.org structured data
   - Content: Main app features

### Important (Week 1)

4. **Add Sitemap** (Next.js automatic)
   ```typescript
   // app/sitemap.ts
   export default function sitemap() {
     return [
       { url: 'https://yourdomain.com', lastModified: new Date() },
       { url: 'https://yourdomain.com/dashboard', lastModified: new Date() },
     ]
   }
   ```

5. **Add robots.txt**
   ```txt
   # public/robots.txt
   User-agent: *
   Allow: /
   Sitemap: https://yourdomain.com/sitemap.xml
   ```

6. **Google Search Console**
   - Add verification code in layout.tsx
   - Submit sitemap
   - Monitor performance

### Optional (Month 1)

7. **Google Analytics**
   - Install GA4
   - Track conversions
   - Monitor traffic sources

8. **Schema Validation**
   - Test at: https://validator.schema.org/
   - Rich results: https://search.google.com/test/rich-results

---

## Key SEO Elements

### Primary Keywords
- NYC apartment alerts
- New York rental notifications
- Manhattan apartment search
- Brooklyn rental alerts
- Rent stabilized apartments NYC

### Target Locations
- Manhattan
- Brooklyn
- Queens
- New York City

### Unique Features
- Rent stabilization detection (differentiator)
- 5-minute alert frequency (premium)
- SMS + Email notifications
- StreetEasy integration

---

## Testing Checklist

- [ ] View page source - meta tags present
- [ ] Schema.org validator passes
- [ ] Mobile-friendly test passes
- [ ] PageSpeed Insights > 85
- [ ] Open Graph preview shows correctly
- [ ] Twitter card preview works
- [ ] Google Search Console indexed

---

## Monitoring

### Weekly
- Google Search Console impressions/clicks
- Keyword position tracking
- Analytics traffic review

### Monthly
- Content updates with fresh data
- Competitor analysis
- Add new FAQ items

### Quarterly
- Full SEO audit
- Update structured data
- Optimize underperforming pages

---

## Quick Wins

1. **Create content**: "How to Find Rent-Stabilized Apartments in NYC"
2. **Neighborhood pages**: Manhattan, Brooklyn, Queens landing pages
3. **Comparison content**: vs StreetEasy, vs Zillow guides
4. **Social proof**: Add testimonials to structured data
5. **Backlinks**: NYC rental blogs, apartment hunting forums

---

## Performance Targets

- Page load time: < 2 seconds
- Core Web Vitals: All green
- Mobile score: 90+
- Desktop score: 95+

---

## Common Issues

**Structured data not showing?**
- Wait 1-2 weeks for Google to crawl
- Test with schema validator
- Check robots.txt not blocking

**Rankings not improving?**
- Takes 4-12 weeks typically
- Need backlinks for competitive keywords
- Content freshness matters

**Mobile issues?**
- Test on real devices
- Use mobile-friendly test tool
- Check viewport meta tag

---

## Support Resources

- Google Search Console: https://search.google.com/search-console
- Schema Validator: https://validator.schema.org/
- Rich Results Test: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
