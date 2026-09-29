// Clés alignées sur src/features/registry.js. Le nœud est aussi écrit par src/bridge.js.
const SETTINGS_NODE_ID = "betterxwiki-settings";
const SETTINGS_EVENT = "betterxwiki-settings";
const DEFAULT_SETTINGS = {
  appleTheme: true,
  draculaTheme: false,
  tableRows: true,
  tableColumns: true,
  tableDelete: true,
  tableDuplicate: true,
  tableMove: true,
  tableCellColors: true,
  tableBandColors: true,
  tableMerge: true,
  tableShortcuts: true,
  alertBlocks: true,
  macroShortcuts: true,
  tablePasteClean: true,
  editorFullscreen: true,
  editorOutline: true,
  stickyHeaders: true,
  copyTableTsv: true,
  pageSearch: true,
  restoreReadPosition: true,
};
const TABLE_TOOLBAR_FEATURES = [
  "tableRows",
  "tableColumns",
  "tableDelete",
  "tableDuplicate",
  "tableMove",
  "tableCellColors",
  "tableBandColors",
  "tableMerge",
];
const COLORS = [
  { label: "Vert", value: "#d4edda" },
  { label: "Jaune", value: "#fff3cd" },
  { label: "Bleu", value: "#cfe2ff" },
  { label: "Rouge", value: "#f8d7da" },
  { label: "Orange", value: "#ffe8cc" },
];
const MACROS = {
  info: { name: "info", content: "" },
  success: { name: "success", content: "" },
  warning: { name: "warning", content: "" },
  error: { name: "error", content: "" },
  code: { name: "code", content: "", parameters: { language: "none" } },
  toc: { name: "toc" },
};
const BOX_CLASS = {
  info: "infomessage",
  success: "successmessage",
  warning: "warningmessage",
  error: "errormessage",
};
const SHORTCUTS = {
  ArrowUp: "rowInsertBefore",
  ArrowDown: "rowInsertAfter",
  ArrowLeft: "columnInsertBefore",
  ArrowRight: "columnInsertAfter",
};
const SCROLL_KEY = "betterxwiki-read-scroll";
const RETURN_KEY = "betterxwiki-return-to";

const ICONS = {
  rowBefore: icon("M3.5 9.5h13M3.5 13h13M3.5 16.5h13", "M10 2.5v4M8 4.5h4"),
  rowAfter: icon("M3.5 3.5h13M3.5 7h13M3.5 10.5h13", "M10 13.5v4M8 15.5h4"),
  colBefore: icon("M9.5 3.5v13M13 3.5v13M16.5 3.5v13", "M2.5 10h4M4.5 8v4"),
  colAfter: icon("M3.5 3.5v13M7 3.5v13M10.5 3.5v13", "M13.5 10h4M15.5 8v4"),
  deleteRow: icon("M4 5.5h12M6 5.5l.6 10h6.8l.6-10", "M8 5.2V4h4v1.2"),
  deleteCol: icon("M5.5 4v12M5.5 6l10 .6v6.8l-10 .6", "M5.2 8H4v4h1.2"),
  duplicateRow: icon("M6 7.5h8M6 10.5h8M6 13.5h8", "M4 4.5h8v3"),
  duplicateCol: icon("M7.5 6v8M10.5 6v8M13.5 6v8", "M4.5 4v8h3"),
  moveUp: icon("M10 15.5V5", "M6.5 8.5 10 4.5l3.5 4"),
  moveDown: icon("M10 4.5v10.5", "M6.5 11.5 10 15.5l3.5-4"),
  moveLeft: icon("M15.5 10H5", "M8.5 6.5 4.5 10l4 3.5"),
  moveRight: icon("M4.5 10h10.5", "M11.5 6.5 15.5 10l-4 3.5"),
  mergeRight: icon("M4 5.5h5.5v9H4zM10.5 8H16", "M13.5 6l2.5 2-2.5 2"),
  mergeDown: icon("M5.5 4v5.5h9V4zM8 10.5V16", "M6 13.5l2 2.5 2-2.5"),
  splitH: icon("M4 5h12v10H4z", "M10 5v10"),
  splitV: icon("M4 5h12v10H4z", "M4 10h12"),
  colorRow: icon("M4 7h12v6H4z", "M4 10h12"),
  colorCol: icon("M7 4h6v12H7z", "M10 4v12"),
  clear: icon("M10 3.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5", "M6.2 13.8 13.8 6.2", "#c0392b"),
  fullscreen: icon("M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4", ""),
  search: icon("M8.5 8.5a3.5 3.5 0 1 1 0 .01", "M11.2 11.2 15 15"),
  code: icon("M7.5 7 4.5 10l3 3M12.5 7l3 3-3 3", ""),
  toc: icon("M6 5.5h8M6 10h8M6 14.5h5", "M4 5.5h.01M4 10h.01M4 14.5h.01"),
};

let settings = { ...DEFAULT_SETTINGS };
let settingsReady = false;
let activeEditor = null;
let updateFrame = 0;
let lastColor = COLORS[0].value;
let scrollTimer = 0;
let matches = [];
let matchIndex = 0;
const attached = new WeakSet();
const scrollBound = new WeakSet();

let toolbar;
let editorBar;
let outline;
let findBar;
let searchButton;
let copyButton;

if (window.XWiki && document.body) {
  toolbar = buildToolbar();
  editorBar = buildEditorBar();
  outline = buildOutline();
  findBar = buildFindBar();
  searchButton = buildSearchButton();
  copyButton = buildCopyButton();
  mount();
}

function mount() {
  document.body.append(toolbar, editorBar, outline, findBar, searchButton, copyButton);
  toolbar.addEventListener("mousedown", keepEditorFocus);
  editorBar.addEventListener("mousedown", keepEditorFocus);
  outline.addEventListener("mousedown", keepEditorFocus);
  toolbar.addEventListener("click", onToolbarClick);
  editorBar.addEventListener("click", onEditorBarClick);
  outline.addEventListener("click", onOutlineClick);
  findBar.addEventListener("click", onFindClick);
  searchButton.addEventListener("click", openSearch);
  copyButton.addEventListener("click", copyActiveTable);
  findBar.querySelector("input").addEventListener("input", () => runSearch(0));
  findBar.querySelector("input").addEventListener("keydown", onFindKey);

  window.addEventListener("scroll", onWindowScroll, true);
  window.addEventListener("resize", () => scheduleUpdate(activeEditor));
  window.addEventListener("keydown", onWindowKey, true);
  document.addEventListener(SETTINGS_EVENT, applyPublishedSettings);
  document.addEventListener("mouseover", showCopyButton);
  document.addEventListener("mouseout", hideCopyButtonOnLeave);
  document.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(rememberScroll, 200);
  }, { passive: true });
  window.addEventListener("pagehide", rememberScroll);

  applyPublishedSettings();
  setTimeout(() => {
    if (!settingsReady) {
      settingsReady = true;
      refreshAll();
    }
  }, 1500);
  waitForEditor();
}

function keepEditorFocus(event) {
  if (event.target.closest("input, textarea")) return;
  event.preventDefault();
  event.stopPropagation();
}

function enabled(id) {
  return settings[id] !== false;
}

function applyPublishedSettings() {
  const node = document.getElementById(SETTINGS_NODE_ID);
  if (!node?.textContent) return;
  try {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(node.textContent) };
  } catch {
    return;
  }
  settingsReady = true;
  refreshAll();
}

function refreshAll() {
  syncGroups(toolbar);
  syncGroups(editorBar);
  scheduleUpdate(activeEditor);
  syncViewFeatures();
  armReturn();
  restoreScroll();
  if (!enabled("pageSearch")) closeSearch();
}

function waitForEditor() {
  if (window.CKEDITOR) {
    watchEditors(window.CKEDITOR);
    return;
  }
  const timer = setInterval(() => {
    if (!window.CKEDITOR) return;
    clearInterval(timer);
    watchEditors(window.CKEDITOR);
  }, 500);
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
}

function watchEditors(CKEDITOR) {
  CKEDITOR.on("instanceReady", (event) => attachEditor(event.editor));
  for (const editor of Object.values(CKEDITOR.instances || {})) {
    if (editor.status === "ready") attachEditor(editor);
  }
}

function attachEditor(editor) {
  if (attached.has(editor)) return;
  attached.add(editor);
  const refresh = () => scheduleUpdate(editor);
  editor.on("selectionChange", refresh);
  editor.on("change", refresh);
  editor.on("afterCommandExec", refresh);
  editor.on("mode", refresh);
  editor.on("paste", onPaste, null, null, 1);
  editor.on("focus", () => {
    activeEditor = editor;
    refresh();
  });
  editor.on("blur", () => {
    setTimeout(() => {
      if (activeEditor !== editor) return;
      if (editor.focusManager?.hasFocus) return;
      if (!editor.container?.$.classList.contains("bx-fullscreen")) hideToolbar();
      scheduleUpdate(editor);
    }, 50);
  });
  editor.on("contentDom", () => {
    bindEditorScroll(editor);
    bindShortcuts(editor);
    ensureHighlightStyle(editor.document.$);
    syncEditorTheme(editor);
  });
  editor.on("destroy", () => {
    editor.container?.$.classList.remove("bx-fullscreen");
    if (activeEditor === editor) {
      activeEditor = null;
      hideToolbar();
      hideEditorChrome();
    }
  });
  bindEditorScroll(editor);
  bindShortcuts(editor);
  if (window.ResizeObserver && editor.container) {
    const observer = new ResizeObserver(refresh);
    observer.observe(editor.container.$);
    editor.on("destroy", () => observer.disconnect());
  }
  if (editor.focusManager?.hasFocus) {
    activeEditor = editor;
    refresh();
  }
}

function bindEditorScroll(editor) {
  const target = editor.document;
  if (!target || scrollBound.has(target)) return;
  scrollBound.add(target);
  target.on("scroll", () => scheduleUpdate(editor));
  editor.window?.on("scroll", () => scheduleUpdate(editor));
}

function bindShortcuts(editor) {
  const editable = editor.editable();
  if (!editable || editable._bxKeys) return;
  editable._bxKeys = true;
  editable.attachListener(editable, "keydown", (evt) => onShortcut(editor, evt), null, null, 1);
}

function onShortcut(editor, evt) {
  if (!enabled("tableShortcuts")) return;
  const native = evt.data.$;
  if (!native.altKey || !native.shiftKey || native.metaKey || native.ctrlKey || native.repeat) return;
  if (window.CKEDITOR.dialog?.getCurrent?.()) return;
  const command = SHORTCUTS[native.key];
  if (!command || !collectCells(editor).length) return;
  if (command.startsWith("row") && !enabled("tableRows")) return;
  if (command.startsWith("column") && !enabled("tableColumns")) return;
  native.preventDefault();
  evt.cancel();
  editor.execCommand(command);
}

function scheduleUpdate(editor) {
  if (editor) activeEditor = editor;
  cancelAnimationFrame(updateFrame);
  updateFrame = requestAnimationFrame(() => {
    updateToolbar();
    updateEditorChrome();
  });
}

function updateToolbar() {
  const editor = activeEditor;
  syncGroups(toolbar);
  if (!settingsReady || !editor || editor.status === "destroyed" || editor.readOnly || editor.mode !== "wysiwyg" || !toolbarHasFeature()) {
    hideToolbar();
    return;
  }
  const cells = collectCells(editor);
  const table = cells[0]?.getAscendant("table", true);
  if (!table) {
    hideToolbar();
    return;
  }
  const rect = viewportRect(editor, table);
  if (rect.width === 0 && rect.height === 0) {
    hideToolbar();
    return;
  }
  const wasHidden = toolbar.hidden;
  toolbar.hidden = false;
  if (wasHidden) toolbar.style.visibility = "hidden";
  placeFloating(toolbar, rect, "above");
  if (wasHidden) toolbar.style.visibility = "visible";
  syncCommands(editor);
  syncActions(cells);
  syncSwatches(cells);
  syncShortcutTitles();
}

function hideToolbar() {
  toolbar.hidden = true;
  toolbar.style.visibility = "";
}

function toolbarHasFeature() {
  return TABLE_TOOLBAR_FEATURES.some(enabled);
}

function syncGroups(root) {
  let firstVisible = true;
  for (const group of root.querySelectorAll("[data-feature]")) {
    const on = enabled(group.dataset.feature);
    group.hidden = !on;
    group.classList.toggle("is-separated", on && !firstVisible);
    if (on) firstVisible = false;
  }
}

function syncCommands(editor) {
  const disabled = window.CKEDITOR.TRISTATE_DISABLED;
  for (const button of toolbar.querySelectorAll("[data-command]")) {
    const command = editor.getCommand(button.dataset.command);
    button.disabled = !command || command.state === disabled;
  }
}

function syncActions(cells) {
  const cell = cells[0];
  const row = cell?.getAscendant("tr", true);
  const table = cell?.getAscendant("table", true);
  const spanned = table ? hasSpans(table) : true;
  const column = cell ? visualColumn(cell) : 0;
  const columns = table ? columnCount(table) : 0;
  const flags = {
    duplicateRow: !row,
    duplicateColumn: !cell || spanned,
    moveRowUp: !row || !siblingRow(row, -1),
    moveRowDown: !row || !siblingRow(row, 1),
    moveColumnLeft: !cell || spanned || column <= 0,
    moveColumnRight: !cell || spanned || column >= columns - 1,
    colorRow: !row,
    colorColumn: !cell,
  };
  for (const [action, disabled] of Object.entries(flags)) {
    const button = toolbar.querySelector(`[data-action="${action}"]`);
    if (button) button.disabled = disabled;
  }
}

function syncSwatches(cells) {
  const colors = cells.map((cell) => normalizeColor(cell.getStyle("background-color")));
  const unique = new Set(colors);
  const current = unique.size === 1 ? [...unique][0] : null;
  for (const button of toolbar.querySelectorAll("[data-color]")) {
    const value = button.dataset.color ? normalizeColor(button.dataset.color) : "";
    const active = current !== null && value === current;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function syncShortcutTitles() {
  const suffix = enabled("tableShortcuts");
  const titles = {
    rowInsertBefore: ["Insérer une ligne au-dessus", "Alt+Maj+↑"],
    rowInsertAfter: ["Insérer une ligne en dessous", "Alt+Maj+↓"],
    columnInsertBefore: ["Insérer une colonne à gauche", "Alt+Maj+←"],
    columnInsertAfter: ["Insérer une colonne à droite", "Alt+Maj+→"],
  };
  for (const [command, [label, shortcut]] of Object.entries(titles)) {
    const button = toolbar.querySelector(`[data-command="${command}"]`);
    if (!button) continue;
    const title = suffix ? `${label} (${shortcut})` : label;
    button.title = title;
    button.setAttribute("aria-label", title);
  }
}

function onToolbarClick(event) {
  const button = event.target.closest("button");
  const editor = activeEditor;
  if (!button || !editor || button.disabled) return;
  if (button.dataset.command) {
    editor.execCommand(button.dataset.command);
    scheduleUpdate(editor);
    return;
  }
  if (button.hasAttribute("data-color")) {
    if (button.dataset.color) lastColor = button.dataset.color;
    paintCells(editor, collectCells(editor), button.dataset.color);
    scheduleUpdate(editor);
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  runTableAction(editor, action);
  scheduleUpdate(editor);
}

function runTableAction(editor, action) {
  const cells = collectCells(editor);
  const cell = cells[0];
  if (!cell) return;
  const row = cell.getAscendant("tr", true);
  const table = cell.getAscendant("table", true);
  if (action === "duplicateRow") duplicateRow(editor, row);
  if (action === "duplicateColumn") duplicateColumn(editor, table, visualColumn(cell));
  if (action === "moveRowUp") moveRow(editor, row, -1);
  if (action === "moveRowDown") moveRow(editor, row, 1);
  if (action === "moveColumnLeft") moveColumn(editor, table, visualColumn(cell), -1);
  if (action === "moveColumnRight") moveColumn(editor, table, visualColumn(cell), 1);
  if (action === "colorRow") paintCells(editor, elementChildren(row, ["td", "th"]), lastColor);
  if (action === "colorColumn") paintCells(editor, columnCells(table, visualColumn(cell)), lastColor);
}

function duplicateRow(editor, row) {
  if (!row) return;
  const clone = cleanClone(row);
  withSnapshot(editor, () => clone.insertAfter(row));
}

function duplicateColumn(editor, table, column) {
  if (!table || hasSpans(table)) return;
  withSnapshot(editor, () => {
    for (const row of tableRows(table)) {
      const cell = cellAt(row, column);
      if (!cell) continue;
      cleanClone(cell).insertAfter(cell);
    }
  });
}

function moveRow(editor, row, direction) {
  const neighbor = siblingRow(row, direction);
  if (!neighbor) return;
  withSnapshot(editor, () => {
    if (direction < 0) row.insertBefore(neighbor);
    else row.insertAfter(neighbor);
  });
}

function moveColumn(editor, table, column, direction) {
  if (!table || hasSpans(table)) return;
  const target = column + direction;
  if (target < 0 || target >= columnCount(table)) return;
  withSnapshot(editor, () => {
    for (const row of tableRows(table)) {
      const current = cellAt(row, column);
      const neighbor = cellAt(row, target);
      if (!current || !neighbor || current.equals(neighbor)) continue;
      if (direction < 0) current.insertBefore(neighbor);
      else current.insertAfter(neighbor);
    }
  });
}

function paintCells(editor, cells, color) {
  if (!cells?.length) return;
  withSnapshot(editor, () => {
    for (const cell of cells) {
      if (color) cell.setStyle("background-color", color);
      else cell.removeStyle("background-color");
    }
  });
}

function withSnapshot(editor, change) {
  editor.fire("saveSnapshot");
  editor.fire("lockSnapshot", { dontUpdate: true });
  try {
    change();
  } finally {
    editor.fire("unlockSnapshot");
    editor.fire("saveSnapshot");
  }
}

function collectCells(editor) {
  const editable = editor.editable();
  if (!editable) return [];
  const selected = editable.find(".cke_table-faked-selection");
  if (selected.count()) {
    const cells = [];
    for (let index = 0; index < selected.count(); index += 1) {
      const element = selected.getItem(index);
      const name = element.getName?.();
      if (name === "td" || name === "th") cells.push(element);
    }
    if (cells.length) return cells;
  }
  const start = editor.getSelection()?.getStartElement();
  const cell = start?.getAscendant({ td: 1, th: 1 }, true);
  return cell ? [cell] : [];
}

function onPaste(evt) {
  if (!enabled("tablePasteClean")) return;
  const data = evt.data;
  const value = data.dataValue || "";
  const htmlTable = /<table[\s>]/i.test(value);
  if (!htmlTable && value.includes("\t")) {
    data.type = "html";
    data.dataValue = tsvToHtml(value);
    return;
  }
  if (htmlTable) data.dataValue = cleanTableHtml(value);
}

function tsvToHtml(text) {
  const rows = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "").split("\n");
  const body = rows.map((row) => `<tr>${row.split("\t").map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><tbody>${body}</tbody></table>`;
}

function cleanTableHtml(html) {
  const withoutSizes = html.replace(/\s(?:width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  const doc = new DOMParser().parseFromString(withoutSizes, "text/html");
  if (!doc.querySelector("table")) return html;
  for (const element of doc.querySelectorAll("table, tr, td, th, col, colgroup")) {
    element.removeAttribute("width");
    element.removeAttribute("height");
    if ("width" in element) element.width = "";
    if ("height" in element) element.height = "";
    const style = element.getAttribute("style");
    if (style) {
      const cleaned = style.split(";").map((part) => part.trim()).filter((part) => part && !/^(width|min-width|max-width|height|mso-)/i.test(part)).join("; ");
      if (cleaned) element.setAttribute("style", cleaned);
      else element.removeAttribute("style");
    }
    const className = element.getAttribute("class");
    if (className) {
      const cleaned = className.split(/\s+/).filter((name) => name && !/^Mso/i.test(name)).join(" ");
      if (cleaned) element.setAttribute("class", cleaned);
      else element.removeAttribute("class");
    }
  }
  return doc.body.innerHTML.replace(/\s(?:width|height)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function updateEditorChrome() {
  const editor = activeEditor;
  const alive = settingsReady && editor && editor.status !== "destroyed" && editor.mode === "wysiwyg";
  const focused = alive && (editor.focusManager?.hasFocus || editor.container?.$.classList.contains("bx-fullscreen"));
  const showBar = focused && ["alertBlocks", "macroShortcuts", "editorFullscreen"].some(enabled);
  editorBar.hidden = !showBar;
  if (showBar) {
    const rect = viewportRect(editor, editor.container);
    placeInsideCorner(editorBar, rect);
    editorBar.querySelector('[data-action="fullscreen"]')?.setAttribute("aria-pressed", editor.container.$.classList.contains("bx-fullscreen") ? "true" : "false");
  }
  updateOutline(alive ? editor : null);
  syncFullscreenReserve();
}

function hideEditorChrome() {
  editorBar.hidden = true;
  outline.hidden = true;
  document.documentElement.style.setProperty("--bx-outline-reserve", "0px");
}

function updateOutline(editor) {
  if (!editor || !enabled("editorOutline") || editor.readOnly) {
    outline.hidden = true;
    return;
  }
  const focused = editor.focusManager?.hasFocus || editor.container?.$.classList.contains("bx-fullscreen");
  if (!focused) {
    outline.hidden = true;
    return;
  }
  const headings = [];
  const found = editor.editable()?.find("h1, h2, h3, h4, h5, h6");
  if (found) {
    for (let index = 0; index < found.count(); index += 1) {
      const heading = found.getItem(index);
      if (heading.getText().trim()) headings.push(heading);
    }
  }
  const list = outline.querySelector(".bx-outline-list");
  list.replaceChildren();
  if (!headings.length) {
    const empty = document.createElement("p");
    empty.textContent = "Aucun titre";
    list.append(empty);
  }
  headings.forEach((heading, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.heading = String(index);
    const level = Number(heading.getName().slice(1));
    button.style.paddingLeft = `${6 + (level - 1) * 12}px`;
    button.textContent = heading.getText().trim();
    button._bxHeading = heading;
    list.append(button);
  });
  outline.hidden = false;
  outline.style.visibility = "hidden";
  const rect = viewportRect(editor, editor.container);
  placeBeside(outline, rect);
  outline.style.visibility = "";
}

function onOutlineClick(event) {
  const button = event.target.closest("button");
  const heading = button?._bxHeading;
  const editor = activeEditor;
  if (!heading || !editor) return;
  heading.$.scrollIntoView({ block: "center" });
  const range = editor.createRange();
  range.moveToElementEditStart(heading);
  editor.getSelection().selectRanges([range]);
  editor.focus();
}

function onEditorBarClick(event) {
  const button = event.target.closest("button");
  const editor = activeEditor;
  if (!button || !editor) return;
  if (button.dataset.macro) insertMacro(editor, button.dataset.macro);
  if (button.dataset.action === "fullscreen") toggleFullscreen(editor);
}

function insertMacro(editor, kind) {
  const call = MACROS[kind];
  if (!call) return;
  editor.focus();
  const start = editor.getSelection()?.getStartElement();
  const blocker = start?.getAscendant("table", true);
  if (blocker) {
    const range = editor.createRange();
    range.moveToPosition(blocker, window.CKEDITOR.POSITION_AFTER_END);
    editor.getSelection().selectRanges([range]);
  }
  if (editor.getCommand("xwiki-macro-insert")) {
    editor.execCommand("xwiki-macro-insert", call);
    return;
  }
  const marker = "data-bx-new";
  let html = "";
  if (BOX_CLASS[kind]) html = `<div class="box ${BOX_CLASS[kind]}" ${marker}="1"><p><br></p></div>`;
  else if (kind === "code") html = `<pre ${marker}="1"><code><br></code></pre>`;
  else if (kind === "toc") html = `<p ${marker}="1">{{toc/}}</p>`;
  if (!html) return;
  const filter = editor.filter;
  const wasDisabled = filter?.disabled;
  if (filter) filter.disabled = true;
  try {
    editor.insertHtml(html);
  } finally {
    if (filter) filter.disabled = Boolean(wasDisabled);
  }
  const created = editor.editable().findOne(`[${marker}]`);
  if (!created) return;
  created.removeAttribute(marker);
  const range = editor.createRange();
  range.moveToElementEditStart(created.findOne("p, code") || created);
  editor.getSelection().selectRanges([range]);
}

function toggleFullscreen(editor) {
  const box = editor.container?.$;
  if (!box) return;
  const on = box.classList.toggle("bx-fullscreen");
  const bottomBar = document.querySelector(".bottombuttons, #bottombuttons");
  const bottom = on && bottomBar ? bottomBar.offsetHeight + 8 : 0;
  document.documentElement.style.setProperty("--bx-fullscreen-bottom", `${bottom}px`);
  syncFullscreenReserve();
  const topHeight = editor.ui.space("top")?.$.offsetHeight || 0;
  if (on) {
    box.dataset.bxHeight = String(editor.ui.space("contents")?.$.offsetHeight || 400);
    const available = window.innerHeight - topHeight - bottom - 8;
    editor.resize("100%", Math.max(160, available), true);
  } else {
    editor.resize("100%", Number(box.dataset.bxHeight) || 400, true);
  }
  scheduleUpdate(editor);
}

function syncFullscreenReserve() {
  const fullscreen = activeEditor?.container?.$.classList.contains("bx-fullscreen");
  const reserve = fullscreen && enabled("editorOutline") && !outline.hidden ? outline.offsetWidth + 16 : 0;
  document.documentElement.style.setProperty("--bx-outline-reserve", `${reserve}px`);
}

function onWindowScroll() {
  scheduleUpdate(activeEditor);
  syncStickyOffset();
  hideCopyButton();
}

function onWindowKey(event) {
  if (event.key === "Escape") {
    if (!findBar.hidden) {
      closeSearch();
      event.preventDefault();
      return;
    }
    if (activeEditor?.container?.$.classList.contains("bx-fullscreen")) {
      toggleFullscreen(activeEditor);
      event.preventDefault();
    }
    return;
  }
  if (!enabled("pageSearch")) return;
  if (event.key.toLowerCase() === "f" && event.shiftKey && (event.metaKey || event.ctrlKey) && !event.altKey) {
    event.preventDefault();
    openSearch();
  }
}

function openSearch() {
  if (!enabled("pageSearch")) return;
  findBar.hidden = false;
  const input = findBar.querySelector("input");
  input.focus();
  input.select();
  runSearch(matchIndex);
}

function closeSearch() {
  findBar.hidden = true;
  clearHighlights(document);
  if (activeEditor?.document?.$) clearHighlights(activeEditor.document.$);
  matches = [];
  matchIndex = 0;
  findBar.querySelector(".bx-find-count").textContent = "";
}

function onFindClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.find === "next") runSearch(matchIndex + 1);
  if (button.dataset.find === "prev") runSearch(matchIndex - 1);
  if (button.dataset.find === "close") closeSearch();
}

function onFindKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    runSearch(matchIndex + (event.shiftKey ? -1 : 1));
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeSearch();
  }
}

function runSearch(nextIndex) {
  const query = findBar.querySelector("input").value.trim();
  const root = searchRoot();
  clearHighlights(document);
  if (activeEditor?.document?.$) clearHighlights(activeEditor.document.$);
  matches = query && root ? findRanges(root, query) : [];
  matchIndex = matches.length ? ((nextIndex % matches.length) + matches.length) % matches.length : 0;
  const count = findBar.querySelector(".bx-find-count");
  count.textContent = query ? `${matches.length ? matchIndex + 1 : 0}/${matches.length}` : "";
  if (!root || !matches.length) return;
  paintMatches(root, matches, matchIndex);
  const node = matches[matchIndex].startContainer;
  (node.nodeType === 1 ? node : node.parentElement)?.scrollIntoView({ block: "center", inline: "nearest" });
}

function searchRoot() {
  const editable = activeEditor?.mode === "wysiwyg" ? activeEditor.editable()?.$ : null;
  if (editable && classicEdit()) return editable;
  return document.querySelector("#xwikicontent") || document.body;
}

function findRanges(root, query) {
  const doc = root.ownerDocument;
  const ranges = [];
  const needle = query.toLowerCase();
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.toLowerCase().includes(needle)) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, textarea, input, #betterxwiki-find")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode() && ranges.length < 300) {
    const text = walker.currentNode.nodeValue;
    const lower = text.toLowerCase();
    let from = 0;
    while (from < text.length && ranges.length < 300) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;
      const range = doc.createRange();
      range.setStart(walker.currentNode, index);
      range.setEnd(walker.currentNode, index + needle.length);
      ranges.push(range);
      from = index + needle.length;
    }
  }
  return ranges;
}

function paintMatches(root, ranges, current) {
  const view = root.ownerDocument.defaultView;
  if (!view.Highlight || !view.CSS?.highlights) return;
  ensureHighlightStyle(root.ownerDocument);
  const rest = ranges.filter((_, index) => index !== current);
  if (rest.length) view.CSS.highlights.set("bx-find", new view.Highlight(...rest));
  if (ranges[current]) view.CSS.highlights.set("bx-find-current", new view.Highlight(ranges[current]));
}

function clearHighlights(doc) {
  const highlights = doc?.defaultView?.CSS?.highlights;
  highlights?.delete("bx-find");
  highlights?.delete("bx-find-current");
}

function ensureHighlightStyle(doc) {
  if (!doc?.head || doc.getElementById("bx-highlight-style")) return;
  const style = doc.createElement("style");
  style.id = "bx-highlight-style";
  style.textContent = "::highlight(bx-find){background-color:#ffe08a;color:inherit}::highlight(bx-find-current){background-color:#f5a524;color:inherit}";
  doc.head.appendChild(style);
}

function syncViewFeatures() {
  const dracula = enabled("draculaTheme");
  const apple = enabled("appleTheme") && !dracula;
  document.documentElement.classList.toggle("bx-dracula", dracula);
  document.documentElement.classList.toggle("bx-apple", apple);
  document.documentElement.classList.toggle("bx-themed", apple || dracula);
  document.documentElement.classList.toggle("bx-sticky", enabled("stickyHeaders"));
  syncStickyOffset();
  searchButton.hidden = !enabled("pageSearch");
  if (!enabled("copyTableTsv")) hideCopyButton();
  const instances = window.CKEDITOR?.instances || {};
  for (const editor of Object.values(instances)) syncEditorTheme(editor);
}

function syncEditorTheme(editor) {
  const doc = editor?.document?.$;
  if (!doc?.head) return;
  const current = doc.getElementById("bx-apple-editor");
  const css = editorThemeCss();
  if (!css) {
    current?.remove();
    return;
  }
  const style = current || doc.createElement("style");
  style.id = "bx-apple-editor";
  style.textContent = css;
  if (!current) doc.head.appendChild(style);
}

function editorThemeCss() {
  if (enabled("draculaTheme")) return DRACULA_EDITOR_CSS;
  if (enabled("appleTheme")) return APPLE_EDITOR_CSS;
  return "";
}

const APPLE_EDITOR_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    background: #ffffff;
    color: #282a36;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { color: #282a36; font-weight: 650; }
  a { color: #007a94; text-decoration: none; }
  table { border-collapse: separate; border: 1px solid rgba(98, 114, 164, 0.4); border-radius: 12px; }
  th { color: #5c6288; background: #d8dae4; }
  td { background: #e6e7ee; }
  td, th { border: 0; border-bottom: 1px solid rgba(98, 114, 164, 0.28); }
`;

const DRACULA_EDITOR_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    background: #282a36;
    color: #f8f8f2;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { color: #f8f8f2; font-weight: 650; }
  a { color: #8be9fd; text-decoration: none; }
  table { border-collapse: separate; border: 1px solid #6272a4; border-radius: 12px; }
  th { color: #6272a4; }
  td, th { border: 0; border-bottom: 1px solid #44475a; }
`;

function syncStickyOffset() {
  if (!enabled("stickyHeaders")) return;
  let top = 0;
  for (const element of document.querySelectorAll("#headerglobal, .navbar-fixed-top, header.navbar")) {
    const style = getComputedStyle(element);
    if (style.position !== "fixed" && style.position !== "sticky") continue;
    const rect = element.getBoundingClientRect();
    if (rect.bottom > top && rect.top < 80) top = rect.bottom;
  }
  document.documentElement.style.setProperty("--bx-sticky-top", `${Math.max(0, Math.round(top))}px`);
}

function showCopyButton(event) {
  if (!enabled("copyTableTsv")) return;
  const table = event.target.closest?.("#xwikicontent table");
  if (!table || table.closest(".cke")) return;
  const rect = table.getBoundingClientRect();
  copyButton.hidden = false;
  copyButton.dataset.ready = "1";
  copyButton._bxTable = table;
  copyButton.style.top = `${Math.max(8, rect.top + 6)}px`;
  copyButton.style.left = `${Math.max(8, rect.right - copyButton.offsetWidth - 6)}px`;
}

function hideCopyButton() {
  copyButton.hidden = true;
  copyButton._bxTable = null;
}

function hideCopyButtonOnLeave(event) {
  const table = copyButton._bxTable;
  if (!table) return;
  const next = event.relatedTarget;
  if (next && (next === copyButton || copyButton.contains(next) || table.contains(next))) return;
  if (event.target === copyButton || table.contains(event.target)) hideCopyButton();
}

async function copyActiveTable() {
  const table = copyButton._bxTable;
  if (!table) return;
  const text = tableToTsv(table);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  copyButton.textContent = "Copié";
  setTimeout(() => {
    copyButton.textContent = "Copier";
  }, 1200);
}

function tableToTsv(table) {
  const grid = [];
  [...table.rows].forEach((row, rowIndex) => {
    grid[rowIndex] = grid[rowIndex] || [];
    let column = 0;
    for (const cell of row.cells) {
      while (grid[rowIndex][column] !== undefined) column += 1;
      const text = cell.innerText.replace(/\s+/g, " ").trim();
      for (let rowOffset = 0; rowOffset < cell.rowSpan; rowOffset += 1) {
        grid[rowIndex + rowOffset] = grid[rowIndex + rowOffset] || [];
        for (let columnOffset = 0; columnOffset < cell.colSpan; columnOffset += 1) {
          grid[rowIndex + rowOffset][column + columnOffset] = rowOffset === 0 && columnOffset === 0 ? text : "";
        }
      }
      column += cell.colSpan;
    }
  });
  const width = Math.max(0, ...grid.map((row) => row.length));
  return grid.map((row) => Array.from({ length: width }, (_, index) => escapeTsv(row[index] || "")).join("\t")).join("\n");
}

function escapeTsv(value) {
  return /[\t\n"]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function pageKey() {
  const xwiki = window.XWiki || {};
  if (xwiki.currentPage) return [xwiki.currentWiki, xwiki.currentSpace, xwiki.currentPage].filter((part) => part != null && part !== "").join(":");
  return location.pathname;
}

function classicEdit() {
  return /\/edit\//.test(location.pathname) || /[?&](editor|section)=/.test(location.search);
}

function rememberScroll() {
  if (!settingsReady || !enabled("restoreReadPosition") || classicEdit()) return;
  sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key: pageKey(), y: window.scrollY }));
}

function armReturn() {
  if (!settingsReady || !classicEdit()) return;
  if (!enabled("restoreReadPosition")) {
    sessionStorage.removeItem(RETURN_KEY);
    return;
  }
  sessionStorage.setItem(RETURN_KEY, pageKey());
}

function restoreScroll() {
  if (!settingsReady || classicEdit()) return;
  if (!enabled("restoreReadPosition")) {
    sessionStorage.removeItem(RETURN_KEY);
    return;
  }
  if (sessionStorage.getItem(RETURN_KEY) !== pageKey()) return;
  sessionStorage.removeItem(RETURN_KEY);
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "null");
  } catch {
    return;
  }
  if (!saved || saved.key !== pageKey()) return;
  const y = Number(saved.y) || 0;
  const go = () => window.scrollTo(0, y);
  go();
  requestAnimationFrame(go);
  setTimeout(go, 300);
}

function tableRows(table) {
  const rows = [];
  const sections = [];
  for (const child of elementChildren(table, ["tr", "thead", "tbody", "tfoot"])) {
    if (child.getName() === "tr") rows.push(child);
    else sections.push(child);
  }
  for (const section of sections) rows.push(...elementChildren(section, ["tr"]));
  return rows;
}

function elementChildren(parent, names) {
  const result = [];
  if (!parent) return result;
  let child = parent.getFirst();
  while (child) {
    if (child.type === window.CKEDITOR.NODE_ELEMENT && names.includes(child.getName())) result.push(child);
    child = child.getNext();
  }
  return result;
}

function visualColumn(cell) {
  let index = 0;
  let sibling = cell.getPrevious();
  while (sibling) {
    if (sibling.type === window.CKEDITOR.NODE_ELEMENT && ["td", "th"].includes(sibling.getName())) {
      index += Number(sibling.getAttribute("colspan") || 1);
    }
    sibling = sibling.getPrevious();
  }
  return index;
}

function cellAt(row, column) {
  let index = 0;
  for (const cell of elementChildren(row, ["td", "th"])) {
    const span = Number(cell.getAttribute("colspan") || 1);
    if (column >= index && column < index + span) return cell;
    index += span;
  }
  return null;
}

function columnCells(table, column) {
  const seen = new Set();
  const cells = [];
  for (const row of tableRows(table)) {
    const cell = cellAt(row, column);
    if (cell && !seen.has(cell.$)) {
      seen.add(cell.$);
      cells.push(cell);
    }
  }
  return cells;
}

function columnCount(table) {
  return tableRows(table).reduce((max, row) => {
    const count = elementChildren(row, ["td", "th"]).reduce((sum, cell) => sum + Number(cell.getAttribute("colspan") || 1), 0);
    return Math.max(max, count);
  }, 0);
}

function hasSpans(table) {
  const cells = table.find("td, th");
  for (let index = 0; index < cells.count(); index += 1) {
    const cell = cells.getItem(index);
    if (Number(cell.getAttribute("colspan") || 1) > 1 || Number(cell.getAttribute("rowspan") || 1) > 1) return true;
  }
  return false;
}

function siblingRow(row, direction) {
  let node = direction < 0 ? row.getPrevious() : row.getNext();
  while (node) {
    if (node.type === window.CKEDITOR.NODE_ELEMENT && node.getName() === "tr") return node;
    node = direction < 0 ? node.getPrevious() : node.getNext();
  }
  return null;
}

function cleanClone(element) {
  const clone = element.clone(true, false);
  cleanNode(clone);
  const descendants = clone.find("*");
  for (let index = 0; index < descendants.count(); index += 1) cleanNode(descendants.getItem(index));
  return clone;
}

function cleanNode(node) {
  if (!node.$?.attributes) return;
  const names = [...node.$.attributes].map((attribute) => attribute.name);
  for (const name of names) {
    if (name === "id" || name.startsWith("data-cke")) node.removeAttribute(name);
  }
}

function viewportRect(editor, element) {
  const rect = element.$.getBoundingClientRect();
  const frame = editor.window?.getFrame?.();
  if (!frame || element.equals?.(editor.container)) return rect;
  const frameRect = frame.$.getBoundingClientRect();
  return {
    top: frameRect.top + rect.top,
    left: frameRect.left + rect.left,
    bottom: frameRect.top + rect.bottom,
    right: frameRect.left + rect.right,
    width: rect.width,
    height: rect.height,
  };
}

function placeFloating(panel, rect, preference) {
  const margin = 8;
  const height = panel.offsetHeight;
  const width = panel.offsetWidth;
  let top = preference === "above" ? rect.top - height - margin : rect.bottom + margin;
  if (top < margin) top = rect.bottom + margin;
  if (top + height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - height - margin);
  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
  panel.style.top = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

function placeInsideCorner(panel, rect) {
  const margin = 8;
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  let top = rect.top - height - margin;
  if (top < margin) top = rect.bottom + margin;
  if (top + height > window.innerHeight - margin) top = Math.max(margin, rect.top + margin);
  const left = Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin));
  panel.style.top = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

function placeBeside(panel, rect) {
  const margin = 8;
  const width = panel.offsetWidth || 220;
  const height = panel.offsetHeight;
  let left = rect.right + margin;
  if (left + width > window.innerWidth - margin) left = Math.max(margin, rect.left - width - margin);
  let top = Math.max(margin, rect.top);
  if (top + height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - height - margin);
  panel.style.top = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

function normalizeColor(value) {
  if (!value || value === "transparent") return "";
  const match = String(value).match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  const channels = match ? [match[1], match[2], match[3]] : hexChannels(value);
  if (!channels) return String(value).trim().toLowerCase();
  return `#${channels.map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}

function hexChannels(value) {
  const hex = String(value).trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return [...hex].map((channel) => parseInt(channel + channel, 16));
  if (/^[0-9a-f]{6}$/i.test(hex)) return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((channel) => parseInt(channel, 16));
  return null;
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function icon(first, second, secondStroke = "currentColor") {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${first}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>${second ? `<path d="${second}" fill="none" stroke="${secondStroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : ""}</svg>`;
}

function buildToolbar() {
  const bar = floatingBar("betterxwiki-toolbar", "Outils de tableau Better xWiki");
  bar.append(
    commandGroup("tableRows", [
      ["rowInsertBefore", "Insérer une ligne au-dessus", ICONS.rowBefore],
      ["rowInsertAfter", "Insérer une ligne en dessous", ICONS.rowAfter],
    ]),
    commandGroup("tableColumns", [
      ["columnInsertBefore", "Insérer une colonne à gauche", ICONS.colBefore],
      ["columnInsertAfter", "Insérer une colonne à droite", ICONS.colAfter],
    ]),
    commandGroup("tableDelete", [
      ["rowDelete", "Supprimer la ligne", ICONS.deleteRow],
      ["columnDelete", "Supprimer la colonne", ICONS.deleteCol],
    ]),
    actionGroup("tableDuplicate", [
      ["duplicateRow", "Dupliquer la ligne", ICONS.duplicateRow],
      ["duplicateColumn", "Dupliquer la colonne", ICONS.duplicateCol],
    ]),
    actionGroup("tableMove", [
      ["moveRowUp", "Déplacer la ligne vers le haut", ICONS.moveUp],
      ["moveRowDown", "Déplacer la ligne vers le bas", ICONS.moveDown],
      ["moveColumnLeft", "Déplacer la colonne vers la gauche", ICONS.moveLeft],
      ["moveColumnRight", "Déplacer la colonne vers la droite", ICONS.moveRight],
    ]),
    colorGroup(),
    actionGroup("tableBandColors", [
      ["colorRow", "Colorier la ligne", ICONS.colorRow],
      ["colorColumn", "Colorier la colonne", ICONS.colorCol],
    ]),
    commandGroup("tableMerge", [
      ["cellMergeRight", "Fusionner avec la cellule de droite", ICONS.mergeRight],
      ["cellMergeDown", "Fusionner avec la cellule du dessous", ICONS.mergeDown],
      ["cellHorizontalSplit", "Scinder la cellule horizontalement", ICONS.splitH],
      ["cellVerticalSplit", "Scinder la cellule verticalement", ICONS.splitV],
    ]),
  );
  return bar;
}

function buildEditorBar() {
  const bar = floatingBar("betterxwiki-editorbar", "Outils d’édition Better xWiki");
  bar.append(
    macroGroup("alertBlocks", [
      ["info", "Bloc info", "#d1ecf1"],
      ["success", "Bloc succès", "#d4edda"],
      ["warning", "Bloc attention", "#fff3cd"],
      ["error", "Bloc erreur", "#f8d7da"],
    ]),
    macroGroup("macroShortcuts", [
      ["code", "Bloc de code", null, ICONS.code],
      ["info", "Macro info", "#d1ecf1"],
      ["toc", "Table des matières", null, ICONS.toc],
    ]),
    actionGroup("editorFullscreen", [["fullscreen", "Plein écran", ICONS.fullscreen]]),
  );
  return bar;
}

function buildOutline() {
  const panel = document.createElement("aside");
  panel.id = "betterxwiki-outline";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Sommaire du document");
  const list = document.createElement("div");
  list.className = "bx-outline-list";
  panel.append(list);
  return panel;
}

function buildFindBar() {
  const bar = floatingBar("betterxwiki-find", "Recherche dans la page");
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Rechercher dans la page";
  input.setAttribute("aria-label", "Rechercher dans la page");
  const count = document.createElement("span");
  count.className = "bx-find-count";
  bar.append(input, count, findButton("prev", "Occurrence précédente", "↑"), findButton("next", "Occurrence suivante", "↓"), findButton("close", "Fermer", "×"));
  return bar;
}

function buildSearchButton() {
  const button = document.createElement("button");
  button.id = "betterxwiki-search";
  button.type = "button";
  button.hidden = true;
  button.title = "Rechercher dans la page";
  button.setAttribute("aria-label", "Rechercher dans la page");
  button.innerHTML = ICONS.search;
  return button;
}

function buildCopyButton() {
  const button = document.createElement("button");
  button.id = "betterxwiki-copy";
  button.type = "button";
  button.hidden = true;
  button.textContent = "Copier";
  button.title = "Copier le tableau";
  return button;
}

function floatingBar(id, label) {
  const bar = document.createElement("div");
  bar.id = id;
  bar.hidden = true;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", label);
  return bar;
}

function commandGroup(feature, buttons) {
  const group = document.createElement("div");
  group.className = "bx-group";
  group.dataset.feature = feature;
  for (const [command, label, svg] of buttons) group.append(iconButton({ command, label, svg }));
  return group;
}

function actionGroup(feature, buttons) {
  const group = document.createElement("div");
  group.className = "bx-group";
  group.dataset.feature = feature;
  for (const [action, label, svg] of buttons) group.append(iconButton({ action, label, svg }));
  return group;
}

function macroGroup(feature, buttons) {
  const group = document.createElement("div");
  group.className = "bx-group";
  group.dataset.feature = feature;
  for (const [macro, label, color, svg] of buttons) {
    const button = iconButton({ macro, label, svg });
    if (color) {
      const swatch = document.createElement("span");
      swatch.className = "bx-swatch";
      swatch.style.backgroundColor = color;
      button.append(swatch);
    }
    group.append(button);
  }
  return group;
}

function colorGroup() {
  const group = document.createElement("div");
  group.className = "bx-group";
  group.dataset.feature = "tableCellColors";
  for (const color of COLORS) {
    const button = iconButton({ label: color.label, color: color.value });
    const swatch = document.createElement("span");
    swatch.className = "bx-swatch";
    swatch.style.backgroundColor = color.value;
    button.append(swatch);
    group.append(button);
  }
  group.append(iconButton({ label: "Retirer la couleur", color: "", svg: ICONS.clear }));
  return group;
}

function iconButton({ command, action, macro, label, svg, color }) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  if (command) button.dataset.command = command;
  if (action) button.dataset.action = action;
  if (macro) button.dataset.macro = macro;
  if (color !== undefined) {
    button.dataset.color = color;
    button.setAttribute("aria-pressed", "false");
  }
  if (svg) button.innerHTML = svg;
  return button;
}

function findButton(action, label, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.find = action;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}
