import toast from "react-hot-toast";

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast(message, { icon: "ℹ️" }),
  warning: (message) => toast(message, { icon: "⚠️" }),
};
