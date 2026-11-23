export async function openAuthPage(mode: "login" | "signup"): Promise<void> {
  const base = chrome.runtime.getURL("auth.html");
  const url = `${base}#${mode}`;

  // Reuse an existing auth tab if there is one

  // base + login or base + signup, so we can use a wildcard to match either
  const existing = await chrome.tabs.query({ url: `${base}*` });
  const tab = existing[0];

  if (tab?.id !== undefined) {
    await chrome.tabs.update(tab.id, { url, active: true });
    if (tab.windowId !== undefined) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url });
  }

  window.close(); // close the popup
}