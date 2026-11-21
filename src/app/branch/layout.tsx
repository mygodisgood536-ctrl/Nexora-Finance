import { ProvisioningPoller } from "@/components/layout/ProvisioningPoller";

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  return <><ProvisioningPoller />{children}</>;
}
