import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (session?.role === "PLATFORM_OWNER") {
    redirect("/owner");
  }
  if (session?.role === "COMPANY") {
    redirect("/company");
  }
  if (session?.role === "BM" || session?.role === "CO") {
    redirect("/branch");
  }

  // Default: Platform Owner login
  redirect("/owner/login");
}
