import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Allow login and change-password without full session checks handled in pages
  return <>{children}</>;
}
