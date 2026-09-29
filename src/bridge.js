const STORAGE_KEY = "features";
const SETTINGS_NODE_ID = "betterxwiki-settings";
const SETTINGS_EVENT = "betterxwiki-settings";

function publish(settings) {
  const root = document.documentElement || document.head;
  if (!root) return;

  let node = document.getElementById(SETTINGS_NODE_ID);
  if (!node) {
    node = document.createElement("script");
    node.id = SETTINGS_NODE_ID;
    node.type = "application/json";
    root.appendChild(node);
  }
  node.textContent = JSON.stringify(settings || {});
  document.dispatchEvent(new Event(SETTINGS_EVENT));
}

function load() {
  chrome.storage.sync
    .get(STORAGE_KEY)
    .then((stored) => publish(stored[STORAGE_KEY] || {}))
    .catch(() => publish({}));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) publish(changes[STORAGE_KEY].newValue || {});
});

load();
