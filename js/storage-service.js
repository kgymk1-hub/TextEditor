(function () {
  const BACKUP_STORAGE_KEY = "pocketTextEditorTabsBackup";
  const THEME_STORAGE_KEY = "pocketTextEditorTheme";
  const ENCODING_SETTINGS_STORAGE_KEY = "pocketTextEditorEncodingSettings";
  const APP_SETTINGS_STORAGE_KEY = "pocketTextEditorAppSettings";

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

  function loadAppSettings() {
    try {
      const rawData = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      const settings = rawData ? JSON.parse(rawData) : {};

      return {
        csvFirstRowHeader: settings.csvFirstRowHeader !== false,
        linkedPreviewEnabled: settings.linkedPreviewEnabled === true,
        fontSize: Number(settings.fontSize) || 15,
        wordWrap: settings.wordWrap !== false,
        maxTabs: Number(settings.maxTabs) === 10 ? 10 : 5
      };
    } catch (error) {
      console.warn("アプリ設定の読み込みに失敗しました。", error);

      return {
        csvFirstRowHeader: true,
        linkedPreviewEnabled: false,
        fontSize: 15,
        wordWrap: true,
        maxTabs: 5
      };
    }
  }

  function saveAppSettings(settings) {
    try {
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.warn("アプリ設定の保存に失敗しました。", error);
      return false;
    }
  }

  window.AppStorage = {
    saveTabsBackup,
    loadTabsBackup,
    loadTheme,
    saveTheme,
    loadEncodingSettings,
    saveEncodingSettings,
    loadAppSettings,
    saveAppSettings
  };
})();
