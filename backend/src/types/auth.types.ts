export interface IAdminUserResponse {
  id: string;
  username: string;
  email: string;
  role: "ADMIN";
  sessionId: string;
}

export interface ILoginResponse {
  token: string;
  user: IAdminUserResponse;
}

export interface IJwtPayload {
  id: string;
  email: string;
  username: string;
  role: "ADMIN";
  sessionId: string;
}

export interface ILoginRequestBody {
  email?: string;
  password?: string;
}
