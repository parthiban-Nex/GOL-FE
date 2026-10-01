import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { menuApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  title: [[isRequired, "Title is required."]],
  path: [[isRequired, "Path is required."]],
};

export default function AddSubMenuForm({ subMenu, onCreated, onCancel }) {
  const isEditing = Boolean(subMenu);

  const [form, setForm] = useState({
    title: "",
    path: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The grid stores paths with a leading slash; the form edits them
  // without one, matching how the reference screen behaves.
  useEffect(() => {
    if (!subMenu) return;
    setForm({
      title: subMenu.title ?? "",
      path: String(subMenu.path ?? "").replace(/^\//, ""),
    });
  }, [subMenu]);

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
        path: `/${String(form.path ?? "").replace(/^\/+/, "")}`,
      };
      if (isEditing) payload.id = subMenu.id;

      const response = isEditing
        ? await menuApi.updateSubMenu(payload)
        : await menuApi.createSubMenu(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update submenu." : "Couldn't create submenu.",
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
          (isEditing ? "Couldn't update submenu." : "Couldn't create submenu."),
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
        label="Path"
        required
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
          {isEditing ? "Save changes" : "Create submenu"}
        </Button>
      </div>
    </form>
  );
}
