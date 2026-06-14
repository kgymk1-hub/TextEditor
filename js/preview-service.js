(function () {
  const CSV_PREVIEW_MAX_ROWS = 500;

  let deps = null;
  let csvFirstRowHeader = true;
  let linkedPreviewEnabled = false;

  function init(options) {
    deps = options;
  }

  function requireDeps() {
    if (!deps) {
      throw new Error("AppPreviewService is not initialized.");
    }

    return deps;
  }

  function setCsvFirstRowHeader(value) {
    csvFirstRowHeader = value !== false;
  }

  function setLinkedPreviewEnabled(value) {
    linkedPreviewEnabled = value === true;
  }

  function getLinkedPreviewEnabled() {
    return linkedPreviewEnabled;
  }

  function getFileExtension(fileName) {
    const match = String(fileName || "").toLowerCase().match(/\.([^.\/\\]+)$/);
    return match ? match[1] : "";
  }

  function getEmptyPreviewHtml() {
    return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:16px;color:#374151;background:#fff;}</style></head><body><p>プレビューするHTMLがありません。</p></body></html>`;
  }

  function getActiveHtml() {
    const { getActiveTab } = requireDeps();
    const activeTab = getActiveTab();
    return activeTab ? activeTab.text : "";
  }

  function createLinkedPreviewHtml(baseHtml) {
    const { getTabs } = requireDeps();
    const tabs = getTabs();
    const cssText = tabs
      .filter((tab) => getFileExtension(tab.fileName) === "css")
      .map((tab) => `\n/* ${tab.fileName} */\n${tab.text || ""}`)
      .join("\n");
    const jsText = tabs
      .filter((tab) => getFileExtension(tab.fileName) === "js")
      .map((tab) => `\n// ${tab.fileName}\n${tab.text || ""}`)
      .join("\n");

    let html = baseHtml || getEmptyPreviewHtml();

    if (cssText) {
      const styleBlock = `<style data-pocket-linked-preview>\n${cssText}\n</style>`;
      html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${styleBlock}\n</head>`) : `${styleBlock}\n${html}`;
    }

    if (jsText) {
      const scriptBlock = `<script data-pocket-linked-preview>\n${jsText.replaceAll("</script", "<\\/script")}\n</script>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptBlock}\n</body>`) : `${html}\n${scriptBlock}`;
    }

    return html;
  }

  function renderPreview() {
    const { previewFrame, getActiveTab, syncEditorToActiveTab } = requireDeps();

    syncEditorToActiveTab();

    const activeTab = getActiveTab();
    const html = getActiveHtml();
    const isHtmlTab = activeTab && ["html", "htm", ""].includes(getFileExtension(activeTab.fileName));
    const shouldLink = linkedPreviewEnabled && isHtmlTab;

    previewFrame.setAttribute("sandbox", shouldLink ? "allow-scripts" : "");
    previewFrame.srcdoc = shouldLink ? createLinkedPreviewHtml(html) : (html || getEmptyPreviewHtml());
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          index += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    row.push(cell);
    rows.push(row);
    return rows;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getColumnName(index) {
    let name = "";
    let number = index + 1;
    while (number > 0) {
      const remainder = (number - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      number = Math.floor((number - 1) / 26);
    }
    return name;
  }

  function renderCsvPreview() {
    const { csvPreview, getActiveTab, syncEditorToActiveTab } = requireDeps();
    syncEditorToActiveTab();

    const activeTab = getActiveTab();
    const text = activeTab ? activeTab.text : "";

    if (!text.trim()) {
      csvPreview.innerHTML = `<p class="csv-message">CSVとして表示する内容がありません。</p>`;
      return;
    }

    let rows;
    try {
      rows = parseCsv(text);
    } catch (error) {
      console.error(error);
      csvPreview.innerHTML = `<p class="csv-message">CSVとして表示できませんでした。</p>`;
      return;
    }

    const limitedRows = rows.slice(0, CSV_PREVIEW_MAX_ROWS);
    const isLimited = rows.length > CSV_PREVIEW_MAX_ROWS;
    const maxColumns = Math.max(...limitedRows.map((row) => row.length));
    const headerRow = csvFirstRowHeader ? limitedRows[0] || [] : Array.from({ length: maxColumns }, (_, index) => getColumnName(index));
    const bodyRows = csvFirstRowHeader ? limitedRows.slice(1) : limitedRows;

    let html = isLimited ? `<p class="csv-message">先頭${CSV_PREVIEW_MAX_ROWS}行のみ表示しています。</p>` : "";
    html += `<div class="csv-table-wrap"><table class="csv-table"><thead><tr><th class="csv-row-number">#</th>`;

    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
      html += `<th>${escapeHtml(headerRow[columnIndex] ?? "")}</th>`;
    }

    html += `</tr></thead><tbody>`;
    bodyRows.forEach((row, rowIndex) => {
      html += `<tr><td class="csv-row-number">${csvFirstRowHeader ? rowIndex + 2 : rowIndex + 1}</td>`;
      for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
        html += `<td>${escapeHtml(row[columnIndex] ?? "")}</td>`;
      }
      html += `</tr>`;
    });

    csvPreview.innerHTML = `${html}</tbody></table></div>`;
  }

  window.AppPreviewService = {
    init,
    renderPreview,
    renderCsvPreview,
    setCsvFirstRowHeader,
    setLinkedPreviewEnabled,
    getLinkedPreviewEnabled
  };
})();
