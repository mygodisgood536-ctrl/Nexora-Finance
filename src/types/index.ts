export type Role = "PLATFORM_OWNER" | "COMPANY" | "BM" | "CO";

export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type WorkerAccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type IdentityStatus = "ACTIVE" | "REPLACED";
export type LoanStatus = "ACTIVE" | "COMPLETED";
export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "AWAITING_DISBURSEMENT_CONFIRMATION" | "COMPLETED";
export type PaymentSource = "WEBHOOK" | "MANUAL_CASH";
export type ReceiptStatus = "AWAITING_ALLOCATION" | "POSTED" | "FAILED";
export type ProviderCode = "MONNIFY" | "PAYSTACK" | "FLUTTERWAVE";
export type GroupRole = "LEADER" | "SECRETARY" | "TREASURER" | "CHIEF_WHIP" | "MEMBER";
