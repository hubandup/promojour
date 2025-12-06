import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress errors from browser extensions (Honey, PayPal, etc.)
const extensionPatterns = [
  /chrome-extension:/i,
  /moz-extension:/i,
  /514\.js/i,
  /optibutton\.js/i,
  /kwift/i,
  /frame\.js/i,
  /makeProxyStores/i,
  /createProxyStore/i,
  /getInitialState/i,
  /runtime\/sendMessage/i,
  /message channel closed/i,
  /sw_iframe\.html/i,
];

const isExtensionError = (message: string): boolean => {
  if (!message) return false;
  return extensionPatterns.some((pattern) => pattern.test(message));
};

// Override console.error to filter extension errors
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args.map(arg => String(arg)).join(' ');
  if (isExtensionError(message)) return;
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter extension warnings
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args.map(arg => String(arg)).join(' ');
  if (isExtensionError(message)) return;
  originalConsoleWarn.apply(console, args);
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
}, true);

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
}, true);

createRoot(document.getElementById("root")!).render(<App />);
