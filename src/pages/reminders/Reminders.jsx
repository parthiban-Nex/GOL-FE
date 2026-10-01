import { useState, useMemo } from "react";
import {
  Wrench,
  Calendar,
  Shield,
  AlertTriangle,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import ReminderStatCard from "@/components/reminders/ReminderStatCard";
import MiniReminderCard from "@/components/reminders/MiniReminderCard";
import ShareActions from "@/components/reminders/ShareActions";
import { usePagination } from "@/hooks/usePagination";
import { showToast } from "@/utils/toast";

import {
  kpiStats,
  initialServiceReminders,
  bookingReminders,
  insuranceReminders,
  rsaReminders,
} from "./mockReminders";

export default function Reminders() {
  const [activeTabFilter, setActiveTabFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");

  // Icon mapping for top KPI cards & bottom cards
  const getIcon = (id) => {
    switch (id) {
      case "service":
        return Wrench;
      case "booking":
        return Calendar;
      case "insurance":
        return Shield;
      case "rsa":
        return AlertTriangle;
      default:
        return Wrench;
    }
  };

  // Extract unique filter options from data
  const vehicleOptions = useMemo(() => {
    const vehicles = Array.from(
      new Set(initialServiceReminders.map((r) => r.vehicle)),
    );
    return [
      { value: "all", label: "All Vehicles" },
      ...vehicles.map((v) => ({ value: v, label: v })),
    ];
  }, []);

  const serviceTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(initialServiceReminders.map((r) => r.serviceType)),
    );
    return [
      { value: "all", label: "Service Types" },
      ...types.map((t) => ({ value: t, label: t })),
    ];
  }, []);

  const dueDateOptions = [
    { value: "all", label: "Due Date" },
    { value: "7", label: "Next 7 Days" },
    { value: "14", label: "Next 14 Days" },
    { value: "30", label: "Next 30 Days" },
  ];

  // Filtering logic
  const filteredData = useMemo(() => {
    return initialServiceReminders.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.customer.toLowerCase().includes(q) ||
        item.vehicle.toLowerCase().includes(q) ||
        item.regNo.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q);

      // vehicle filter
      const matchesVehicle =
        vehicleFilter === "all" || item.vehicle === vehicleFilter;

      // service filter
      const matchesServiceType =
        serviceTypeFilter === "all" || item.serviceType === serviceTypeFilter;

      // due date filter
      const daysLeft = parseInt(item.dueLeft) || 0;
      const matchesDueDate =
        dueDateFilter === "all" || daysLeft <= parseInt(dueDateFilter);

      // kpi tab filter
      const matchesTab =
        activeTabFilter === "all" ||
        activeTabFilter !== "service" ||
        (activeTabFilter === "service" &&
          item.status.toLowerCase() === "due soon");

      return (
        matchesSearch &&
        matchesVehicle &&
        matchesServiceType &&
        matchesTab &&
        matchesDueDate
      );
    });
  }, [
    searchQuery,
    vehicleFilter,
    serviceTypeFilter,
    activeTabFilter,
    dueDateFilter,
  ]);

  // Pagination hook
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filteredData, 5);

  // Top KPI Card click handler: scroll smoothly to corresponding section
  const handleTopCardClick = (statId) => {
    setActiveTabFilter(statId);
    if (statId !== "service" && statId !== "all") {
      document
        .getElementById(statId + "-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (statId === "service") {
      document
        .getElementById("service-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // View All handler for main Service Reminders
  const handleViewAllServiceReminders = () => {
    setSearchQuery("");
    setVehicleFilter("all");
    setServiceTypeFilter("all");
    setDueDateFilter("all");
    setActiveTabFilter("all");

    setPageSize(filteredData.length || 100);
    setPage(1);

    showToast.success("Displaying all Service Reminders");
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Reminders & Notifications
          </h1>
          <p className="text-sm font-normal text-ink-500">
            Stay on top of important tasks, service due dates and customer
            communications.
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center rounded-lg bg-ink-100/60 px-3 py-1.5 text-xs font-semibold text-ink-700 border border-ink-100">
            18 May 2024
          </span>
        </div>
      </div>

      {/* 4 Summary Stat KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat) => (
          <ReminderStatCard
            key={stat.id}
            title={stat.title}
            count={stat.count}
            label={stat.label}
            icon={getIcon(stat.id)}
            tone={stat.tone}
            isActive={activeTabFilter === stat.id}
            onClick={() => handleTopCardClick(stat.id)}
          />
        ))}
      </div>

      {/* Main Service Reminders Table Card */}
      <div id="service-section">
        <Card
          padded={false}
          className="overflow-hidden border border-ink-100 shadow-xs"
        >
          {/* Header bar inside main card */}
          <div className="flex flex-col gap-4 border-b border-ink-100 p-5 sm:flex-row sm:items-center sm:justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Wrench className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink-900">
                  Service Reminders
                </h2>
                <p className="text-xs text-ink-400">
                  Vehicles which are approaching service due dates
                </p>
              </div>
            </div>

            <Button
              onClick={handleViewAllServiceReminders}
              variant="primaryFilled"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4 stroke-[2.2]" />
            </Button>
          </div>

          {/* Toolbar: Filters & Search */}
          <div className="grid grid-cols-1 gap-3 border-b border-ink-100 bg-ink-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              options={vehicleOptions}
              className="bg-white text-xs py-2 shadow-2xs cursor-pointer"
            />

            <Select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              options={serviceTypeOptions}
              className="bg-white text-xs py-2 shadow-2xs cursor-pointer"
            />

            <Select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              options={dueDateOptions}
              className="bg-white text-xs py-2 shadow-2xs cursor-pointer"
            />

            <Input
              icon={Search}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Customer, Vehicle or Reg No..."
              className="text-xs py-2 shadow-2xs"
            />
          </div>

          {/* Main Service Reminders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Vehicle
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Reg No.
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Service Type
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Due Date
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Due Left
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold text-ink-600"
                  >
                    Share Via
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pageItems.length > 0 ? (
                  pageItems.map((row, index) => {
                    const isFirstRow = index === 0 && page === 1;
                    const isDueSoon =
                      row.dueLeft.includes("1 Days") ||
                      row.dueLeft.includes("2 Days") ||
                      row.dueLeft.includes("3 Days") ||
                      row.dueLeft.includes("4 Days") ||
                      row.status.toLowerCase() === "due soon";

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-ink-50/50 transition-colors"
                      >
                        {/* Customer Name & Phone */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="font-bold text-ink-900">
                            {row.customer}
                          </div>
                          <div className="text-[11px] font-normal text-ink-400">
                            {row.phone}
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium text-ink-700">
                          {row.vehicle}
                        </td>

                        {/* Reg No */}
                        <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-ink-800 tracking-wide">
                          {row.regNo}
                        </td>

                        {/* Service Type */}
                        <td className="whitespace-nowrap px-5 py-3.5 text-ink-700">
                          {row.serviceType}
                        </td>

                        {/* Due Date */}
                        <td className="whitespace-nowrap px-5 py-3.5 text-ink-700 font-medium">
                          {row.dueDate}
                        </td>

                        {/* Due Left */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isDueSoon
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {row.dueLeft}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              row.status.toLowerCase() === "due soon"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Share Via */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <ShareActions customer={row} expanded={isFirstRow} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-400">
                      No service reminders match your selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>

      {/* Bottom 3 Mini Reminder Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Booking Reminders */}
        <div id="booking-section">
          <MiniReminderCard
            title="Booking Reminders"
            icon={Calendar}
            theme="emerald"
            columns={[
              { key: "customer", header: "CUSTOMER" },
              { key: "vehicle", header: "VEHICLE" },
              { key: "date", header: "DATE" },
              { key: "status", header: "STATUS" },
            ]}
            data={bookingReminders}
          />
        </div>

        {/* Insurance Reminders */}
        <div id="insurance-section">
          <MiniReminderCard
            title="Insurance Reminders"
            icon={Shield}
            theme="purple"
            columns={[
              { key: "customer", header: "CUSTOMER" },
              { key: "policy", header: "POLICY" },
              { key: "expiry", header: "EXPIRY" },
              { key: "status", header: "STATUS" },
            ]}
            data={insuranceReminders}
          />
        </div>

        {/* RSL / RSA Reminders */}
        <div id="rsa-section">
          <MiniReminderCard
            title="RSL Reminders"
            icon={AlertTriangle}
            theme="amber"
            columns={[
              { key: "customer", header: "CUSTOMER" },
              { key: "vehicle", header: "VEHICLE" },
              { key: "expiry", header: "EXPIRY" },
              { key: "status", header: "STATUS" },
            ]}
            data={rsaReminders}
          />
        </div>
      </div>
    </div>
  );
}
