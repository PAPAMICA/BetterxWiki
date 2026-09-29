import { FEATURES, GROUPS, STORAGE_KEY, normalizeSettings } from "./features/registry.js";

const form = document.querySelector("#features");
const stored = await chrome.storage.sync.get(STORAGE_KEY);
const settings = normalizeSettings(stored[STORAGE_KEY]);
let writeQueue = Promise.resolve();

function render(current) {
  form.replaceChildren();

  for (const group of GROUPS) {
    const features = FEATURES.filter((feature) => feature.group === group.id);
    if (!features.length) continue;

    const heading = document.createElement("h2");
    heading.textContent = group.label;
    form.append(heading);

    for (const feature of features) {
      const label = document.createElement("label");
      label.className = "feature";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.feature = feature.id;
      input.checked = current[feature.id] !== false;
      input.addEventListener("change", () => {
        current[feature.id] = input.checked;
        if (input.checked && (feature.id === "appleTheme" || feature.id === "draculaTheme")) {
          const other = feature.id === "appleTheme" ? "draculaTheme" : "appleTheme";
          current[other] = false;
          const otherInput = form.querySelector(`input[data-feature="${other}"]`);
          if (otherInput) otherInput.checked = false;
        }
        const snapshot = { ...current };
        writeQueue = writeQueue.then(() => chrome.storage.sync.set({ [STORAGE_KEY]: snapshot }));
      });

      const text = document.createElement("span");
      text.className = "text";

      const title = document.createElement("strong");
      title.textContent = feature.label;

      const description = document.createElement("small");
      description.textContent = feature.description;

      text.append(title, description);
      label.append(input, text);
      form.append(label);
    }
  }
}

render(settings);
