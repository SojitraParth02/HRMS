import type { Metadata } from "next";
import LoginForm from "../../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In - HRMS Workforce Management",
  description: "Sign in to access your HRMS administrative workforce dashboard",
};

export default function LoginPage() {
  return <LoginForm />;
}
