import { redirect } from "next/navigation";

/**
 * Company access entry: /c/{slug}
 * Prebuilt company workplace — provisioned when the company record exists.
 * Branding is resolved from the slug at login / session time.
 */
export default async function CompanyAccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/company/login?slug=${encodeURIComponent(slug)}`);
}
