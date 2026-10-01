import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { showToast } from "@/utils/toast";
import { authService } from "@/auth/authService";
import { setUnauthorizedHandler } from "@/services";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginStep, setLoginStep] = useState("PASSWORD");
  const [pendingEmployeeId, setPendingEmployeeId] = useState(null);

  // Restore session on first mount (e.g. page refresh while logged in).
  useEffect(() => {
    let isMounted = true;
    authService.restoreSession().then((restoredUser) => {
      if (isMounted) {
        setUser(restoredUser);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const resetLoginFlow = useCallback(() => {
    setLoginStep("PASSWORD");
    setPendingEmployeeId(null);
  }, []);

  const logout = useCallback(
    async (options = {}) => {
      await authService.logout();
      setUser(null);
      resetLoginFlow();
      if (options.message) showToast.success(options.message);
    },
    [resetLoginFlow],
  );

  // Let the axios layer trigger a logout on 401 without importing React.
  // The saved token / user / menu are removed too - otherwise a refresh
  // would restore the expired session and hit 401 again.
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only a signed-in session can expire (a 401 from the login form
      // itself is a wrong password, handled there). Several requests can
      // fail together - clear and warn only once.
      if (!userRef.current) return;
      userRef.current = null;
      authService.clearSession();
      setUser(null);
      resetLoginFlow();
      showToast.error("Your session has expired. Please sign in again.");
    });
    return () => setUnauthorizedHandler(null);
  }, [resetLoginFlow]);

  // Step 1: employee ID + password. Does NOT log the user in - on
  // success it advances the flow to the Secret PIN step.
  const login = useCallback(async (credentials) => {
    const { employeeId } = await authService.login(credentials);
    setPendingEmployeeId(employeeId);
    setLoginStep("PIN");
  }, []);

  // Step 2: the 4-digit Secret PIN. Completes the login and fetches the
  // user's permission set (via their menu tree).
  const verifyPin = useCallback(
    async (pin) => {
      const loggedInUser = await authService.verifyPin({
        employeeId: pendingEmployeeId,
        pin,
      });
      setUser(loggedInUser);
      resetLoginFlow();
      return loggedInUser;
    },
    [pendingEmployeeId, resetLoginFlow],
  );

  // Lets the PIN screen back out to re-enter employee ID/password.
  const cancelPinStep = useCallback(() => {
    resetLoginFlow();
  }, [resetLoginFlow]);

  const value = useMemo(
    () => ({
      user,
      role: user?.roleId ?? null,
      menu: user?.menu ?? [],
      isAuthenticated: Boolean(user),
      isLoading,
      loginStep,
      pendingEmployeeId,
      login,
      verifyPin,
      cancelPinStep,
      logout,
    }),
    [
      user,
      isLoading,
      loginStep,
      pendingEmployeeId,
      login,
      verifyPin,
      cancelPinStep,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
