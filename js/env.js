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

  // 将来の保存先選択対応用。現在のDL保存では使用しない。
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
