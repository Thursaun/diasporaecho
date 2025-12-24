# DiasporaEcho - December 2024 Changelog

## 🎉 Major Features

### Multi-Category Support for Historical Figures
- Figures can now belong to multiple categories (e.g., Frederick Douglass → Literary Icons + Activists & Freedom Fighters + Political Leaders)
- 10 refined categories: Athletes, Musicians, Arts & Entertainment, Literary Icons, Inventors & Innovators, Scholars & Educators, Business & Entrepreneurs, Political Leaders, Pan-African Leaders, Activists & Freedom Fighters

### Wikipedia-Only Search Architecture  
- Search results now come exclusively from Wikipedia for accuracy
- No duplicate figures created in database
- Better metadata from Wikidata (birth/death years, occupations)
- Fred Hampton and other figures now searchable!

### Daily Featured Figures System
- Automatic rotation of featured figures based on likes
- Featured slider with optimized image loading

### Enhanced Figure Details
- Rich Wikidata metadata: occupation, birthplace, awards, education
- Living persons display "birthYear-Present"
- Dramatic hero banner on figure detail pages

---

## ⚡ Performance Optimizations

### Image Loading
- Thumbnail URLs (400px) instead of full-size images
- Lazy loading with blur-up effect
- Hero image preloading for instant display
- Compressed logo and favicon (90%+ size reduction)

### API & Caching
- Server-side caching with configurable TTL
- Request deduplication
- Response compression
- Wikipedia API timeout handling

### Build Optimization
- Vite code splitting (vendor chunks)
- Terser minification with console stripping
- Asset organization by type

---

## 🎨 UI/UX Improvements

### Navigation
- Modern navbar with scroll effects
- Mobile-responsive hamburger menu drawer
- Smooth transitions and animations

### Figure Cards
- Category scroll arrows (show/hide based on position)
- Last name A-Z sorting in all views
- Removed occupation badges for cleaner design
- Mobile-responsive grid layout

### Pages
- Light backgrounds for better text visibility
- Skeleton loading states
- Enhanced search with debouncing

---

## 🏗️ Infrastructure

### Deployment
- Frontend: GitHub Pages
- Backend: Migrated from Railway to Render
- Automated CI/CD with GitHub Actions

### Database
- Migration scripts for category updates
- Enhanced figure model with multi-category support
- Proper deduplication using wikipediaId

---

## 📊 Stats
- **50+ commits** in December
- **Performance**: Initial load time improved by ~60%
- **Bundle size**: Reduced by ~40% with code splitting
- **Image loading**: ~80% faster with thumbnails

---

## 🔗 Links
- Live Site: [diasporaecho.github.io](https://thursaun.github.io/diasporaecho)
- Repository: [github.com/Thursaun/diasporaecho](https://github.com/Thursaun/diasporaecho)
