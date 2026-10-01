import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  MONTH_OPTIONS,
  INITIAL_SALARY_LIST,
} from "@/pages/attendance/mockSalary";
import { showToast } from "@/utils/toast";

const EMPTY = {
  employeeId: "",
  amount: "",
  bankAccount: "",
  dateOfSalary: "",
  monthOfSalary: "2024-05",
  notes: "",
};

export default function AddSalaryModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [isOpen]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.employeeId) nextErrors.employeeId = "Employee is required";
    if (!form.amount || Number(form.amount) <= 0)
      nextErrors.amount = "Enter a valid amount";
    if (!form.bankAccount.trim())
      nextErrors.bankAccount = "Bank account number is required";
    if (!form.dateOfSalary)
      nextErrors.dateOfSalary = "Date of salary is required";
    if (!form.monthOfSalary)
      nextErrors.monthOfSalary = "Month of salary is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit({ ...form, amount: Number(form.amount) });
    showToast.success("Salary submitted.");
  }

  const employeeOptions = INITIAL_SALARY_LIST.map((e) => ({
    value: e.id,
    label: `${e.name} · ${e.id}`,
  }));
  const notesLen = form.notes.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Add Salary"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setForm(EMPTY)}>
            Reset
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Employee "
          required
          value={form.employeeId}
          onChange={(e) => update("employeeId", e.target.value)}
          options={employeeOptions}
          placeholder="Select Employee"
          error={errors.employeeId}
        />

        <Input
          label="Add Salary Amount (₹) "
          required
          type="number"
          min={0}
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          placeholder="Enter amount"
          error={errors.amount}
        />

        <Input
          label="Bank Deposit Account Number "
          required
          value={form.bankAccount}
          onChange={(e) => update("bankAccount", e.target.value)}
          placeholder="Enter account number"
          error={errors.bankAccount}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Date of Salary "
            required
            value={form.dateOfSalary}
            onChange={(e) => update("dateOfSalary", e.target.value)}
            error={errors.dateOfSalary}
          />
          <Select
            label="Month of Salary "
            required
            value={form.monthOfSalary}
            onChange={(e) => update("monthOfSalary", e.target.value)}
            options={MONTH_OPTIONS}
            error={errors.monthOfSalary}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Notes{" "}
            <span className="text-xs font-normal text-ink-500">(Optional)</span>
          </label>
          <Textarea
            rows={3}
            maxLength={150}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Add notes..."
          />
          <p className="mt-1 text-right text-xs text-ink-500">{notesLen}/150</p>
        </div>
      </div>
    </Modal>
  );
}
