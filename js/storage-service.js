(function () {
  const BACKUP_STORAGE_KEY = "pocketTextEditorTabsBackup";
  const THEME_STORAGE_KEY = "pocketTextEditorTheme";
  const ENCODING_SETTINGS_STORAGE_KEY = "pocketTextEditorEncodingSettings";

  function saveTabsBackup(backupData) {
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backupData));
      return true;
    } catch (error) {
      console.warn("自動バックアップに失敗しました。", error);
      return false;
    }
  }

  function loadTabsBackup() {
    try {
      const rawData = localStorage.getItem(BACKUP_STORAGE_KEY);

      if (!rawData) {
        return null;
      }

      return JSON.parse(rawData);
    } catch (error) {
      console.warn("自動バックアップの読み込みに失敗しました。", error);
      return null;
    }
  }

  function loadTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "light";
    } catch (error) {
      console.warn("テーマ設定の読み込みに失敗しました。", error);
      return "light";
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      return true;
    } catch (error) {
      console.warn("テーマ設定の保存に失敗しました。", error);
      return false;
    }
  }

  function loadEncodingSettings() {
    try {
      const rawData = localStorage.getItem(ENCODING_SETTINGS_STORAGE_KEY);

      if (!rawData) {
        return {
          openEncoding: "utf-8",
          saveEncoding: "utf-8"
        };
      }

      const settings = JSON.parse(rawData);

      return {
        openEncoding: settings.openEncoding || "utf-8",
        saveEncoding: settings.saveEncoding || "utf-8"
      };
    } catch (error) {
      console.warn("文字コード設定の読み込みに失敗しました。", error);

      return {
        openEncoding: "utf-8",
        saveEncoding: "utf-8"
      };
    }
  }

  function saveEncodingSettings(settings) {
    try {
      localStorage.setItem(
        ENCODING_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
      return true;
    } catch (error) {
      console.warn("文字コード設定の保存に失敗しました。", error);
      return false;
    }
  }

  window.AppStorage = {
    saveTabsBackup,
    loadTabsBackup,
    loadTheme,
    saveTheme,
    loadEncodingSettings,
    saveEncodingSettings
  };
})();

/* STORAGE_SERVICE_JS_MARKER_STORAGE_SPLIT_2026_06_07 */