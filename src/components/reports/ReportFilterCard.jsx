import { Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";


export default function ReportFilterCard({
  title,
  fields,
  values,
  onChange,
  onDownload,
  isDownloading = false,
  canDownload = true,
}) {
  return (
    <Card className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-800">{title}</h1>

      <div className="flex flex-wrap items-end gap-4">
        {fields.map((field) => (
          <div key={field.name} className="min-w-44 flex-1">
            {field.type === "select" ? (
              <SingleSelect
                label={field.label}
                placeholder={
                  field.placeholder ?? `Select ${field.label.toLowerCase()}`
                }
                value={values[field.name] ?? ""}
                onChange={(value) => onChange(field.name, value ?? "")}
                options={field.options ?? []}
              />
            ) : (
              <Input
                label={field.label}
                type={field.type === "date" ? "date" : "text"}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}

        {canDownload && (
          <Button
            icon={Download}
            onClick={onDownload}
            isLoading={isDownloading}
          >
            Download
          </Button>
        )}
      </div>
    </Card>
  );
}
