Claude’s Plan
Manpower Forecast - Bug Fixes, Security Issues & Optimizations
Summary
Analysis of the manpower-forecast application revealed 17 issues across security, bugs, and code quality. This plan provides a phased approach prioritizing critical security vulnerabilities first.

Phase 1: Critical Security Fixes
1.1 Add Authentication to All Data Endpoints
Files:

backend/api/projects.py
backend/api/schedules.py
backend/api/crew_types.py
backend/api/forecasts.py
Issue: All project/schedule/forecast endpoints are publicly accessible without authentication. Anyone can view, create, modify, or delete company data.

Fix: Add get_current_active_user dependency to all endpoints:


from api.auth import get_current_active_user
# Add to each endpoint:
current_user: models.User = Depends(get_current_active_user)
1.2 Replace Weak Secret Key
File: backend/.env

Issue: Secret key is a1b2c3d4e5f6... - predictable pattern, not cryptographically secure.

Fix: Generate and use a random 32-byte hex key:


python -c "import secrets; print(secrets.token_hex(32))"
1.3 Restrict CORS Configuration
File: backend/main.py

Issue: allow_methods=["*"] and allow_headers=["*"] are overly permissive.

Fix: Restrict to specific methods/headers:


allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Authorization", "Content-Type"],
Phase 2: High Priority Bugs
2.1 Remove Duplicate Field Definitions
Files:

backend/models.py:19-20 - start_date defined twice
backend/schemas.py:37-38 - status defined twice
backend/schemas.py:41-42 - start_date defined twice
backend/schemas.py:57-58 - status defined twice
backend/schemas.py:61-62 - start_date defined twice
Fix: Remove the duplicate lines (20, 38, 42, 58, 62).

2.2 Fix API Base URL Mismatch
Files:

frontend/src/api.ts:22 - Uses http://localhost:8001 for dev
frontend/src/context/AuthContext.tsx:4 - Uses empty string '' for dev
Issue: Inconsistent API URLs cause CORS issues when AuthContext makes requests to proxy while api.ts bypasses it.

Fix: Create shared config and use consistent approach:


// src/config.ts
export const API_BASE_URL = import.meta.env.PROD ? '/manpower' : '';
2.3 Add Database Transaction Rollback
File: backend/crud.py

Issue: No rollback on errors - partial data may persist on failure.

Fix: Wrap all write operations:


try:
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
except Exception:
    db.rollback()
    raise
2.4 Fix NaN Bug on Number Parsing
File: frontend/src/pages/ProjectsList.tsx

Issue: parseFloat("") returns NaN when budgeted_hours is empty string.

Fix:


budgeted_hours: newProject.budgeted_hours?.trim()
  ? parseFloat(newProject.budgeted_hours)
  : undefined
2.5 Fix Double User Fetch Race Condition
File: frontend/src/context/AuthContext.tsx:87-96

Issue: Login function fetches user (lines 88-96), then useEffect also fetches when token changes (lines 31-63). Creates race condition.

Fix: Remove the redundant fetch in login function - the useEffect handles it.

Phase 3: Medium Priority Improvements
3.1 Add Role-Based Access Control
Files:

backend/models.py - Add role column to User
New file: backend/permissions.py - Role checking utilities
Roles: admin, editor, viewer

Admin: Full access
Editor: Create/update projects and schedules
Viewer: Read-only access
3.2 Implement Logging System
Files:

New file: backend/logger.py
Update all files using print() statements
Implementation: Use Python's logging module with configurable log levels.

3.3 Fix Floating-Point Precision
File: backend/services/manpower.py

Issue: Using float() for financial calculations causes precision errors.

Fix: Use Decimal throughout, convert to float only for JSON output.

3.4 Add Client-Side Form Validation
Files:

frontend/src/pages/ProjectsList.tsx
frontend/src/pages/ScheduleEditor.tsx
Add validation for:

Required fields
Date ranges (end >= start)
Numeric boundaries
Man-hours OR crew-size requirement
Phase 4: Code Quality
4.1 Add TypeScript Error Types
File: frontend/src/types.ts


export interface ApiError {
  status: number;
  detail: string;
}
4.2 Extract Constants
Files:

New: backend/constants.py
New: frontend/src/constants.ts
Constants to extract:

HOURS_PER_DAY = 8
WORKING_DAYS_PER_WEEK = 5
Project status values
Token expiration time
4.3 Split Large Components (Optional)
Files:

ProjectsList.tsx (546 lines) -> Extract ProjectForm, ProjectFilters, ProjectTable
ScheduleEditor.tsx (572 lines) -> Extract PhaseForm, PhasesTable
Verification Plan
Security Testing:

Attempt API access without token (should return 401)
Verify CORS blocks unauthorized origins
Bug Verification:

Create project with empty budgeted_hours (should not error)
Login and verify only one user fetch occurs (check network tab)
Create phase with end_date < start_date (should show validation error)
Functional Testing:

Create project -> add schedule -> add phases -> view forecast
Export CSV and verify data integrity
Test all CRUD operations
Files to Modify (Summary)
File	Changes
backend/api/projects.py	Add auth dependency to all endpoints
backend/api/schedules.py	Add auth dependency to all endpoints
backend/api/crew_types.py	Add auth dependency to all endpoints
backend/api/forecasts.py	Add auth dependency to all endpoints
backend/models.py	Remove duplicate line 20
backend/schemas.py	Remove duplicate lines 38, 42, 58, 62
backend/crud.py	Add try/except with rollback
backend/main.py	Restrict CORS methods/headers
backend/.env	Generate new secret key
frontend/src/api.ts	Use shared config for API URL
frontend/src/context/AuthContext.tsx	Remove duplicate fetch, use shared config
frontend/src/pages/ProjectsList.tsx	Fix parseFloat, add validation
Execution Order
Immediate: Security fixes (1.1, 1.2, 1.3) + Duplicate fields (2.1)
Next: API URL fix (2.2) + Transaction rollback (2.3)
Then: Frontend bugs (2.4, 2.5)
Later: Medium priority (3.1-3.4) and code quality (4.1-4.3)
Stayed in plan mode
Of course! The plan is available for your review at reflective-jingling-crescent.md.

Here's a quick overview of what I found:

Critical Security (Phase 1):

All API endpoints are publicly accessible without auth
Weak secret key in .env
CORS too permissive
High Priority Bugs (Phase 2):

Duplicate start_date field in models.py line 19-20
Duplicate status and start_date fields in schemas.py
API URL mismatch between api.ts and AuthContext.tsx
Missing database transaction rollback
NaN bug when budgeted_hours is empty string
Race condition with double user fetch on login
Medium Priority (Phase 3):

No role-based access control
No logging system
Floating-point precision in calculations
Missing form validation
Code Quality (Phase 4):

Missing TypeScript error types
Magic numbers/hardcoded strings
Large components could be split
Take your time to review the plan. Let me know if you have questions or want me to adjust priorities, add/remove items, or focus on specific areas.