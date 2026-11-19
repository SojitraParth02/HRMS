export class AuthenticationError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Invalid email or password.") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
