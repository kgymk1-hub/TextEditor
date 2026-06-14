(function () {
  const userAgent = navigator.userAgent || "";

  const isAndroid = /Android/i.test(userAgent);

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  const isSecure = window.isSecureContext === true;

  const isCapacitor =
    typeof window.Capacitor !== "undefined";

  const hasOpenFilePicker =
    "showOpenFilePicker" in window;

  const hasSaveFilePicker =
    "showSaveFilePicker" in window;

  const canUseOpenFilePicker =
    hasOpenFilePicker &&
    (isSecure || isLocalhost);

  const canUseFileSystemAccess = canUseOpenFilePicker;

  const canRegisterServiceWorker =
    "serviceWorker" in navigator &&
    (isSecure || isLocalhost);

  window.AppEnv = {
    userAgent,
    isAndroid,
    isLocalhost,
    isSecure,
    isCapacitor,
    hasOpenFilePicker,
    hasSaveFilePicker,
    canUseOpenFilePicker,
    canUseFileSystemAccess,
    canRegisterServiceWorker
  };
})();

/* ENV_JS_MARKER_ENV_SPLIT_2026_06_07 */