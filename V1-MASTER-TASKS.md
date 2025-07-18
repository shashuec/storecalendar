# StoreCalendar V1: Master Task List

## Current System Analysis ✅

### What's Already Built:
- ✅ **Complete Shopify Integration**: URL validation, product scraping, caching
- ✅ **OpenAI Caption Generation**: 7 caption styles, error handling, fallbacks  
- ✅ **Database Schema**: Supabase with stores, products, captions, emails tables
- ✅ **Rate Limiting**: IP-based and global limits
- ✅ **Full Frontend**: Single-page app with form, results, CSV export
- ✅ **Email Collection**: Progressive system (3 preview → email → all 7)
- ✅ **Error Handling**: Comprehensive validation and user feedback

### Current User Flow:
```
Enter Shopify URL → Show 3 preview captions → Email → Show all 7 captions
```

---

## V1 Vision: Transform Into Holiday-Aware Weekly Calendar

### Target User Flow:
```
1. Enter Shopify URL → Products loaded (up to 50)
2. Select Country → Holiday detection (US/UK/India) 
3. Choose Products → Select 3-10 from auto-selected 5
4. Pick Brand Tone → Professional/Casual/Playful/Luxury
5. Generate Week 1 → 7-day calendar with holiday-aware posts
6. View Calendar → Day-by-day layout with post types
7. Export Week 1 → CSV with calendar structure
8. Generate Week 2 → Different angles, lifestyle focus
```

---

# MASTER TASK LIST: 45 Core Tasks

## Phase 1: Backend Foundation (12 tasks)

### Holiday System
| Task | Type | Status |
|------|------|--------|
| T1.1: Create `src/lib/holidays.ts` with 2025 holiday data (101 holidays) | backend | **completed** |
| T1.2: Add holiday interfaces to `src/types/index.ts` | backend | **completed** |
| T1.3: Create `getHolidaysInRange()` function for next 7 days | backend | **completed** |
| T1.4: Add country detection/selection logic | backend | **completed** |
| T1.5: Create holiday relevance scoring for different post types | backend | **completed** |

### Enhanced Product System
| Task | Type | Status |
|------|------|--------|
| T2.1: Modify Shopify scraper to fetch up to 50 products | backend | **completed** |
| T2.2: Add product ranking/sorting logic (bestsellers first) | backend | **completed** |
| T2.3: Update database schema for additional product metadata | backend | pending |
| T2.4: Create product filtering utilities | backend | **completed** |

### Brand Voice System
| Task | Type | Status |
|------|------|--------|
| T3.1: Create 4 brand tone definitions with descriptions | backend | **completed** |
| T3.2: Create tone-specific prompt variations | backend | **completed** |
| T3.3: Update OpenAI prompts to include brand tone parameter | backend | **completed** |

## Phase 2: UI Components (15 tasks)

### Country Selection
| Task | Type | Status |
|------|------|--------|
| T4.1: Create `CountrySelector.tsx` component (US/UK/India with flags) | frontend | **completed** |
| T4.2: Add country selection to main form | frontend | pending |
| T4.3: Update form state management for country | frontend | pending |

### Product Selection
| Task | Type | Status |
|------|------|--------|
| T5.1: Create `ProductSelector.tsx` component | frontend | **completed** |
| T5.2: Add auto-selection logic (select top 5 products) | frontend | **completed** |
| T5.3: Build product list with checkboxes (simple, no images) | frontend | **completed** |
| T5.4: Add search functionality for large product lists | frontend | **completed** |
| T5.5: Implement min 3, max 10 product validation | frontend | **completed** |
| T5.6: Add "Select All"/"Clear All" buttons | frontend | **completed** |

### Brand Tone Selection
| Task | Type | Status |
|------|------|--------|
| T6.1: Create `BrandToneSelector.tsx` component | frontend | **completed** |
| T6.2: Add 4 tone options with examples (Professional/Casual/Playful/Luxury) | frontend | **completed** |
| T6.3: Add tone selection to main form | frontend | pending |

### Weekly Calendar Display
| Task | Type | Status |
|------|------|--------|
| T7.1: Create `WeeklyCalendar.tsx` component | frontend | **completed** |
| T7.2: Build day-by-day layout with day labels (Mon-Sun) | frontend | **completed** |
| T7.3: Create individual day post cards with post type indicators | frontend | **completed** |

## Phase 3: Backend Integration (12 tasks)

### API Updates
| Task | Type | Status |
|------|------|--------|
| T8.1: Update `/api/generate` to accept country parameter | backend | **completed** |
| T8.2: Update API to accept selectedProducts parameter | backend | **completed** |
| T8.3: Update API to accept brandTone parameter | backend | **completed** |
| T8.4: Add validation for new parameters | backend | **completed** |

### Generation Logic Updates
| Task | Type | Status |
|------|------|--------|
| T9.1: Modify caption generation for selected products only | backend | **completed** |
| T9.2: Integrate holidays into OpenAI prompts (smart weaving) | backend | **completed** |
| T9.3: Create day-based calendar structure in generation | backend | **completed** |
| T9.4: Add variety enforcement across 7 days | backend | **completed** |
| T9.5: Update response format for calendar structure | backend | **completed** |

### Week Progression System
| Task | Type | Status |
|------|------|--------|
| T10.1: Create Week 1 vs Week 2 theme differentiation logic | backend | **completed** |
| T10.2: Add week tracking in user session | frontend | pending |
| T10.3: Create "Generate Week 2" flow with lifestyle focus | fullstack | pending |

## Phase 4: Integration & Polish (6 tasks)

### Export & Testing
| Task | Type | Status |
|------|------|--------|
| T11.1: Update CSV export to include calendar structure | backend | **completed** |
| T11.2: Add posting schedule recommendations to export | backend | **completed** |
| T11.3: End-to-end testing of complete V1 flow | testing | **completed** |
| T11.4: Test holiday integration with different dates/countries | testing | **completed** |

### Final Polish
| Task | Type | Status |
|------|------|--------|
| T12.1: Performance optimization for new features | fullstack | **completed** |
| T12.2: Final UI/UX polish and error handling | frontend | **completed** |

---

## Implementation Schedule

### Week 1 (Days 1-4): Foundation & Core UI
- **Days 1-2**: Phase 1 - Backend Foundation (T1.1 - T3.3)
- **Days 3-4**: Phase 2 - UI Components (T4.1 - T7.3)

### Week 2 (Days 5-6): Integration
- **Day 5**: Phase 3 - Backend Integration (T8.1 - T10.3)
- **Day 6**: Phase 4 - Polish & Testing (T11.1 - T12.2)

### Day 7: Launch Preparation
- Final testing and deployment

---

## Key System Changes

### 1. Form Enhancement (Multi-step)
```
BEFORE: Single URL input
AFTER: URL → Country → Products → Tone → Generate
```

### 2. Generation Logic (Major Update)
```
BEFORE: 7 caption styles for first 3 products
AFTER: 7-day calendar for selected products with holidays & tone
```

### 3. Display Format (Complete Redesign)
```
BEFORE: List of 7 captions with style labels
AFTER: Calendar grid with day labels and post cards
```

### 4. User Retention (New Feature)
```
BEFORE: One-time generation
AFTER: Week 1 → Week 2 progression
```

## Success Criteria

- ✅ Generate holiday-aware 7-day calendar in <90 seconds
- ✅ User control over products (3-10 selection from 50 fetched)
- ✅ Brand voice consistency (4 tone options)
- ✅ Calendar format with day labels and structure
- ✅ Week 1 → Week 2 progression working
- ✅ Support for US/UK/India holidays (101 total)
- ✅ CSV export with calendar structure

**Total: 45 focused tasks organized in 4 phases to transform current caption generator into holiday-aware weekly calendar system**