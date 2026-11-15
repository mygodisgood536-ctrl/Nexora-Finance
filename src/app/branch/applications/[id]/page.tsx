import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LoanApplicationWizard } from "@/components/branch/LoanApplicationWizard";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }

  const { id } = await params;

  const application = await prisma.loanApplication.findFirst({
    where: { id, currentOwnerWorkerId: session.workerId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          gender: true,
          maritalStatus: true,
          address: true,
          nextOfKinName: true,
          nextOfKinPhone: true,
          occupation: true,
          bvn: true,
          nin: true,
          bankAccount: true,
        },
      },
    },
  });

  if (!application) notFound();

  return (
    <LoanApplicationWizard
      application={{
        id: application.id,
        stage: application.stage,
        status: application.appStatus,
        repaymentMode: application.repaymentMode,
        requestedAmount: application.requestedAmount,
        interestPercentage: application.interestPercentage,
        repaymentAmount: application.repaymentAmount,
        period: application.period,
        repaymentWeekday: application.repaymentWeekday,
        loanPurpose: application.loanPurpose,
        capturedData: application.capturedData,
      }}
      customer={application.customer}
    />
  );
}
