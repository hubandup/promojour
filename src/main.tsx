import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress errors from browser extensions (Honey, PayPal, etc.)
const extensionPatterns = [
  /chrome-extension:/,
  /moz-extension:/,
  /514\.js/,
  /optibutton\.js/,
  /kwift/,
  /frame\.js.*makeProxyStores/,
  /runtime\/sendMessage/,
  /message channel closed/,
];

const isExtensionError = (message: string): boolean => {
  return extensionPatterns.some((pattern) => pattern.test(message));
};

// Handle uncaught errors
window.addEventListener("error", (event) => {
  const errorMessage = event.message || event.error?.message || "";
  const errorStack = event.error?.stack || "";
  const filename = event.filename || "";

  if (
    isExtensionError(errorMessage) ||
    isExtensionError(errorStack) ||
    isExtensionError(filename)
  ) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason) || "";
  const stack = reason?.stack || "";

  if (isExtensionError(message) || isExtensionError(stack)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
