import {
  ERROR_CODES,
  ERROR_MESSAGES,
  ErrorCode,
} from '../constants/error-codes';

/**
 * API Response Header
 * Success: { success: true, message: string }
 * Error: { success: false, err_code: string, err_msg: string }
 */
export class ApiResponseHeader {
  success: boolean;
  message?: string;
  err_code?: ErrorCode;
  err_msg?: string;

  private constructor(
    success: boolean,
    message?: string,
    errCode?: ErrorCode,
    errMsg?: string,
  ) {
    this.success = success;

    if (success) {
      this.message = message || 'Operation successful';
    } else {
      this.err_code = errCode || ERROR_CODES.SERVER_ERROR;
      this.err_msg =
        errMsg ||
        ERROR_MESSAGES[errCode || ERROR_CODES.SERVER_ERROR] ||
        'Unknown error';
    }
  }

  static success(message: string): ApiResponseHeader {
    return new ApiResponseHeader(true, message);
  }

  static error(errCode: ErrorCode, errMsg?: string): ApiResponseHeader {
    return new ApiResponseHeader(false, undefined, errCode, errMsg);
  }
}

/**
 * Success Response: { header, result, meta? }
 */
export class ApiSuccessResponse<T = any> {
  header: ApiResponseHeader;
  result: T;
  meta?: any;

  constructor(header: ApiResponseHeader, result: T, meta?: any) {
    this.header = header;
    this.result = result;
    if (meta) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.meta = meta;
    }
  }
}

/**
 * Error Response: { header } (no result field)
 */
export class ApiErrorResponse {
  header: ApiResponseHeader;

  constructor(header: ApiResponseHeader) {
    this.header = header;
  }
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Factory for creating API responses
 * @example
 * ApiResponse.success('Found 10 records', data, { total: 10 })
 * ApiResponse.error('0201', 'Record not found')
 */
export const ApiResponse = {
  success<T>(message: string, result: T, meta?: any): ApiSuccessResponse<T> {
    return new ApiSuccessResponse(
      ApiResponseHeader.success(message),
      result,
      meta,
    );
  },

  error(errCode: ErrorCode, errMsg?: string): ApiErrorResponse {
    return new ApiErrorResponse(ApiResponseHeader.error(errCode, errMsg));
  },
};
