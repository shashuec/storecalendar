# StoreCalendar Implementation Plan: Enhanced Auth & Sharing

## Overview
This document outlines the implementation plan for enhancing StoreCalendar with localStorage-based authentication, state persistence across page refreshes, and public calendar sharing functionality.

## 1. Authentication System Changes

### Current State
- JWT tokens passed as URL parameters
- No persistence across page refreshes
- Auth state lost on reload

### Target State
- JWT tokens stored in localStorage
- Bearer Authorization headers for API calls
- Persistent auth state across refreshes
- Automatic session restoration

### Implementation Steps

#### 1.1 Update AuthContext
- Store JWT token in localStorage on login
- Read token from localStorage on app initialization
- Send token in Authorization: Bearer headers
- Clear localStorage on logout

#### 1.2 Update API Middleware
- Read Authorization header instead of URL parameters
- Validate Bearer token format
- Maintain existing JWT verification logic

#### 1.3 Update API Routes
- `/api/auth/me` - Read from Authorization header
- `/api/auth/logout` - Clear client-side localStorage
- `/api/generate` - Require Bearer token

## 2. State Persistence System

### Current State
- All form state lost on page refresh
- User has to restart flow from beginning
- No recovery of partial progress

### Target State
- Persistent state across page refreshes
- Resume from last completed step
- Preserve form data (URL, selections, preferences)

### Implementation Steps

#### 2.1 State Management
```typescript
interface PersistedState {
  currentStep: 'url' | 'auth' | 'products' | 'preferences' | 'results';
  url: string;
  selectedProducts: string[];
  selectedCountry: CountryCode;
  selectedTone: BrandTone;
  weekNumber: 1 | 2;
  result: GenerationResponse | null;
  lastUpdated: string;
}
```

#### 2.2 Storage Strategy
- Save state to localStorage after each step completion
- Restore state on component mount
- Clear expired state (older than 24 hours)
- Handle edge cases (corrupted storage, version changes)

#### 2.3 Recovery Logic
- Check for saved state on app load
- Validate saved state integrity
- Resume from appropriate step
- Handle authentication state sync

## 3. Public Calendar Sharing

### Current State
- Generated calendars are private to user
- No sharing mechanism
- Content tied to user session

### Target State
- Public shareable URLs for generated calendars
- View-only access without authentication
- SEO-friendly calendar pages

### Implementation Steps

#### 3.1 Database Schema Updates
```sql
-- Add sharing functionality to calendars
ALTER TABLE calendar_weekly_calendars 
ADD COLUMN share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN public_url TEXT,
ADD COLUMN shared_at TIMESTAMP WITH TIME ZONE;

-- Create index for public lookups
CREATE INDEX IF NOT EXISTS idx_calendar_share_token 
ON calendar_weekly_calendars(share_token) 
WHERE is_public = TRUE;
```

#### 3.2 API Routes
- `POST /api/calendar/share` - Make calendar public, return share URL
- `GET /api/calendar/public/[token]` - Fetch public calendar data
- `DELETE /api/calendar/unshare` - Revoke public access

#### 3.3 Public Calendar Page
- New route: `/calendar/[shareToken]`
- Server-side rendering for SEO
- Read-only calendar display
- No authentication required
- Social media meta tags

## 4. Detailed Implementation Files

### 4.1 Updated AuthContext
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Features:
// - localStorage token management
// - Bearer header preparation
// - Auto token refresh logic
// - Session expiry handling
```

### 4.2 State Persistence Hook
```typescript
// src/hooks/usePersistedState.ts
export function usePersistedState() {
  // Save/restore app state
  // Handle state validation
  // Manage state expiry
  // Sync with auth state
}
```

### 4.3 Share Management
```typescript
// src/lib/calendar-sharing.ts
export async function shareCalendar(calendarId: string): Promise<string>
export async function unshareCalendar(calendarId: string): Promise<void>
export async function getPublicCalendar(token: string): Promise<PublicCalendar>
```

### 4.4 Public Calendar Component
```typescript
// src/app/calendar/[shareToken]/page.tsx
// - Server-side data fetching
// - Public calendar display
// - Social sharing buttons
// - SEO optimization
```

## 5. File Structure Changes

```
src/
├── app/
│   ├── calendar/
│   │   └── [shareToken]/
│   │       ├── page.tsx          # Public calendar page
│   │       └── layout.tsx        # SEO layout
│   └── api/
│       └── calendar/
│           ├── share/
│           │   └── route.ts      # Share calendar API
│           └── public/
│               └── [token]/
│                   └── route.ts  # Public calendar API
├── components/
│   ├── ShareCalendarButton.tsx   # Share functionality
│   └── PublicCalendar.tsx        # Public calendar display
├── hooks/
│   └── usePersistedState.ts      # State persistence
└── lib/
    ├── auth-middleware.ts        # Updated for Bearer tokens
    ├── calendar-sharing.ts       # Share management
    └── storage.ts               # localStorage utilities
```

## 6. User Experience Flow

### 6.1 Normal Flow with Persistence
1. User enters URL → Saved to localStorage
2. User authenticates → Token saved to localStorage
3. User selects products → Selections saved
4. User sets preferences → Preferences saved
5. Calendar generated → Full state saved
6. **Page refresh at any point** → Resume from saved state

### 6.2 Sharing Flow
1. User generates calendar
2. User clicks "Share Calendar" button
3. System generates public URL
4. User copies/shares URL
5. Recipients view calendar without authentication

### 6.3 Public Calendar Access
1. Visitor accesses public URL
2. Calendar loads without authentication
3. Read-only display with branding
4. Option to "Create Your Own Calendar"

## 7. Security Considerations

### 7.1 Token Security
- Secure localStorage usage
- Token expiry handling
- XSS protection measures
- HTTPS enforcement

### 7.2 Public Calendar Security
- Rate limiting on public endpoints
- No sensitive user data in public calendars
- Share token entropy requirements
- Ability to revoke public access

## 8. Performance Optimizations

### 8.1 State Management
- Lazy loading of persisted state
- Debounced state saving
- Selective state persistence
- Memory usage optimization

### 8.2 Public Calendar Performance
- Server-side caching
- CDN-friendly assets
- Optimized meta tags
- Fast loading public pages

## 9. Migration Strategy

### 9.1 Phase 1: Auth System Update
- Update authentication to use localStorage
- Maintain backward compatibility
- Test auth flow thoroughly

### 9.2 Phase 2: State Persistence
- Implement state saving/restoration
- Add persistence to existing flows
- Handle edge cases and errors

### 9.3 Phase 3: Public Sharing
- Add database schema changes
- Implement sharing APIs
- Create public calendar pages
- Add sharing UI components

## 10. Testing Strategy

### 10.1 Authentication Testing
- Token persistence across refreshes
- Bearer header validation
- Session expiry scenarios
- Logout cleanup verification

### 10.2 State Persistence Testing
- Refresh at each step of flow
- Storage corruption handling
- State validation logic
- Cleanup of expired data

### 10.3 Sharing Functionality Testing
- Public URL generation
- Access without authentication
- Share token security
- SEO and social media previews

## 11. Success Metrics

### 11.1 User Experience
- Reduced abandonment rate after refresh
- Faster flow completion times
- Increased user satisfaction scores

### 11.2 Sharing Adoption
- Public calendar creation rate
- Share link click-through rates
- New user acquisition via shared links

This implementation plan provides a comprehensive roadmap for enhancing StoreCalendar with persistent authentication, state management, and public sharing capabilities.