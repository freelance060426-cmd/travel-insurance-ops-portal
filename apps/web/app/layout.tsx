import "./globals.css";
import type { Metadata } from "next";
import { fetchCurrentUser } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Travel Insurance Ops Portal",
  description: "Internal policy operations portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getServerAuthToken();
  let user = null;

  if (token) {
    try {
      user = await fetchCurrentUser(token);
    } catch {
      user = null;
    }
  }

  return (
    <html lang="en">
      <body>
        <AuthProvider initialToken={token} initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
