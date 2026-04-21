import { SessionProvider } from "next-auth/react";

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}