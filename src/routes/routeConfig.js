import { lazy } from "react";
import { ROUTES } from "@/constants/routes";

const Login = lazy(() => import("@/pages/auth/Login"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Customers = lazy(() => import("@/pages/customers/Customers"));
// const UserCreate = lazy(() => import("@/pages/users/UserCreate"));
const Service = lazy(() => import("@/pages/service/Service"));
const Appointment = lazy(() => import("@/pages/service/Appointment"));
const Estimate = lazy(() => import("@/pages/service/Estimate"));

const JobCardRepair = lazy(() => import("@/pages/service/JobCardRepair"));

const Parts = lazy(() => import("@/pages/parts/Parts"));
const SpareIssue = lazy(() => import("@/pages/parts/spare-issue/SpareIssue"));
const PurchaseOrder = lazy(
  () => import("@/pages/parts/purchase-order/PurchaseOrder"),
);
const GrnDirect = lazy(() => import("@/pages/parts/grn-direct/GrnDirect"));
const AutoGrn = lazy(() => import("@/pages/parts/auto-grn/AutoGrn"));
const PurchaseReturn = lazy(
  () => import("@/pages/parts/purchase-return/PurchaseReturn"),
);
const StockTransfer = lazy(
  () => import("@/pages/parts/stock-transfer/StockTransfer"),
);
const Catalogue = lazy(() => import("@/pages/catalogue/Catalogue"));
const Top20Cars = lazy(() => import("@/pages/catalogue/Top20Cars"));
const MyTvsParts = lazy(() => import("@/pages/catalogue/MyTvsParts"));
const CatalogueGlobal = lazy(() => import("@/pages/catalogue/Global"));
const Finance = lazy(() => import("@/pages/finance/Finance"));
const Wallet = lazy(() => import("@/pages/finance/Wallet"));
const FinanceLoyalty = lazy(() => import("@/pages/finance/Loyalty"));
const FinanceBilling = lazy(() => import("@/pages/finance/Billing"));
const FinanceReceipt = lazy(() => import("@/pages/finance/Receipt"));
const FinanceExpense = lazy(() => import("@/pages/finance/Expense"));
const FinancePurchase = lazy(() => import("@/pages/finance/Purchase"));
const FinanceBankDeposit = lazy(() => import("@/pages/finance/BankDeposit"));
const FinanceProfitLoss = lazy(() => import("@/pages/finance/ProfitLoss"));
const FinanceMargin = lazy(() => import("@/pages/finance/Margin"));
const Reminders = lazy(() => import("@/pages/reminders/Reminders"));
// const Marketing = lazy(() => import("@/pages/marketing/Marketing"));
const CreateCampaigns = lazy(
  () => import("@/pages/marketing/create-campaigns/CreateCampaigns"),
);
const CampaignsPartsOrder = lazy(
  () => import("@/pages/marketing/campaigns-parts-order/CampaignsPartsOrder"),
);
// const Reports = lazy(() => import("@/pages/reports/Reports"));
const OtherReports = lazy(
  () => import("@/pages/reports/OtherReports"),
);
const MyCustomersReport = lazy(
  () => import("@/pages/reports/MyCustomers"),
);
const InwardOutward = lazy(
  () => import("@/pages/reports/InwardOutward"),
);
const InventoryReport = lazy(
  () => import("@/pages/reports/Inventory"),
);
const Attendance = lazy(() => import("@/pages/attendance/Attendance"));
const SelfConfiguration = lazy(
  () => import("@/pages/self-configuration/SelfConfiguration"),
);
const MenuSettings = lazy(() => import("@/pages/menu-settings/MenuSettings"));
const Employees = lazy(() => import("@/pages/masters/employees/Employees"));
const Users = lazy(() => import("@/pages/masters/users/Users"));
const EmployeeRoles = lazy(
  () => import("@/pages/masters/employee-roles/EmployeeRoles"),
);
const Outlets = lazy(() => import("@/pages/masters/outlets/Outlets"));
const BinLocations = lazy(
  () => import("@/pages/masters/bin-locations/BinLocations"),
);
const Technicians = lazy(
  () => import("@/pages/masters/technicians/Technicians"),
);
const Vendors = lazy(() => import("@/pages/masters/vendors/Vendors"));
const ItemMaster = lazy(() => import("@/pages/masters/item-master/ItemMaster"));
const ItemSubMaster = lazy(
  () => import("@/pages/masters/item-submaster/ItemSubMaster"),
);
const Source = lazy(() => import("@/pages/masters/source/Source"));
const Insurance = lazy(() => import("@/pages/masters/insurance/Insurance"));
const Make = lazy(() => import("@/pages/masters/makes/Makes"));
const Model = lazy(() => import("@/pages/masters/models/Models"));
const Variant = lazy(() => import("@/pages/masters/variants/Variants"));
const UserLog = lazy(() => import("@/pages/logs/UserLog"));
const AuditLog = lazy(() => import("@/pages/logs/AuditLog"));
const Integrations = lazy(() => import("@/pages/integrations/Integrations"));
const DynamicModulePage = lazy(
  () => import("@/pages/common/DynamicModulePage"),
);
const Unauthorized = lazy(() => import("@/pages/errors/Unauthorized"));
const NotFound = lazy(() => import("@/pages/errors/NotFound"));
const Welcome = lazy(() => import("@/pages/welcome/Welcome"));
export const publicRoutes = [{ path: ROUTES.LOGIN, element: Login }];

export const protectedRoutes = [
  {
    path: ROUTES.WELCOME,
    element: Welcome,
    alwaysAllowed: true,
  },
  { path: ROUTES.DASHBOARD, element: Dashboard },
  { path: ROUTES.CUSTOMERS, element: Customers },
  { path: ROUTES.MASTERS_USERS, element: Users },
  { path: ROUTES.SERVICE, element: Service },
  { path: ROUTES.SERVICE_APPOINTMENT, element: Appointment },
  { path: ROUTES.SERVICE_ESTIMATE, element: Estimate },
  { path: ROUTES.SERVICE_JOB_CARD, element: JobCardRepair },
  { path: ROUTES.PARTS, element: Parts },
  { path: ROUTES.PARTS_SPARE_ISSUE, element: SpareIssue },
  { path: ROUTES.PARTS_PURCHASE_ORDER, element: PurchaseOrder },
  { path: ROUTES.PARTS_GRN_DIRECT, element: GrnDirect },
  { path: ROUTES.PARTS_AUTO_GRN, element: AutoGrn },
  { path: ROUTES.PARTS_PURCHASE_RETURN, element: PurchaseReturn },
  { path: ROUTES.PARTS_STOCK_TRANSFER, element: StockTransfer },
  { path: ROUTES.CATALOGUE, element: Catalogue },
  { path: ROUTES.CATALOGUE_TOP_20, element: Top20Cars },
  { path: ROUTES.CATALOGUE_MYTVS, element: MyTvsParts },
  { path: ROUTES.CATALOGUE_GLOBAL, element: CatalogueGlobal },
  { path: ROUTES.FINANCE, element: Finance },
  { path: ROUTES.FINANCE_WALLET, element: Wallet },
  { path: ROUTES.FINANCE_LOYALTY, element: FinanceLoyalty },
  { path: ROUTES.FINANCE_BILLING, element: FinanceBilling },
  { path: ROUTES.FINANCE_RECEIPT, element: FinanceReceipt },
  { path: ROUTES.FINANCE_EXPENSE, element: FinanceExpense },
  { path: ROUTES.FINANCE_PURCHASE, element: FinancePurchase },
  { path: ROUTES.FINANCE_BANK_DEPOSIT, element: FinanceBankDeposit },
  { path: ROUTES.FINANCE_PL, element: FinanceProfitLoss },
  { path: ROUTES.FINANCE_MARGIN, element: FinanceMargin },
  { path: ROUTES.REMINDERS, element: Reminders },
  // { path: ROUTES.MARKETING, element: Marketing },
  { path: ROUTES.MARKETING_CREATE_CAMPAIGNS, element: CreateCampaigns },
  { path: ROUTES.MARKETING_PARTS_ORDER, element: CampaignsPartsOrder },
  // { path: ROUTES.REPORTS, element: Reports },
  { path: ROUTES.REPORTS_OTHER, element: OtherReports },
  { path: ROUTES.REPORTS_MY_CUSTOMERS, element: MyCustomersReport },
  { path: ROUTES.REPORTS_INWARD_OUTWARD, element: InwardOutward },
  { path: ROUTES.REPORTS_INVENTORY, element: InventoryReport },
  { path: ROUTES.ATTENDANCE, element: Attendance },
  { path: ROUTES.SELF_CONFIGURATION, element: SelfConfiguration },
  { path: ROUTES.MENU_SETTINGS, element: MenuSettings },
  { path: ROUTES.MASTERS_EMPLOYEES, element: Employees },
  { path: ROUTES.MASTERS_EMPLOYEE_ROLES, element: EmployeeRoles },
  { path: ROUTES.MASTERS_OUTLETS, element: Outlets },
  { path: ROUTES.MASTERS_BIN_LOCATIONS, element: BinLocations },
  { path: ROUTES.MASTERS_TECHNICIANS, element: Technicians },
  { path: ROUTES.INTEGRATION, element: Integrations },
  { path: ROUTES.MASTERS_VENDORS, element: Vendors },
  { path: ROUTES.MASTERS_ITEM_MASTER, element: ItemMaster },
  { path: ROUTES.MASTERS_ITEM_SUBMASTER, element: ItemSubMaster },
  { path: ROUTES.MASTERS_SOURCE, element: Source },
  { path: ROUTES.MASTERS_INSURANCE, element: Insurance },
  { path: ROUTES.MASTERS_MAKE, element: Make },
  { path: ROUTES.MASTERS_MODEL, element: Model },
  { path: ROUTES.MASTERS_VARIANT, element: Variant },
  { path: ROUTES.LOGS_USER, element: UserLog },
  { path: ROUTES.LOGS_AUDIT, element: AuditLog },
];
/** Reachable regardless of auth state. */
export const utilityRoutes = {
  unauthorized: { path: ROUTES.UNAUTHORIZED, element: Unauthorized },
  notFound: { path: ROUTES.NOT_FOUND, element: NotFound },
};

export const dynamicModuleRoute = { path: "*", element: DynamicModulePage };
