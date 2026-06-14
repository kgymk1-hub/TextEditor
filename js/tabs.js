(function () {
  const MAX_TABS = 5;

  let deps = null;
  let tabs = [];
  let activeTabId = null;

  function init(options) {
    deps = options;
  }

  function requireDeps() {
    if (!deps) {
      throw new Error("AppTabs is not initialized.");
    }

    return deps;
  }

  function createTabId() {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getNowIsoString() {
    return new Date().toISOString();
  }

  function getMaxTabs() {
    return MAX_TABS;
  }

  function getTabs() {
    return tabs;
  }

  function getActiveTabId() {
    return activeTabId;
  }

  function getActiveTab() {
    return tabs.find((tab) => tab.id === activeTabId) || null;
  }

  function canAddTab() {
    if (tabs.length >= MAX_TABS) {
      window.alert(`開けるタブは最大${MAX_TABS}個までです。`);
      return false;
    }

    return true;
  }

  function createTab({
    fileName = "無題",
    text = "",
    encoding = "utf-8",
    isDirty = false,
    saveTarget = null,
    skipBackup = false
  } = {}) {
    const {
      syncEditorToActiveTab,
      updateEditorFromActiveTab,
      resetSearchPosition,
      updateDisplay,
      saveBackup,
      renderPreview,
      renderCsvPreview,
      getViewMode
    } = requireDeps();

    if (!canAddTab()) {
      return null;
    }

    syncEditorToActiveTab();

    const now = getNowIsoString();

    const tab = {
      id: createTabId(),
      fileName,
      text,
      encoding,
      isDirty,
      saveTarget,
      createdAt: now,
      updatedAt: now
    };

    tabs.push(tab);
    activeTabId = tab.id;

    updateEditorFromActiveTab();
    resetSearchPosition();
    updateDisplay();

    const viewMode = getViewMode();

    if (viewMode === "preview") {
      renderPreview();
    } else if (viewMode === "csv") {
      renderCsvPreview();
    }

    if (!skipBackup) {
      saveBackup();
    }

    return tab;
  }

  function createEmptyTab(options = {}) {
    return createTab({
      fileName: "無題",
      text: "",
      encoding: "utf-8",
      isDirty: false,
      saveTarget: null,
      skipBackup: options.skipBackup === true
    });
  }

  function ensureAtLeastOneTab() {
    if (tabs.length === 0) {
      createEmptyTab({ skipBackup: true });
    }
  }

  function setActiveTab(tabId) {
    const {
      syncEditorToActiveTab,
      updateEditorFromActiveTab,
      resetSearchPosition,
      updateDisplay,
      saveBackup,
      renderPreview,
      renderCsvPreview,
      getViewMode,
      focusEditor
    } = requireDeps();

    if (tabId === activeTabId) {
      return;
    }

    syncEditorToActiveTab();

    const targetTab = tabs.find((tab) => tab.id === tabId);

    if (!targetTab) {
      return;
    }

    activeTabId = targetTab.id;
    updateEditorFromActiveTab();
    resetSearchPosition();
    updateDisplay();

    const viewMode = getViewMode();

    if (viewMode === "preview") {
      renderPreview();
    } else if (viewMode === "csv") {
      renderCsvPreview();
    } else {
      focusEditor();
    }

    saveBackup();
  }

  function closeTab(tabId) {
    const {
      syncEditorToActiveTab,
      updateEditorFromActiveTab,
      resetSearchPosition,
      updateDisplay,
      saveBackup,
      renderPreview,
      renderCsvPreview,
      getViewMode
    } = requireDeps();

    syncEditorToActiveTab();

    const tab = tabs.find((item) => item.id === tabId);

    if (!tab) {
      return;
    }

    if (tab.isDirty) {
      const confirmed = window.confirm(
        "このタブには保存されていない変更があります。閉じますか？"
      );

      if (!confirmed) {
        return;
      }
    }

    const closingIndex = tabs.findIndex((item) => item.id === tabId);
    const wasActive = tabId === activeTabId;

    tabs = tabs.filter((item) => item.id !== tabId);

    if (tabs.length === 0) {
      activeTabId = null;
      createEmptyTab({ skipBackup: true });
    } else if (wasActive) {
      const nextIndex = Math.min(closingIndex, tabs.length - 1);
      activeTabId = tabs[nextIndex].id;
    }

    updateEditorFromActiveTab();
    resetSearchPosition();
    updateDisplay();

    const viewMode = getViewMode();

    if (viewMode === "preview") {
      renderPreview();
    } else if (viewMode === "csv") {
      renderCsvPreview();
    }

    saveBackup();
  }

  function renderTabs() {
    const { tabsContainer } = requireDeps();

    tabsContainer.innerHTML = "";

    tabs.forEach((tab) => {
      const tabButton = document.createElement("div");
      tabButton.className = tab.id === activeTabId ? "tab-button active" : "tab-button";
      tabButton.setAttribute("role", "button");
      tabButton.setAttribute("tabindex", "0");

      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tab.fileName;

      const dirty = document.createElement("span");
      dirty.className = "tab-dirty";
      dirty.textContent = tab.isDirty ? "●" : "";

      const closeButton = document.createElement("button");
      closeButton.className = "tab-close-button";
      closeButton.type = "button";
      closeButton.textContent = "×";
      closeButton.setAttribute("aria-label", `${tab.fileName} を閉じる`);

      tabButton.addEventListener("click", () => {
        setActiveTab(tab.id);
      });

      tabButton.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setActiveTab(tab.id);
        }
      });

      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeTab(tab.id);
      });

      tabButton.appendChild(title);
      tabButton.appendChild(dirty);
      tabButton.appendChild(closeButton);

      tabsContainer.appendChild(tabButton);
    });
  }

  function setActiveTabDirty(value) {
    const { updateDisplay } = requireDeps();

    const activeTab = getActiveTab();

    if (!activeTab) {
      return;
    }

    activeTab.isDirty = value;
    activeTab.updatedAt = getNowIsoString();

    updateDisplay();
  }

  function hasDirtyTabs() {
    return tabs.some((tab) => tab.isDirty);
  }

  function restoreTabs(restoredTabs, restoredActiveTabId) {
    const {
      updateEditorFromActiveTab,
      resetSearchPosition,
      updateDisplay
    } = requireDeps();

    tabs = Array.isArray(restoredTabs) ? restoredTabs : [];

    const existsActiveTab = tabs.some((tab) => tab.id === restoredActiveTabId);
    activeTabId = existsActiveTab ? restoredActiveTabId : tabs[0]?.id || null;

    updateEditorFromActiveTab();
    resetSearchPosition();
    updateDisplay();
  }

  window.AppTabs = {
    init,
    getMaxTabs,
    getTabs,
    getActiveTabId,
    getActiveTab,
    canAddTab,
    createTab,
    createEmptyTab,
    ensureAtLeastOneTab,
    setActiveTab,
    closeTab,
    renderTabs,
    setActiveTabDirty,
    hasDirtyTabs,
    restoreTabs
  };
})();

/* TABS_JS_MARKER_TABS_SPLIT_2026_06_07 */