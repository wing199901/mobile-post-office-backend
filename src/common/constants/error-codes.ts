// Error codes as per API specification
export const ERROR_CODES = {
  // Success
  SUCCESS: '0000',

  // Validation errors (01xx)
  MISSING_REQUIRED_FIELD: '0101',
  NO_UPDATABLE_FIELDS: '0102',
  INVALID_PARAMETER_FORMAT: '0103',
  INVALID_TIME_FORMAT: '0104',
  INVALID_LANG_VALUE: '0105',
  INVALID_NUMERIC_VALUE: '0106',

  // Not Found (02xx)
  RECORD_NOT_FOUND: '0201',

  // Conflict (03xx)
  DUPLICATE_RECORD: '0301',

  // Server Error (04xx)
  SERVER_ERROR: '0401',

  // Auth (05xx)
  UNAUTHORIZED: '0501',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
