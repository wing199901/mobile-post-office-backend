# Mobile Post Office API

A complete NestJS backend implementation for the Mobile Post Office application with full multilingual support (English, Traditional Chinese, Simplified Chinese).

## 📋 Features

- ✅ **RESTful API** with standard JSON envelope responses
- ✅ **Multilingual Support** - English (en), Traditional Chinese (tc), Simplified Chinese (sc)
- ✅ **Language Fallback** - Automatic fallback to English when requested language is unavailable
- ✅ **Advanced Search & Filtering** - Multi-criteria search across all languages
- ✅ **Pagination & Sorting** - Flexible pagination with configurable limits
- ✅ **Comprehensive Validation** - Input validation with detailed error codes
- ✅ **Data Import Script** - Bulk import with duplicate detection and irregularity reporting
- ✅ **MySQL Database** - Optimized schema with proper indexing
- ✅ **TypeORM Integration** - Type-safe database operations
- ✅ **Global Exception Handling** - Consistent error responses

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create database
mysql -u root -p -e "CREATE DATABASE mobile_post_office CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Run database schema
mysql -u root -p mobile_post_office < schema.sql

# 4. Import districts reference data (Hong Kong 18 Districts)
mysql -u root -p mobile_post_office < districts.sql

# 5. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 6. Start the server
npm run start:dev
```

The API will be available at **http://localhost:3000**

### Import Data

```bash
# Import from file
npm run import sample-data.json

# Import from URL
npm run import https://www.hongkongpost.hk/opendata/mobile-office.json
```

### Truncate Database

```bash
# Clear all records from database (with confirmation prompts)
npm run truncate
```

⚠️ **Warning**: This will delete ALL records from the database. The operation cannot be undone. The script will ask for confirmation before proceeding.

## 📡 API Endpoints

**Base URL:** `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mobileposts` | List & search mobile posts with filters |
| GET | `/api/mobileposts/:id` | Get single mobile post record |
| GET | `/api/mobileposts/districts/all` | Get all unique districts |
| POST | `/api/mobileposts` | Create new mobile post |
| PUT | `/api/mobileposts/:id` | Update mobile post (partial) |
| DELETE | `/api/mobileposts/:id` | Delete mobile post |

### Example Requests

```bash
# List all mobile posts (English)
curl "http://localhost:3000/api/mobileposts?lang=en&page=1&limit=10"

# Search in Traditional Chinese
curl "http://localhost:3000/api/mobileposts?search=元朗&lang=tc"

# Get all language fields
curl "http://localhost:3000/api/mobileposts/1?lang=all"

# Get all unique districts (English)
curl "http://localhost:3000/api/mobileposts/districts/all?lang=en"

# Get all districts with all languages
curl "http://localhost:3000/api/mobileposts/districts/all?lang=all"

# Filter by district and day
curl "http://localhost:3000/api/mobileposts?district=Yuen%20Long&dayOfWeek=1"

# Sort by day of week
curl "http://localhost:3000/api/mobileposts?sortBy=dayOfWeek&sortDir=asc&lang=en"

# Create new record
curl -X POST http://localhost:3000/api/mobileposts \
  -H "Content-Type: application/json" \
  -d '{
    "mobileCode": "2",
    "seq": 100,
    "nameEN": "Test Mobile Post",
    "nameTC": "測試流動郵局",
    "districtEN": "Central",
    "districtTC": "中環",
    "openHour": "10:00",
    "closeHour": "11:00",
    "dayOfWeekCode": 1
  }'
```

## 🌍 Language Support

### Supported Languages

- `en` - English (default)
- `tc` - Traditional Chinese (繁體中文)
- `sc` - Simplified Chinese (简体中文)
- `all` - All languages (returns both language-neutral and language-specific fields)

### Language Fallback

When requesting a specific language:
1. First tries the requested language field (e.g., `nameTC`)
2. Falls back to English if the requested language is empty
3. Returns empty string if both are unavailable

### Example Response (lang=all)

**Success Response:**
```json
{
  "header": {
    "success": true,
    "message": "record found"
  },
  "result": {
    "id": 123,
    "mobileCode": "1",
    "seq": 7,
    "name": "Mobile Post Offices 1",
    "nameEN": "Mobile Post Offices 1",
    "nameTC": "流動郵政局 1",
    "nameSC": "流动郵政局 1",
    "district": "Yuen Long",
    "districtEN": "Yuen Long",
    "districtTC": "元朗區",
    "districtSC": "元朗区",
    "openHour": "09:00",
    "closeHour": "09:30",
    "dayOfWeekCode": 1,
    "latitude": "22.36774",
    "longitude": "114.06233"
  }
}
```

**Error Response:**
```json
{
  "header": {
    "success": false,
    "err_code": "0201",
    "err_msg": "Record not found"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `search` | string | Free-text search (searches all languages automatically) | Any text |
| `district` | string | Filter by district (searches all languages automatically) | District name |
| `dayOfWeek` | int | Filter by day | 1-7 (Mon-Sun) |
| `openAt` | string | Filter by open time | HH:MM format |
| `mobileCode` | string | Filter by mobile code | - |
| `seq` | int | Filter by sequence | - |
| `page` | int | Page number | >= 1 (default: 1) |
| `limit` | int | Results per page | 1-200 (default: 20) |
| `sortBy` | string | Sort field | id, seq, district, openHour, closeHour, name, dayOfWeek |
| `sortDir` | string | Sort direction | asc, desc |
| `lang` | string | Response language | en, tc, sc, all (default: en) |

**Note**: The `search` and `district` parameters automatically search across all language fields (English, Traditional Chinese, and Simplified Chinese). You don't need to specify the search language - the server will find matches in any language.

### Get All Districts API

**Endpoint:** `GET /api/mobileposts/districts/all`

Returns all unique districts in the database.

**Query Parameters:**
| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `lang` | string | Response language | en, tc, sc, all (default: en) |

**Example Response (lang=en):**
```json
{
  "header": {
    "success": true,
    "message": "18 districts retrieved"
  },
  "result": [
    { "district": "Central & Western" },
    { "district": "Eastern" },
    { "district": "Islands" },
    { "district": "Kowloon City" },
    { "district": "Kwai Tsing" },
    { "district": "Kwun Tong" },
    { "district": "North" },
    { "district": "Sai Kung" },
    { "district": "Sha Tin" },
    { "district": "Sham Shui Po" },
    { "district": "Southern" },
    { "district": "Tai Po" },
    { "district": "Tsuen Wan" },
    { "district": "Tuen Mun" },
    { "district": "Wan Chai" },
    { "district": "Wong Tai Sin" },
    { "district": "Yau Tsim Mong" },
    { "district": "Yuen Long" }
  ]
}
```

**Example Response (lang=all):**
```json
{
  "header": {
    "success": true,
    "message": "18 districts retrieved"
  },
  "result": [
    {
      "district": "Central & Western",
      "districtEN": "Central & Western",
      "districtTC": "中西區",
      "districtSC": "中西区"
    },
    {
      "district": "Eastern",
      "districtEN": "Eastern",
      "districtTC": "東區",
      "districtSC": "东区"
    }
  ]
}
```

## ⚠️ Error Codes

All responses follow a standard envelope format:
- **Success**: Only includes `success: true` and `message`
- **Error**: Only includes `success: false`, `err_code`, and `err_msg`

### Error Code Hierarchy

| Code | Category | Description |
|------|----------|-------------|
| 0000 | Success | No error |
| 0101 | Validation | Missing required field(s) |
| 0102 | Validation | No updatable fields provided |
| 0103 | Validation | Invalid parameter format or limit exceeded |
| 0104 | Validation | Invalid time format (must be HH:MM with valid time 00:00-23:59) |
| 0105 | Validation | Invalid lang value |
| 0106 | Validation | Invalid numeric value or out of range |
| 0201 | Not Found | Record not found |
| 0301 | Conflict | Duplicate record |
| 0401 | Server | Database or internal server error |
| 0501 | Auth | Unauthorized |

### Response Examples

**Successful Operation:**
```json
{
  "header": {
    "success": true,
    "message": "Records retrieved successfully"
  },
  "meta": {
    "total": 72,
    "page": 1,
    "limit": 20,
    "totalPages": 4
  },
  "result": [ ... ]
}
```

**Validation Error:**
```json
{
  "header": {
    "success": false,
    "err_code": "0104",
    "err_msg": "openAt must be in HH:MM format with valid time (00:00-23:59)"
  }
}
```

**Not Found Error:**
```json
{
  "header": {
    "success": false,
    "err_code": "0201",
    "err_msg": "Record not found"
  }
}
```

## 🛠️ Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Linting
npm run lint

# Format code
npm run format
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (requires running database)
npm run test:e2e

# Test coverage
npm run test:cov
```

### E2E Test Suite

The E2E tests (`test/mobile-posts.e2e-spec.ts`) provide comprehensive coverage of all Mobile Post Office API endpoints:

**Test Coverage:**
- ✅ List & Filter (10 tests)
  - Pagination with different page sizes
  - Language variations (en, tc, sc, all)
  - District filtering
  - Day of week filtering
  - Full-text search
  - Sorting by different fields
  - Invalid parameter handling
  
- ✅ Create Record (5 tests)
  - Successful creation with all fields
  - Missing required fields validation
  - Invalid time format validation
  - Invalid coordinates validation
  - Invalid dayOfWeekCode validation
  
- ✅ Get Single Record (3 tests)
  - Fetch by ID in different languages
  - Non-existent ID error handling
  - All languages response (lang=all)

- ✅ Get All Districts (8 tests)
  - Get districts in English
  - Get districts in Traditional Chinese
  - Get districts in Simplified Chinese
  - Get all language fields (lang=all)
  - Default language behavior (no lang parameter)
  - Verify Hong Kong 18 districts count
  - Verify districts order and content
  - Invalid lang parameter error handling
  
- ✅ Update Record (4 tests)
  - Partial field updates
  - Empty update body validation
  - Non-existent ID error handling
  - Invalid time format in updates
  
- ✅ Delete Record (2 tests)
  - Successful deletion
  - Non-existent ID error handling
  
- ✅ Response Format (2 tests)
  - Success response structure validation
  - Error response structure validation
  
- ✅ Complex Scenarios (2 tests)
  - Multiple filters combined
  - Search with pagination and sorting

**Total: 36 comprehensive test cases**

### Running E2E Tests

**Prerequisites:**
1. Database must be running
2. Database must be created: `mobile_post_office`
3. Schema must be applied: `mysql -u root -p mobile_post_office < schema.sql`
4. Some test data recommended (but tests can run on empty database)

**Run tests:**
```bash
# Make sure database is running
# Then run E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- mobile-posts.e2e-spec
```

**Test Output Example:**
```
Mobile Posts API (e2e)
  GET /api/mobileposts - List & Filter
    ✓ should return paginated list of mobile posts (English) (125ms)
    ✓ should return list in Traditional Chinese (89ms)
    ✓ should return all language fields when lang=all (76ms)
    ✓ should filter by district (English) (82ms)
    ...
  POST /api/mobileposts - Create
    ✓ should create a new mobile post record (156ms)
    ...
    
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

### Postman Collection

Import `Mobile-Post-Office-API.postman_collection.json` into Postman to test all endpoints with pre-configured requests covering:
- All CRUD operations
- Language variations (en, tc, sc, all)
- Search and filtering
- Error cases
- Validation scenarios

## 📁 Project Structure

```
src/
├── common/                          # Shared utilities
│   ├── constants/error-codes.ts     # Error code definitions
│   ├── dto/api-response.dto.ts      # Standard response envelope
│   ├── exceptions/api.exception.ts  # Custom exception class
│   └── filters/api-exception.filter.ts # Global exception handler
├── database/
│   └── database.module.ts           # TypeORM configuration
├── mobile-posts/                    # Mobile posts module
│   ├── dto/                         # Data transfer objects
│   │   ├── create-mobile-post.dto.ts
│   │   ├── update-mobile-post.dto.ts
│   │   └── query-mobile-posts.dto.ts
│   ├── entities/mobile-post.entity.ts # Database entity
│   ├── types/                       # Type definitions
│   │   ├── mobile-post-data.type.ts      # Input data type
│   │   └── mobile-post-response.type.ts  # API response type
│   ├── mobile-posts.controller.ts   # API endpoints
│   ├── mobile-posts.service.ts      # Business logic
│   └── mobile-posts.module.ts       # Module configuration
├── app.module.ts                    # Root module
├── main.ts                          # Application entry point
├── import-data.ts                   # Data import script
└── truncate-data.ts                 # Database truncation script
```

## 📊 Database Schema

The application uses MySQL with the following schema:

```sql
CREATE TABLE mobile_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobileCode VARCHAR(20),
  seq INT,
  nameEN, nameTC, nameSC VARCHAR(255),
  districtEN, districtTC, districtSC VARCHAR(100),
  locationEN, locationTC, locationSC VARCHAR(255),
  addressEN, addressTC, addressSC TEXT,
  openHour CHAR(5),
  closeHour CHAR(5),
  dayOfWeekCode TINYINT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  imported_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

Includes indexes on: districts, dayOfWeek, seq, coordinates, and mobileCode.

##  Environment Variables

Create a `.env` file based on `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=mobile_post_office

PORT=3000
NODE_ENV=development
```

## ✅ Validation Rules

- **Time format**: HH:MM with valid time (00:00 to 23:59)
- **dayOfWeekCode**: 1-7 (Monday to Sunday)
- **latitude**: -90 to 90
- **longitude**: -180 to 180
- **page**: >= 1
- **limit**: 1-200
- **Required for POST**: At least one name field (nameEN|nameTC|nameSC) and one district field (districtEN|districtTC|districtSC)

### Validation Error Messages

When validation fails, you'll receive detailed error messages:

```json
// Invalid time value (e.g., 25:00)
{
  "header": {
    "success": false,
    "err_code": "0104",
    "err_msg": "openHour must be in HH:MM format with valid time (00:00-23:59)"
  }
}

// Invalid page number
{
  "header": {
    "success": false,
    "err_code": "0103",
    "err_msg": "Invalid parameter format or limit exceeded"
  }
}
```

## 🚨 Troubleshooting

### Cannot connect to database
```bash
# Check if MySQL is running
# macOS (if installed via DMG):
sudo launchctl list | grep mysql

# Linux:
sudo systemctl status mysql

# Verify credentials in .env file
```

### Port already in use
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Import fails
```bash
# Verify file format
cat sample-data.json | jq .

# Check import report for details
cat import-report.json
```

## 🎯 Key Features Implementation

- ✅ Standard JSON envelope for all responses
- ✅ Clean response format: success shows only `message`, errors show only `err_code` and `err_msg`
- ✅ Hierarchical error code system (0000, 01xx-05xx)
- ✅ Detailed validation error messages (e.g., "must be HH:MM with valid time 00:00-23:59")
- ✅ Multilingual support with automatic fallback
- ✅ `lang=all` returns both language-neutral and language-specific fields
- ✅ Advanced search across all languages
- ✅ Multi-criteria filtering
- ✅ Pagination with safe defaults
- ✅ Partial update semantics
- ✅ Data import with duplicate detection
- ✅ Coordinate validation and irregularity reporting
- ✅ SQL injection protection
- ✅ Type-safe operations with TypeScript
- ✅ Global exception handling

## 📄 License

UNLICENSED - Private project

## 🤝 Contributing

This is a private project for submission. For questions or issues, please contact the project maintainer.

---

**Built with:** NestJS 11, TypeORM, MySQL 8.0, TypeScript 5.7  
**API Version:** 1.0.0  
**Server:** http://localhost:3000  
**API Base:** /api/mobileposts
