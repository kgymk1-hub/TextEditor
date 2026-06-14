(function () {
  let deps = null;

  let currentZip = null;
  let currentZipFileName = "";
  let currentZipEntries = [];

  const ZIP_OUTPUT_FILE_NAME = "pocket-text-editor-tabs.zip";

  const ZIP_TEXT_EXTENSIONS = [
    ".txt",
    ".csv",
    ".html",
    ".htm",
    ".js",
    ".css",
    ".json",
    ".md"
  ];

  function init(options) {
    deps = options;
  }

  function requireDeps() {
    if (!deps) {
      throw new Error("AppFileService is not initialized.");
    }

    return deps;
  }

  async function readFileAsText(file, encoding) {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder(encoding);
    return decoder.decode(arrayBuffer);
  }

  async function openFile() {
    const {
      fileInput,
      openEncodingSelect,
      canAddTab,
      createTab,
      renderPreview,
      renderCsvPreview,
      getViewMode,
      focusEditor
    } = requireDeps();

    if (!canAddTab()) {
      return;
    }

    if (AppEnv.canUseOpenFilePicker || AppEnv.canUseFileSystemAccess) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Text files",
              accept: {
                "text/plain": [".txt", ".csv", ".html", ".htm", ".js", ".css", ".json", ".md"]
              }
            }
          ]
        });

        const handle = handles[0];
        const file = await handle.getFile();
        const selectedEncoding = openEncodingSelect.value;
        const text = await readFileAsText(file, selectedEncoding);

        createTab({
          fileName: file.name,
          text,
          encoding: selectedEncoding,
          isDirty: false,
          saveTarget: {
            type: "filesystem-access",
            handle,
            name: file.name
          }
        });

        const viewMode = getViewMode();

        if (viewMode === "preview") {
          renderPreview();
        } else if (viewMode === "csv") {
          renderCsvPreview();
        } else {
          focusEditor();
        }

        return;
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.warn(
          "File System Access APIでの読み込みに失敗しました。通常のファイル選択に切り替えます。",
          error
        );
      }
    }

    fileInput.value = "";
    fileInput.click();
  }

  async function readSelectedFile(event) {
    const {
      fileInput,
      openEncodingSelect,
      createTab,
      renderPreview,
      renderCsvPreview,
      getViewMode,
      focusEditor
    } = requireDeps();

    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      const selectedEncoding = openEncodingSelect.value;
      const text = await readFileAsText(file, selectedEncoding);

      createTab({
        fileName: file.name,
        text,
        encoding: selectedEncoding,
        isDirty: false,
        saveTarget: null
      });

      const viewMode = getViewMode();

      if (viewMode === "preview") {
        renderPreview();
      } else if (viewMode === "csv") {
        renderCsvPreview();
      } else {
        focusEditor();
      }
    } catch (error) {
      console.error(error);
      window.alert("ファイルを読み込めませんでした。");
    } finally {
      fileInput.value = "";
    }
  }

  function createOutputTextForSave(text) {
    const { saveEncodingSelect } = requireDeps();

    const saveEncoding = saveEncodingSelect.value;
    return saveEncoding === "utf-8-bom" ? "\uFEFF" + text : text;
  }

  function createTextBlob(text) {
    const outputText = createOutputTextForSave(text);

    return new Blob([outputText], {
      type: "text/plain;charset=utf-8"
    });
  }

  async function writeTextToFileHandle(fileHandle, text) {
    const writable = await fileHandle.createWritable();
    await writable.write(createTextBlob(text));
    await writable.close();
  }

  function hasSaveTarget(tab) {
    return Boolean(
      tab &&
      tab.saveTarget &&
      tab.saveTarget.type
    );
  }

  async function saveToFileSystemAccessTarget(tab) {
    if (
      (!AppEnv.canUseOpenFilePicker && !AppEnv.canUseFileSystemAccess) ||
      !tab.saveTarget ||
      tab.saveTarget.type !== "filesystem-access" ||
      !tab.saveTarget.handle
    ) {
      throw new Error("File System Access API の保存先がありません。");
    }

    await writeTextToFileHandle(tab.saveTarget.handle, tab.text || "");
  }

  async function saveToTarget(tab) {
    if (!hasSaveTarget(tab)) {
      return false;
    }

    if (tab.saveTarget.type === "filesystem-access") {
      await saveToFileSystemAccessTarget(tab);
      return true;
    }

    return false;
  }

  function downloadBlobFile(fileName, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadTextFile(fileName, text) {
    const blob = createTextBlob(text);
    downloadBlobFile(fileName, blob);
  }

  async function saveFile() {
    const {
      getActiveTab,
      syncEditorToActiveTab,
      updateDisplay,
      saveBackup
    } = requireDeps();

    syncEditorToActiveTab();

    const activeTab = getActiveTab();

    if (!activeTab) {
      return;
    }

    if (hasSaveTarget(activeTab)) {
      try {
        const saved = await saveToTarget(activeTab);

        if (saved) {
          activeTab.isDirty = false;
          activeTab.updatedAt = new Date().toISOString();

          updateDisplay();
          saveBackup();
          return;
        }
      } catch (error) {
        console.error(error);
        window.alert("上書き保存に失敗しました。別名保存を試してください。");
        return;
      }
    }

    const suggestedName = getSafeFileName(activeTab);
    downloadTextFile(suggestedName, activeTab.text || "");

    activeTab.isDirty = false;
    activeTab.updatedAt = new Date().toISOString();

    updateDisplay();
    saveBackup();
  }

  function getSafeFileName(tab) {
    if (!tab || !tab.fileName || tab.fileName === "無題") {
      return "pocket-text.txt";
    }

    if (!/\.[^./\\]+$/.test(tab.fileName)) {
      return `${tab.fileName}.txt`;
    }

    return tab.fileName;
  }

  async function saveFileAs() {
    const {
      getActiveTab,
      syncEditorToActiveTab,
      updateDisplay,
      saveBackup
    } = requireDeps();

    syncEditorToActiveTab();

    const activeTab = getActiveTab();

    if (!activeTab) {
      return;
    }

    const text = activeTab.text || "";
    const suggestedName = getSafeFileName(activeTab);

    downloadTextFile(suggestedName, text);

    activeTab.isDirty = false;
    activeTab.updatedAt = new Date().toISOString();

    updateDisplay();
    saveBackup();
  }

  function isJSZipAvailable() {
    return typeof JSZip !== "undefined";
  }

  function ensureJSZipAvailable() {
    if (!isJSZipAvailable()) {
      window.alert("ZIP機能に必要なJSZipが読み込まれていません。");
      return false;
    }

    return true;
  }

  function getLowerFileName(fileName) {
    return fileName.toLowerCase();
  }

  function isZipTextEntry(fileName) {
    const lowerName = getLowerFileName(fileName);

    return ZIP_TEXT_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    );
  }

  function openZipFile() {
    const { zipInput } = requireDeps();

    if (!ensureJSZipAvailable()) {
      return;
    }

    zipInput.value = "";
    zipInput.click();
  }

  async function readSelectedZipFile(event) {
    const { zipInput } = requireDeps();

    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!ensureJSZipAvailable()) {
      zipInput.value = "";
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      currentZip = zip;
      currentZipFileName = file.name;
      currentZipEntries = collectZipEntries(zip);

      renderZipFileList();
    } catch (error) {
      console.error(error);
      window.alert("ZIPファイルを読み込めませんでした。");
    } finally {
      zipInput.value = "";
    }
  }

  function collectZipEntries(zip) {
    const entries = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) {
        return;
      }

      if (!isZipTextEntry(relativePath)) {
        return;
      }

      entries.push({
        path: relativePath,
        entry: zipEntry
      });
    });

    entries.sort((a, b) => a.path.localeCompare(b.path, "ja"));

    return entries;
  }

  function renderZipFileList() {
    const {
      zipPanel,
      zipFileNameLabel,
      zipFileList,
      getTabs,
      getMaxTabs,
      setToolPanelMode
    } = requireDeps();

    setToolPanelMode("zip", { force: true });

    zipPanel.hidden = false;
    zipFileNameLabel.textContent = `ZIP: ${currentZipFileName}`;

    if (!currentZipEntries.length) {
      zipFileList.innerHTML = `<p class="zip-message">開けるテキスト系ファイルがありません。</p>`;
      return;
    }

    zipFileList.innerHTML = "";

    currentZipEntries.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "zip-file-item";

      const path = document.createElement("div");
      path.className = "zip-file-path";
      path.textContent = item.path;
      path.title = item.path;

      const button = document.createElement("button");
      button.className = "zip-file-open-button";
      button.type = "button";
      button.textContent = "開く";

      button.addEventListener("click", () => {
        openZipEntryAsTab(index);
      });

      row.appendChild(path);
      row.appendChild(button);

      zipFileList.appendChild(row);
    });
  }

  async function openZipEntryAsTab(index) {
    const {
      openEncodingSelect,
      canAddTab,
      createTab,
      renderPreview,
      renderCsvPreview,
      getViewMode,
      focusEditor
    } = requireDeps();

    if (!canAddTab()) {
      return;
    }

    const item = currentZipEntries[index];

    if (!item) {
      return;
    }

    try {
      const uint8Array = await item.entry.async("uint8array");
      const selectedEncoding = openEncodingSelect.value;
      const decoder = new TextDecoder(selectedEncoding);
      const text = decoder.decode(uint8Array);

      createTab({
        fileName: item.path,
        text,
        encoding: selectedEncoding,
        isDirty: false,
        saveTarget: null
      });

      const viewMode = getViewMode();

      if (viewMode === "preview") {
        renderPreview();
      } else if (viewMode === "csv") {
        renderCsvPreview();
      } else {
        focusEditor();
      }
    } catch (error) {
      console.error(error);
      window.alert("ZIP内ファイルを開けませんでした。");
    }
  }

  async function openAllZipEntriesAsTabs() {
    const {
      openEncodingSelect,
      getTabs,
      getMaxTabs,
      createTab,
      renderPreview,
      renderCsvPreview,
      getViewMode,
      focusEditor
    } = requireDeps();

    if (!currentZipEntries.length) {
      window.alert("一括展開できるテキスト系ファイルがありません。");
      return;
    }

    const availableCount = getMaxTabs() - getTabs().length;

    if (currentZipEntries.length > availableCount) {
      window.alert(`タブ上限を超えるため一括展開できません。空き: ${availableCount} / 対象: ${currentZipEntries.length}`);
      return;
    }

    const selectedEncoding = openEncodingSelect.value;

    try {
      for (const item of currentZipEntries) {
        const uint8Array = await item.entry.async("uint8array");
        const decoder = new TextDecoder(selectedEncoding);
        const text = decoder.decode(uint8Array);

        createTab({
          fileName: item.path,
          text,
          encoding: selectedEncoding,
          isDirty: false,
          saveTarget: null
        });
      }

      const viewMode = getViewMode();

      if (viewMode === "preview") {
        renderPreview();
      } else if (viewMode === "csv") {
        renderCsvPreview();
      } else {
        focusEditor();
      }
    } catch (error) {
      console.error(error);
      window.alert("ZIP内ファイルの一括展開に失敗しました。");
    }
  }

  function closeZipPanel() {
    const {
      zipPanel,
      zipFileList,
      zipFileNameLabel
    } = requireDeps();

    zipPanel.hidden = true;
    zipFileList.innerHTML = "";
    zipFileNameLabel.textContent = "ZIP:";

    currentZip = null;
    currentZipFileName = "";
    currentZipEntries = [];
  }

  function normalizeZipFileName(fileName, fallbackName) {
    let name = fileName || fallbackName;

    if (!name || name === "無題") {
      name = fallbackName;
    }

    name = name.replaceAll("\\", "/");
    name = name.replace(/^\/+/, "");
    name = name.replaceAll("../", "");
    name = name.replaceAll("..", "");

    if (!/\.[^./]+$/.test(name)) {
      name += ".txt";
    }

    return name;
  }

  function splitFileName(fileName) {
    const lastSlashIndex = fileName.lastIndexOf("/");
    const directory = lastSlashIndex >= 0 ? fileName.slice(0, lastSlashIndex + 1) : "";
    const baseName = lastSlashIndex >= 0 ? fileName.slice(lastSlashIndex + 1) : fileName;

    const dotIndex = baseName.lastIndexOf(".");

    if (dotIndex <= 0) {
      return {
        directory,
        name: baseName,
        extension: ""
      };
    }

    return {
      directory,
      name: baseName.slice(0, dotIndex),
      extension: baseName.slice(dotIndex)
    };
  }

  function getUniqueZipFileName(fileName, usedNames) {
    if (!usedNames.has(fileName)) {
      usedNames.add(fileName);
      return fileName;
    }

    const parts = splitFileName(fileName);
    let count = 2;

    while (true) {
      const candidate = `${parts.directory}${parts.name}-${count}${parts.extension}`;

      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }

      count += 1;
    }
  }

  async function saveTabsAsZip() {
    const {
      getTabs,
      syncEditorToActiveTab
    } = requireDeps();

    if (!ensureJSZipAvailable()) {
      return;
    }

    syncEditorToActiveTab();

    const tabs = getTabs();

    if (!tabs.length) {
      window.alert("ZIP保存するタブがありません。");
      return;
    }

    try {
      const zip = new JSZip();
      const usedNames = new Set();

      tabs.forEach((tab, index) => {
        const fallbackName = `untitled-${index + 1}.txt`;
        const normalizedName = normalizeZipFileName(tab.fileName, fallbackName);
        const uniqueName = getUniqueZipFileName(normalizedName, usedNames);
        const outputText = createOutputTextForSave(tab.text || "");

        zip.file(uniqueName, outputText);
      });

      const blob = await zip.generateAsync({
        type: "blob"
      });

      downloadBlobFile(ZIP_OUTPUT_FILE_NAME, blob);
    } catch (error) {
      console.error(error);
      window.alert("ZIP保存に失敗しました。");
    }
  }

  window.AppFileService = {
    init,
    openFile,
    readSelectedFile,
    saveFile,
    saveFileAs,
    openZipFile,
    readSelectedZipFile,
    saveTabsAsZip,
    openAllZipEntriesAsTabs,
    closeZipPanel
  };
})();

/* FILE_SERVICE_JS_MARKER_FILE_SERVICE_SPLIT_2026_06_07 */