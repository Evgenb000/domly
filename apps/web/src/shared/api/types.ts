export interface FieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | FieldError[];
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorType: string;
  readonly fieldErrors: FieldError[] | null;

  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? "Validation failed" : body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.errorType = body.error;
    this.fieldErrors = Array.isArray(body.message) ? body.message : null;
  }

  get isValidationError(): boolean {
    return this.fieldErrors !== null;
  }
}