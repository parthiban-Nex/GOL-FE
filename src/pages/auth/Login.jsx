import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { validate, isRequired } from "@/utils/validators";
import { showToast } from "@/utils/toast";
import { Illustration, Logo, LoginBg } from "@/assets/images";

const passwordRules = {
  employeeId: [[isRequired, "Employee ID is required."]],
  password: [[isRequired, "Password is required."]],
};

const pinRules = {
  pin: [
    [isRequired, "Secret PIN is required."],
    [(v) => /^\d{4}$/.test(v), "PIN must be exactly 4 digits."],
  ],
};

export default function Login() {
  const { login, verifyPin, loginStep, pendingEmployeeId, cancelPinStep } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? ROUTES.WELCOME;
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, passwordRules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form);
    } catch (err) {
      showToast.error(err.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    const nextErrors = validate({ pin }, pinRules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyPin(pin);
      showToast.success("Logged in successfully.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast.error(err.message || "Incorrect PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToPassword() {
    cancelPinStep();
    setPin("");
    setErrors({});
  }

  return (
    <div className="flex min-h-screen">
      {/* Illustration panel */}
      <div className="hidden h-screen w-1/2 md:flex">
        <img
          src={Illustration}
          alt="Illustration"
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>

      {/* Form panel */}
      <div
        className="flex w-full flex-col justify-center md:w-1/2 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${LoginBg})` }}
      >
        <div className="mx-auto w-full px-4 py-8 sm:px-6 md:px-10 lg:px-30 ">
          <div className="mb-2">
            <img src={Logo} alt="GarageOne" className="h-12 w-auto" />
          </div>

          <h1 className="mb-6 text-2xl font-bold uppercase text-ink-800">
            Login
          </h1>

          {loginStep === "PASSWORD" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
              <Input
                label="Employee ID"
                name="employeeId"
                autoComplete="username"
                value={form.employeeId}
                onChange={(e) => updateField("employeeId", e.target.value)}
                error={errors.employeeId}
                placeholder="e.g. EMP001"
                className="h-12"
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  error={errors.password}
                  placeholder="••••••••"
                  className="h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute cursor-pointer right-3 top-1/2 translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus-visible:outline-none cursor-pointer"
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-brand-600 hover:underline"
                  onClick={() =>
                    showToast.info(
                      "Password reset isn't connected to a backend yet.",
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 uppercase bg-brand-600 text-white hover:bg-brand-700"
                isLoading={isSubmitting}
              >
                Login Now
              </Button>
            </form>
          )}

          {loginStep === "PIN" && (
            <form onSubmit={handlePinSubmit} className="space-y-5" noValidate>
              <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                Enter the 4-digit Secret PIN for{" "}
                <span className="font-semibold">{pendingEmployeeId}</span> to
                continue.
              </div>

              <div className="relative">
                <Input
                  label="Secret PIN"
                  name="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="one-time-code"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                    if (errors.pin) setErrors((er) => ({ ...er, pin: undefined }));
                  }}
                  error={errors.pin}
                  placeholder="••••"
                  className="h-12 tracking-[0.5em]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute cursor-pointer right-3 top-1/2 translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 uppercase bg-brand-600 text-white hover:bg-brand-700"
                isLoading={isSubmitting}
              >
                Verify PIN
              </Button>

              <button
                type="button"
                onClick={handleBackToPassword}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Employee ID & Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
