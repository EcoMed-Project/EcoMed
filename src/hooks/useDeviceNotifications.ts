import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ecomed:device-notifications";

type PermissionState = "unsupported" | "default" | "granted" | "denied";

export function useDeviceNotifications() {
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
    setEnabled(window.localStorage.getItem(STORAGE_KEY) === "on");
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    if (result === "granted") {
      window.localStorage.setItem(STORAGE_KEY, "on");
      setEnabled(true);
      return true;
    }
    return false;
  }, []);

  const disable = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "off");
    setEnabled(false);
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled || typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      try {
        new Notification(title, { body, icon: "/favicon.ico", tag: `${title}-${body}` });
      } catch {
        // Alguns navegadores exigem service worker; o toast em tela cobre esse caso.
      }
    },
    [enabled],
  );

  return { permission, enabled, enable, disable, notify };
}
