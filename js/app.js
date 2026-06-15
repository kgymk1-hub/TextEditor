const app = document.querySelector(".app");

const fileNameLabel = document.getElementById("fileNameLabel");
const dirtyMark = document.getElementById("dirtyMark");
const themeToggleButton = document.getElementById("themeToggleButton");

const tabsContainer = document.getElementById("tabsContainer");
const addTabButton = document.getElementById("addTabButton");

const newButton = document.getElementById("newButton");
const openButton = document.getElementById("openButton");
const saveButton = document.getElementById("saveButton");
const saveAsButton = document.getElementById("saveAsButton");

const toolPanel = document.getElementById("toolPanel");
const searchPanel = document.getElementById("searchPanel");
const encodingPanel = document.getElementById("encodingPanel");
const zipToolPanel = document.getElementById("zipToolPanel");

const toggleSearchPanelButton = document.getElementById("toggleSearchPanelButton");
const toggleEncodingPanelButton = document.getElementById("toggleEncodingPanelButton");
const toggleZipPanelButton = document.getElementById("toggleZipPanelButton");

const openEncodingSelect = document.getElementById("openEncodingSelect");
const saveEncodingSelect = document.getElementById("saveEncodingSelect");

const fileInput = document.getElementById("fileInput");
const zipInput = document.getElementById("zipInput");
const editor = document.getElementById("editor");

const openZipButton = document.getElementById("openZipButton");
const saveZipButton = document.getElementById("saveZipButton");
const zipPanel = document.getElementById("zipPanel");
const zipFileNameLabel = document.getElementById("zipFileNameLabel");
const zipFileList = document.getElementById("zipFileList");
const closeZipPanelButton = document.getElementById("closeZipPanelButton");
const extractAllZipButton = document.getElementById("extractAllZipButton");

const previewFrame = document.getElementById("previewFrame");
const csvPreview = document.getElementById("csvPreview");

const editModeButton = document.getElementById("editModeButton");
const previewModeButton = document.getElementById("previewModeButton");
const csvModeButton = document.getElementById("csvModeButton");
const refreshPreviewButton = document.getElementById("refreshPreviewButton");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const replaceInput = document.getElementById("replaceInput");
const replaceButton = document.getElementById("replaceButton");
const replaceAllButton = document.getElementById("replaceAllButton");

const saveStatus = document.getElementById("saveStatus");
const charCount = document.getElementById("charCount");
const lineCount = document.getElementById("lineCount");
const encodingLabel = document.getElementById("encodingLabel");
const csvHeaderCheckbox = document.getElementById("csvHeaderCheckbox");
const linkedPreviewCheckbox = document.getElementById("linkedPreviewCheckbox");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const wordWrapCheckbox = document.getElementById("wordWrapCheckbox");
const maxTabsSelect = document.getElementById("maxTabsSelect");

let viewMode = "edit";
let toolPanelMode = "none";

function getNowIsoString() {
  return new Date().toISOString();
}

function getTabs() {
  return AppTabs.getTabs();
}

function getActiveTab() {
  return AppTabs.getActiveTab();
}

function getViewMode() {
  return viewMode;
}

function focusEditor() {
  editor.focus();
}

function canAddTab() {
  return AppTabs.canAddTab();
}

function createTab(options = {}) {
  return AppTabs.createTab(options);
}

function createEmptyTab(options = {}) {
  return AppTabs.createEmptyTab(options);
}

function ensureAtLeastOneTab() {
  AppTabs.ensureAtLeastOneTab();
}

function setActiveTabDirty(value) {
  AppTabs.setActiveTabDirty(value);
}

function hasDirtyTabs() {
  return AppTabs.hasDirtyTabs();
}

function syncEditorToActiveTab() {
  AppEditor.syncEditorToActiveTab();
}

function updateEditorFromActiveTab() {
  AppEditor.updateEditorFromActiveTab();
}

function resetSearchPosition() {
  AppEditor.resetSearchPosition();
}

function updateToolPanelDisplay() {
  const isOpen = toolPanelMode !== "none";

  toolPanel.hidden = !isOpen;

  toolPanel.classList.toggle("search-mode", toolPanelMode === "search");
  toolPanel.classList.toggle("encoding-mode", toolPanelMode === "encoding");
  toolPanel.classList.toggle("zip-mode", toolPanelMode === "zip");

  toggleSearchPanelButton.classList.toggle("active", toolPanelMode === "search");
  toggleEncodingPanelButton.classList.toggle("active", toolPanelMode === "encoding");
  toggleZipPanelButton.classList.toggle("active", toolPanelMode === "zip");

  if (toolPanelMode === "search") {
    searchInput.focus();
  }
}

function setToolPanelMode(mode, options = {}) {
  if (
    mode !== "none" &&
    mode !== "search" &&
    mode !== "encoding" &&
    mode !== "zip"
  ) {
    return;
  }

  if (options.force === true) {
    toolPanelMode = mode;
  } else if (toolPanelMode === mode) {
    toolPanelMode = "none";
  } else {
    toolPanelMode = mode;
  }

  updateToolPanelDisplay();
}

function getEncodingLabel(encoding) {
  if (encoding === "shift_jis") {
    return "Shift_JIS";
  }

  return "UTF-8";
}

function updateDisplay() {
  const activeTab = getActiveTab();

  if (!activeTab) {
    fileNameLabel.textContent = "無題";
    dirtyMark.textContent = "";
    saveStatus.textContent = "保存済み";
    charCount.textContent = "文字数: 0";
    lineCount.textContent = "行数: 1";
    encodingLabel.textContent = "UTF-8";
    AppTabs.renderTabs();
    return;
  }

  fileNameLabel.textContent = activeTab.fileName;
  dirtyMark.textContent = activeTab.isDirty ? "●" : "";

  const dirtyCount = getTabs().filter((tab) => tab.isDirty).length;

  if (dirtyCount === 0) {
    saveStatus.textContent = "保存済み";
  } else if (dirtyCount === 1 && activeTab.isDirty) {
    saveStatus.textContent = "未保存";
  } else {
    saveStatus.textContent = `未保存 ${dirtyCount}件`;
  }

  const text = editor.value;
  const chars = text.length;
  const lines = text === "" ? 1 : text.split("\n").length;

  charCount.textContent = `文字数: ${chars}`;
  lineCount.textContent = `行数: ${lines}`;
  encodingLabel.textContent = getEncodingLabel(activeTab.encoding);

  AppTabs.renderTabs();
}

function makeBackupTabs() {
  syncEditorToActiveTab();

  return getTabs().map((tab) => ({
    id: tab.id,
    fileName: tab.fileName,
    text: tab.text,
    encoding: tab.encoding || "utf-8",
    isDirty: tab.isDirty,
    saveTarget: null,
    createdAt: tab.createdAt,
    updatedAt: tab.updatedAt
  }));
}

let backupTimer = null;

function saveBackup() {
  const backupData = {
    tabs: makeBackupTabs(),
    activeTabId: AppTabs.getActiveTabId(),
    savedAt: getNowIsoString()
  };

  AppStorage.saveTabsBackup(backupData);
}

function scheduleBackup() {
  window.clearTimeout(backupTimer);

  backupTimer = window.setTimeout(() => {
    backupTimer = null;
    saveBackup();
  }, 500);
}

function restoreBackupIfNeeded() {
  const backupData = AppStorage.loadTabsBackup();

  if (
    !backupData ||
    !Array.isArray(backupData.tabs) ||
    backupData.tabs.length === 0
  ) {
    return false;
  }

  const hasTextOrDirtyTab = backupData.tabs.some(
    (tab) => tab.text || tab.isDirty
  );

  if (!hasTextOrDirtyTab) {
    return false;
  }

  const confirmed = window.confirm(
    "前回の自動バックアップが見つかりました。復元しますか？"
  );

  if (!confirmed) {
    return false;
  }

  const maxTabs = AppTabs.getMaxTabs();

  const restoredTabs = backupData.tabs.slice(0, maxTabs).map((tab) => ({
    id: tab.id || `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: tab.fileName || "無題",
    text: tab.text || "",
    encoding: tab.encoding || "utf-8",
    isDirty: Boolean(tab.isDirty),
    saveTarget: null,
    createdAt: tab.createdAt || getNowIsoString(),
    updatedAt: tab.updatedAt || getNowIsoString()
  }));

  AppTabs.restoreTabs(restoredTabs, backupData.activeTabId);

  return true;
}

function renderPreview() {
  AppPreviewService.renderPreview();
}

function renderCsvPreview() {
  AppPreviewService.renderCsvPreview();
}

function updateViewModeButtons() {
  editModeButton.classList.toggle("active", viewMode === "edit");
  previewModeButton.classList.toggle("active", viewMode === "preview");
  csvModeButton.classList.toggle("active", viewMode === "csv");
}

function setViewMode(mode) {
  if (mode !== "edit" && mode !== "preview" && mode !== "csv") {
    return;
  }

  viewMode = mode;

  app.classList.toggle("preview-mode", viewMode === "preview");
  app.classList.toggle("csv-mode", viewMode === "csv");

  if (viewMode === "preview") {
    syncEditorToActiveTab();
    renderPreview();
  }

  if (viewMode === "csv") {
    syncEditorToActiveTab();
    renderCsvPreview();
  }

  updateViewModeButtons();

  if (viewMode === "edit") {
    focusEditor();
  }
}

function createNewDocument() {
  createEmptyTab();
  focusEditor();
}

function handleBeforeUnload(event) {
  syncEditorToActiveTab();

  if (!hasDirtyTabs()) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
}

function applyTheme(theme) {
  const isDarkMode = theme === "dark";

  document.body.classList.toggle("dark-mode", isDarkMode);
  themeToggleButton.textContent = isDarkMode ? "明" : "暗";
  themeToggleButton.setAttribute(
    "aria-label",
    isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"
  );
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("dark-mode")
    ? "dark"
    : "light";

  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);
  AppStorage.saveTheme(nextTheme);
}

function saveCurrentEncodingSettings() {
  const settings = {
    openEncoding: openEncodingSelect.value,
    saveEncoding: saveEncodingSelect.value
  };

  AppStorage.saveEncodingSettings(settings);
}

function applyEncodingSettings() {
  const settings = AppStorage.loadEncodingSettings();

  openEncodingSelect.value = settings.openEncoding;
  saveEncodingSelect.value = settings.saveEncoding;
}

function loadAppSettings() {
  return AppStorage.loadAppSettings();
}

function applyEditorSettings(settings) {
  editor.style.fontSize = `${settings.fontSize}px`;
  editor.classList.toggle("no-wrap", settings.wordWrap === false);
}

function applyAppSettings(settings) {
  csvHeaderCheckbox.checked = settings.csvFirstRowHeader !== false;
  linkedPreviewCheckbox.checked = settings.linkedPreviewEnabled === true;
  fontSizeSelect.value = String(settings.fontSize || 15);
  wordWrapCheckbox.checked = settings.wordWrap !== false;
  maxTabsSelect.value = String(settings.maxTabs || 5);

  AppPreviewService.setCsvFirstRowHeader(settings.csvFirstRowHeader);
  AppPreviewService.setLinkedPreviewEnabled(settings.linkedPreviewEnabled);
  AppTabs.setMaxTabs(settings.maxTabs);
  applyEditorSettings(settings);
}

function saveCurrentAppSettings() {
  const settings = {
    csvFirstRowHeader: csvHeaderCheckbox.checked,
    linkedPreviewEnabled: linkedPreviewCheckbox.checked,
    fontSize: Number(fontSizeSelect.value) || 15,
    wordWrap: wordWrapCheckbox.checked,
    maxTabs: Number(maxTabsSelect.value) || 5
  };

  if (settings.maxTabs < getTabs().length) {
    window.alert(`現在${getTabs().length}個のタブがあるため、上限を${settings.maxTabs}に下げられません。`);
    maxTabsSelect.value = String(AppTabs.getMaxTabs());
    return;
  }

  AppPreviewService.setCsvFirstRowHeader(settings.csvFirstRowHeader);
  AppPreviewService.setLinkedPreviewEnabled(settings.linkedPreviewEnabled);
  AppTabs.setMaxTabs(settings.maxTabs);
  applyEditorSettings(settings);
  AppStorage.saveAppSettings(settings);

  if (viewMode === "preview") {
    renderPreview();
  } else if (viewMode === "csv") {
    renderCsvPreview();
  }
}

function registerServiceWorker() {
  if (!AppEnv.canRegisterServiceWorker) {
    console.info("Service Workerはこの環境では登録されません。");
    return;
  }

  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => {
      console.info("Service Workerを登録しました。");
    })
    .catch((error) => {
      console.warn("Service Workerの登録に失敗しました。", error);
    });
}

AppEditor.init({
  editor,
  searchInput,
  replaceInput,
  getActiveTab,
  setActiveTabDirty,
  updateDisplay,
  saveBackup,
  scheduleBackup,
  getViewMode,
  setViewMode,
  focusEditor
});

AppTabs.init({
  tabsContainer,
  editor,
  syncEditorToActiveTab,
  updateEditorFromActiveTab,
  resetSearchPosition,
  updateDisplay,
  saveBackup,
  renderPreview,
  renderCsvPreview,
  getViewMode,
  focusEditor
});

AppPreviewService.init({
  previewFrame,
  csvPreview,
  getActiveTab,
  getTabs,
  syncEditorToActiveTab
});

AppFileService.init({
  fileInput,
  zipInput,
  openEncodingSelect,
  saveEncodingSelect,
  zipPanel,
  zipFileNameLabel,
  zipFileList,
  getActiveTab,
  getTabs,
  getMaxTabs: AppTabs.getMaxTabs,
  canAddTab,
  createTab,
  syncEditorToActiveTab,
  updateDisplay,
  saveBackup,
  renderPreview,
  renderCsvPreview,
  getViewMode,
  focusEditor,
  setToolPanelMode,
  updateToolPanelDisplay
});

function initializeApp() {
  applyTheme(AppStorage.loadTheme());
  applyEncodingSettings();
  applyAppSettings(loadAppSettings());

  const restored = restoreBackupIfNeeded();

  if (!restored) {
    createEmptyTab({ skipBackup: true });
  }

  ensureAtLeastOneTab();
  updateEditorFromActiveTab();
  setViewMode("edit");
  updateToolPanelDisplay();
  updateDisplay();
  registerServiceWorker();
}

themeToggleButton.addEventListener("click", toggleTheme);

openEncodingSelect.addEventListener("change", saveCurrentEncodingSettings);
saveEncodingSelect.addEventListener("change", saveCurrentEncodingSettings);
csvHeaderCheckbox.addEventListener("change", saveCurrentAppSettings);
linkedPreviewCheckbox.addEventListener("change", saveCurrentAppSettings);
fontSizeSelect.addEventListener("change", saveCurrentAppSettings);
wordWrapCheckbox.addEventListener("change", saveCurrentAppSettings);
maxTabsSelect.addEventListener("change", saveCurrentAppSettings);

toggleSearchPanelButton.addEventListener("click", () => {
  setToolPanelMode("search");
});

toggleEncodingPanelButton.addEventListener("click", () => {
  setToolPanelMode("encoding");
});

toggleZipPanelButton.addEventListener("click", () => {
  setToolPanelMode("zip");
});

editModeButton.addEventListener("click", () => {
  setViewMode("edit");
});

previewModeButton.addEventListener("click", () => {
  setViewMode("preview");
});

csvModeButton.addEventListener("click", () => {
  setViewMode("csv");
});

refreshPreviewButton.addEventListener("click", () => {
  if (viewMode === "preview") {
    renderPreview();
    return;
  }

  if (viewMode === "csv") {
    renderCsvPreview();
    return;
  }

  setViewMode("preview");
});

newButton.addEventListener("click", createNewDocument);
addTabButton.addEventListener("click", createNewDocument);

openButton.addEventListener("click", AppFileService.openFile);
saveButton.addEventListener("click", AppFileService.saveFile);
saveAsButton.addEventListener("click", AppFileService.saveFileAs);

openZipButton.addEventListener("click", AppFileService.openZipFile);
extractAllZipButton.addEventListener("click", AppFileService.openAllZipEntriesAsTabs);
saveZipButton.addEventListener("click", AppFileService.saveTabsAsZip);
zipInput.addEventListener("change", AppFileService.readSelectedZipFile);
closeZipPanelButton.addEventListener("click", AppFileService.closeZipPanel);

fileInput.addEventListener("change", AppFileService.readSelectedFile);

editor.addEventListener("input", AppEditor.handleEditorInput);

searchButton.addEventListener("click", () => AppEditor.searchNext());
replaceButton.addEventListener("click", AppEditor.replaceOne);
replaceAllButton.addEventListener("click", AppEditor.replaceAll);

searchInput.addEventListener("input", AppEditor.resetSearchPosition);
replaceInput.addEventListener("input", AppEditor.resetSearchPosition);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    AppEditor.searchNext();
  }
});

replaceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    AppEditor.replaceOne();
  }
});

window.addEventListener("beforeunload", handleBeforeUnload);

initializeApp();
