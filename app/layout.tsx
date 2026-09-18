import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "CarePlus | Sign In",
  description: "Hospital Management System — sign in to your account",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
