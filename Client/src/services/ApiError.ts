/**
 * Custom error class for API errors
 * Provides consistent error handling across the application
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public data: unknown,
    message?: string
  ) {
    super(message || 'API Error');
    this.name = 'ApiError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if the error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if the error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Get a user-friendly error message based on the status code
   */
  getUserMessage(): string {
    if (this.statusCode === 400) {
      return 'Invalid request. Please check your input and try again.';
    }
    if (this.statusCode === 401) {
      return 'You are not authorized to perform this action.';
    }
    if (this.statusCode === 403) {
      return 'Access forbidden.';
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (this.statusCode === 409) {
      return 'Conflict: The request could not be completed due to a conflict.';
    }
    if (this.statusCode === 422) {
      return 'Validation error. Please check your input.';
    }
    if (this.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    return this.message;
  }

  /**
   * Convert the error to a JSON object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data
    };
  }
}
