import { SessionProvider } from "next-auth/react";

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}