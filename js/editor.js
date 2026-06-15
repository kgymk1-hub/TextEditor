(function () {
  let deps = null;

  let lastSearchKeyword = "";
  let lastSearchIndex = 0;

  function init(options) {
    deps = options;
  }

  function requireDeps() {
    if (!deps) {
      throw new Error("AppEditor is not initialized.");
    }

    return deps;
  }

  function getNowIsoString() {
    return new Date().toISOString();
  }

  function syncEditorToActiveTab() {
    const {
      editor,
      getActiveTab
    } = requireDeps();

    const activeTab = getActiveTab();

    if (!activeTab) {
      return;
    }

    activeTab.text = editor.value;
    activeTab.updatedAt = getNowIsoString();
  }

  function updateEditorFromActiveTab() {
    const {
      editor,
      getActiveTab
    } = requireDeps();

    const activeTab = getActiveTab();

    if (!activeTab) {
      editor.value = "";
      return;
    }

    editor.value = activeTab.text;
  }

  function resetSearchPosition() {
    lastSearchKeyword = "";
    lastSearchIndex = 0;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function ensureEditMode() {
    const {
      getViewMode,
      setViewMode
    } = requireDeps();

    if (getViewMode() !== "edit") {
      setViewMode("edit");
    }
  }

  function searchNext(showNotFoundMessage = true) {
    const {
      editor,
      searchInput,
      focusEditor
    } = requireDeps();

    ensureEditMode();

    const keyword = searchInput.value;
    const text = editor.value;

    if (!keyword) {
      if (showNotFoundMessage) {
        window.alert("検索キーワードを入力してください。");
        searchInput.focus();
      }

      return false;
    }

    if (!text) {
      if (showNotFoundMessage) {
        window.alert("本文が空です。");
        focusEditor();
      }

      return false;
    }

    if (keyword !== lastSearchKeyword) {
      lastSearchKeyword = keyword;
      lastSearchIndex = 0;
    }

    let foundIndex = text.indexOf(keyword, lastSearchIndex);

    if (foundIndex === -1 && lastSearchIndex > 0) {
      foundIndex = text.indexOf(keyword, 0);
    }

    if (foundIndex === -1) {
      if (showNotFoundMessage) {
        window.alert("一致する文字列が見つかりませんでした。");
      }

      lastSearchIndex = 0;
      focusEditor();
      return false;
    }

    const foundEnd = foundIndex + keyword.length;

    focusEditor();
    editor.setSelectionRange(foundIndex, foundEnd);

    lastSearchIndex = foundEnd;
    return true;
  }

  function replaceOne() {
    const {
      editor,
      searchInput,
      replaceInput,
      setActiveTabDirty,
      saveBackup,
      focusEditor
    } = requireDeps();

    ensureEditMode();

    const keyword = searchInput.value;
    const replacement = replaceInput.value;

    if (!keyword) {
      window.alert("検索キーワードを入力してください。");
      searchInput.focus();
      return;
    }

    const text = editor.value;
    const selectionStart = editor.selectionStart;
    const selectionEnd = editor.selectionEnd;
    const selectedText = text.slice(selectionStart, selectionEnd);

    if (selectedText !== keyword) {
      const found = searchNext();

      if (!found) {
        return;
      }

      return;
    }

    const before = text.slice(0, selectionStart);
    const after = text.slice(selectionEnd);

    editor.value = before + replacement + after;

    const newCursorPosition = selectionStart + replacement.length;

    focusEditor();
    editor.setSelectionRange(newCursorPosition, newCursorPosition);

    lastSearchIndex = newCursorPosition;

    syncEditorToActiveTab();
    setActiveTabDirty(true);
    saveBackup();

    searchNext(false);
  }

  function replaceAll() {
    const {
      editor,
      searchInput,
      replaceInput,
      setActiveTabDirty,
      saveBackup,
      focusEditor
    } = requireDeps();

    ensureEditMode();

    const keyword = searchInput.value;
    const replacement = replaceInput.value;
    const text = editor.value;

    if (!keyword) {
      window.alert("検索キーワードを入力してください。");
      searchInput.focus();
      return;
    }

    if (!text.includes(keyword)) {
      window.alert("一致する文字列が見つかりませんでした。");
      focusEditor();
      return;
    }

    const regex = new RegExp(escapeRegExp(keyword), "g");
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;

    const confirmed = window.confirm(
      `${count}件の文字列をすべて置換します。よろしいですか？`
    );

    if (!confirmed) {
      return;
    }

    editor.value = text.replace(regex, () => replacement);

    resetSearchPosition();

    syncEditorToActiveTab();
    setActiveTabDirty(true);
    saveBackup();

    window.alert(`${count}件置換しました。`);
    focusEditor();
  }

  function insertTextAtCursor(text) {
    const {
      editor,
      focusEditor
    } = requireDeps();

    const selectionStart = editor.selectionStart;
    const selectionEnd = editor.selectionEnd;
    const before = editor.value.slice(0, selectionStart);
    const after = editor.value.slice(selectionEnd);

    editor.value = before + text + after;

    const nextCursorPosition = selectionStart + text.length;

    focusEditor();
    editor.setSelectionRange(nextCursorPosition, nextCursorPosition);
    handleEditorInput();
  }

  function handleEditorInput() {
    const {
      editor,
      getActiveTab,
      updateDisplay,
      scheduleBackup
    } = requireDeps();

    const activeTab = getActiveTab();

    if (!activeTab) {
      return;
    }

    activeTab.text = editor.value;
    activeTab.isDirty = true;
    activeTab.updatedAt = getNowIsoString();

    resetSearchPosition();
    updateDisplay();
    scheduleBackup();
  }

  window.AppEditor = {
    init,
    syncEditorToActiveTab,
    updateEditorFromActiveTab,
    resetSearchPosition,
    searchNext,
    replaceOne,
    replaceAll,
    insertTextAtCursor,
    handleEditorInput
  };
})();
