import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppointmentToolbar from "@/components/appointments/AppointmentToolbar";
import CalendarWeekView from "@/components/appointments/CalendarWeekView";
import CalendarDayView from "@/components/appointments/CalendarDayView";
import CalendarMonthView from "@/components/appointments/CalendarMonthView";
import MiniCalendar from "@/components/appointments/MiniCalendar";
import DayAgenda from "@/components/appointments/DayAgenda";
import AppointmentFormModal from "@/components/appointments/AppointmentFormModal";
import { showToast } from "@/utils/toast";
import { appointmentApi } from "@/services";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import {
  STATUS_PROCEED_TO_JOBCARD,
  buildStatusPayload,
  colorForAppointment,
  slotEnd,
  statusValuesFromRow,
} from "@/constants/appointmentStatus";
import {
  buildPickupDropPayload,
  pickupDropFromRow,
} from "@/constants/appointmentPickupDrop";
import {
  addTime,
  isSameDay,
  startOfWeek,
  startOfMonth,
} from "@/utils/dateHelpers";

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function mapBooking(row) {
  const dateStr = row.appointmentDate ?? row.scheduledStartDate?.slice(0, 10);
  const start = row.startTime ?? row.scheduledStartDate?.slice(11, 16) ?? "";
  const end = row.endTime ?? row.scheduledEndDate?.slice(11, 16) ?? "";
  return {
    id: row.id,
    customerId:
      row.customerId ??
      row.customeId ??
      row.customer_id ??
      row.customer?.id ??
      null,
    customer: row.customerName ?? "",
    customerMobile: row.customerMobileNumber ?? "",
    vehicleId: row.vehicleId ?? row.vehicle_id ?? row.vehicle?.id ?? null,
    vehicle: row.registrationNumber ?? "",
    makeId: row.makeId ?? row.vehicleMakeId ?? row.make_id ?? null,
    modelId: row.modelId ?? row.vehicleModelId ?? row.model_id ?? null,
    make: row.makeName ?? row.vehicle?.make?.makeName ?? "",
    model: row.modelName ?? row.vehicle?.model?.modelName ?? "",
    fuelType: row.fuelType ?? row.vehicle?.fuelType ?? "",
    customerAddress: row.customerAddress ?? "",
    pinCode: String(row.pinCode ?? row.pincode ?? row.customerPincode ?? ""),
    customerCity: row.customerCity ?? "",
    customerState: row.customerState ?? "",
    service: row.serviceType ?? "",
    advisor: row.advisorId ?? null,
    status: row.status ?? "Confirmed",
    // Frontend-only colour, not stored in the backend.
    color: colorForAppointment(row.id),
    date: dateStr ? new Date(dateStr) : null,
    start,
    end,
    remarks: row.remarks ?? "",
    statusValues: statusValuesFromRow(row),
    createEstimate: Boolean(row.createEstimate),
    ...pickupDropFromRow(row),
  };
}

export default function Appointment() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [monthShown, setMonthShown] = useState(() =>
    startOfMonth(selectedDate),
  );
  const [view, setView] = useState("week");
  const [advisor, setAdvisor] = useState("");
  const [service, setService] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { canCreate, canUpdate } = usePagePermissions();
  useEffect(() => {
    if (
      monthShown.getMonth() !== selectedDate.getMonth() ||
      monthShown.getFullYear() !== selectedDate.getFullYear()
    ) {
      setMonthShown(startOfMonth(selectedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  // Range to request - matches what each view actually renders.
  const { fromDate, toDate } = useMemo(() => {
    if (view === "day") {
      return {
        fromDate: toISODate(addTime(selectedDate, -1, "day")),
        toDate: toISODate(addTime(selectedDate, 1, "day")),
      };
    }
    if (view === "month") {
      const first = new Date(
        monthShown.getFullYear(),
        monthShown.getMonth(),
        1,
      );
      const last = new Date(
        monthShown.getFullYear(),
        monthShown.getMonth() + 1,
        0,
      );
      return { fromDate: toISODate(first), toDate: toISODate(last) };
    }
    // week grid is Monday-Saturday (6 columns)
    return {
      fromDate: toISODate(weekStart),
      toDate: toISODate(addTime(weekStart, 5, "day")),
    };
  }, [view, selectedDate, monthShown, weekStart]);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await appointmentApi.list({
        fromDate,
        toDate,
        advisorId: advisor || null,
        serviceType: service || null,
        status: null,
      });
      setAppointments(
        extractList(response, appointmentApi.listKey).map(mapBooking),
      );
    } catch {
      showToast.error("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, advisor, service]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const todaysAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.date && isSameDay(a.date, selectedDate))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [appointments, selectedDate],
  );

  function handleCreate() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function handleEdit(appt) {
    if (!canUpdate) return;
    setEditing({ ...appt, date: appt.date ? toISODate(appt.date) : "" });
    setIsFormOpen(true);
  }

  /** Fields both create and update send - appointment details + pickup/drop. */
  function schedulePayload(values) {
    return {
      // Same keys as createServiceEstimate.
      makeId: values.makeId != null ? Number(values.makeId) : null,
      modelId: values.modelId != null ? Number(values.modelId) : null,
      fuelType: values.fuelType || null, // same key as createServiceEstimate
      customerAddress: values.customerAddress?.trim() ?? "",
      customerState: values.customerState?.trim() ?? "",
      customerCity: values.customerCity?.trim() ?? "",
      pinCode: values.pinCode ?? "",
      serviceType: values.service,
      advisorId: values.advisor || null,
      appointmentDate: values.date,
      scheduledStartDate: `${values.date} ${values.start}:00`,
      scheduledEndDate: `${values.date} ${slotEnd(values.start)}:00`,
      ...buildPickupDropPayload(values),
    };
  }

  async function handleFormSubmit(values) {
    if (isSaving) return;
    const isEdit = Boolean(editing?.id);
    setIsSaving(true);
    try {
      const response = isEdit
        ? await appointmentApi.update({
            id: editing.id,
            customerId: values.customerId ?? null,
            customerName: values.customer,
            customerMobileNumber: values.customerMobile ?? "",
            vehicleId: values.vehicleId ?? null,
            registrationNumber: values.vehicle,
            ...schedulePayload(values),
            startTime: values.start,
            endTime: slotEnd(values.start),
            status: values.status,
            remarks: values.remarks ?? "",
            // Only the selected status's fields, e.g. followupDate, reason,
            // serviceProvider, saleDetails, correctContactNumber.
            ...buildStatusPayload(values.status, values.statusValues),
            ...(values.status === STATUS_PROCEED_TO_JOBCARD && {
              createEstimate: Boolean(values.createEstimate),
            }),
          })
        : await appointmentApi.create({
            customeId: values.customerId ?? null,
            customerName: values.customer,
            customerMobileNumber: values.customerMobile ?? "",
            vehicleId: values.vehicleId ?? null,
            registrationNumber: values.vehicle,
            ...schedulePayload(values),
            status: values.status,
          });

      // requestSuccessful: false comes back as a normal response - keep the
      // form open with the user's input so they can fix and retry.
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(
            response,
            isEdit
              ? "Couldn't update appointment."
              : "Couldn't create appointment.",
          ),
        );
        return;
      }

      showToast.success(
        responseMessage(
          response,
          isEdit ? "Appointment updated." : "Appointment created.",
        ),
      );
      setIsFormOpen(false);
      loadAppointments();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEdit
            ? "Couldn't update appointment."
            : "Couldn't create appointment."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink-800">Appointment</h1>
        {canCreate && (
          <Button icon={Plus} onClick={handleCreate}>
            Create Appointment
          </Button>
        )}
      </div>
      <AppointmentToolbar
        view={view}
        onViewChange={setView}
        advisor={advisor}
        onAdvisorChange={setAdvisor}
        service={service}
        onServiceChange={setService}
        onOpenFilters={() => showToast.success("Advanced filters coming soon.")}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="space-y-4">
          <div className="rounded-lg border border-ink-100">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-ink-500">
                Loading appointments...
              </div>
            ) : (
              <>
                {view === "week" && (
                  <CalendarWeekView
                    weekStart={weekStart}
                    appointments={appointments}
                    onSelect={handleEdit}
                  />
                )}
                {view === "day" && (
                  <CalendarDayView
                    date={selectedDate}
                    appointments={appointments}
                    onSelect={handleEdit}
                  />
                )}
                {view === "month" && (
                  <CalendarMonthView
                    month={monthShown}
                    appointments={appointments}
                    onSelect={handleEdit}
                    onSelectDate={(d) => {
                      setSelectedDate(d);
                      setView("day");
                    }}
                  />
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="space-y-6">
          <MiniCalendar
            month={monthShown}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onChangeMonth={setMonthShown}
          />
          <DayAgenda
            date={selectedDate}
            appointments={todaysAppts}
            onSelect={handleEdit}
            onView={() => setView("day")}
          />
        </Card>
      </div>

      {(canCreate || canUpdate) && (
        <AppointmentFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialValues={editing}
          defaultDate={selectedDate}
          isSubmitting={isSaving}
        />
      )}
    </div>
  );
}
