export class AuthenticationError extends Error {
  public readonly statusCode: number = 401;

  constructor(message: string = "Invalid email or password.") {
    super(message);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ForbiddenError extends Error {
  public readonly statusCode: number = 403;

  constructor(message: string = "Forbidden: Insufficient privileges.") {
    super(message);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends Error {
  public readonly statusCode: number = 409;

  constructor(message: string = "Conflict: Resource already exists.") {
    super(message);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends Error {
  public readonly statusCode: number = 400;

  constructor(message: string = "Validation failed.") {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends Error {
  public readonly statusCode: number = 400;

  constructor(message: string = "Bad Request.") {
    super(message);
    this.name = "BadRequestError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number = 404;

  constructor(message: string = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
