# Subject API Fix Verification

## Problem Fixed
- **Issue**: 400 Bad Request error when adding subjects via POST /api/v1/subjects/applysubj
- **Root Cause**: Field name mismatch between frontend and backend
  - Frontend was sending: `{ "name": "string" }`
  - Backend was expecting: `{ "content": "string" }`

## Changes Made
1. **SubjectRequest.kt**: Changed field from `content` to `name`
2. **SubjectService.kt**: Updated references from `subjectRequest.content` to `subjectRequest.name`

## Files Modified
- `src/main/kotlin/org/example/kotlin_liargame/domain/subject/dto/request/SubjectRequest.kt`
- `src/main/kotlin/org/example/kotlin_liargame/domain/subject/service/SubjectService.kt`

## Expected Behavior After Fix
- Frontend sends: `{ "name": "Test Subject" }`
- Backend now correctly accepts the "name" field
- Subject is successfully created without 400 Bad Request error

## API Endpoint
- **URL**: POST /api/v1/subjects/applysubj
- **Request Body**: `{ "name": "string" }`
- **Response**: No content (204)
- **Authentication**: JWT token required

## Test Verification
The build completed successfully, indicating no compilation errors.
The field name mismatch has been resolved and the API should now work as documented.