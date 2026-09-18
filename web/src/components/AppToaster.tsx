import { Toaster } from "sonner";
import { useTheme } from "../context/ThemeContext";

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border shadow-lg",
        },
      }}
    />
  );
}
