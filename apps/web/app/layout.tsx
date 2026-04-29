import "./globals.css";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
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
        <NextTopLoader
          color="#0f766e"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #0f766e,0 0 5px #0f766e"
        />
        <AuthProvider initialToken={token} initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
