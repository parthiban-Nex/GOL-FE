import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { menuApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  title: [[isRequired, "Title is required."]],
  icon: [[isRequired, "Icon is required."]],
  activeIcon: [[isRequired, "Active icon is required."]],
};

export default function AddMenuForm({ menu, onCreated, onCancel }) {
  const isEditing = Boolean(menu);

  const [form, setForm] = useState({
    title: "",
    icon: "",
    activeIcon: "",
    path: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The grid stores paths with a leading slash; the form edits them
  // without one, matching how the reference screen behaves.
  useEffect(() => {
    if (!menu) return;
    setForm({
      title: menu.title ?? "",
      icon: menu.icon ?? "",
      activeIcon: menu.activeIcon ?? "",
      path: String(menu.path ?? "").replace(/^\//, ""),
    });
  }, [menu]);

  function update(field, value) {
    if (field === "path") {
      value = value.replace(/^\/+/, "");
    }

    setForm((f) => ({ ...f, [field]: value }));

    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, rules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        path: form.path ? `/${String(form.path).replace(/^\/+/, "")}` : "",
      };
      if (isEditing) payload.id = menu.id;

      const response = isEditing
        ? await menuApi.updateMenu(payload)
        : await menuApi.createMenu(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update menu." : "Couldn't create menu.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.title} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update menu." : "Couldn't create menu."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        required
        variant="underline"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
        error={errors.title}
      />
      <Input
        label="Icon"
        required
        variant="underline"
        placeholder="e.g. master, report, menus - see menu/iconMap.js"
        value={form.icon}
        onChange={(e) => update("icon", e.target.value)}
        error={errors.icon}
      />
      <Input
        label="Active Icon"
        required
        variant="underline"
        value={form.activeIcon}
        onChange={(e) => update("activeIcon", e.target.value)}
        error={errors.activeIcon}
      />
      <Input
        label="Path"
        variant="underline"
        placeholder="masters/outlets - the leading slash is added for you"
        value={`/${form.path}`}
        onChange={(e) => update("path", e.target.value)}
        error={errors.path}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save changes" : "Create menu"}
        </Button>
      </div>
    </form>
  );
}
