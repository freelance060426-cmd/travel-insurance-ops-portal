import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function LoginPage() {
  const token = await getServerAuthToken();

  if (token) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
