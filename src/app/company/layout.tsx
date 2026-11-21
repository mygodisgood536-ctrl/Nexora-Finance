import { ProvisioningPoller } from "@/components/layout/ProvisioningPoller";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <><ProvisioningPoller />{children}</>;
}
