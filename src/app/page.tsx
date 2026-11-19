import { redirect } from "next/navigation";

/**
 * Main NEXORA URL = Infrastructure Owner entry only.
 * Company / branch / staff environments are prebuilt and provisioned
 * when records are created — they are never selectable here.
 */
export default function HomePage() {
  redirect("/owner/login");
}
