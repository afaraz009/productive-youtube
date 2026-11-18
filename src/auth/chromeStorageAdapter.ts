export const chromeStorageAdapter = {
  //to save data
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    return (result[key] as string | undefined) ?? null;
  },
  //to retrieve saved data
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  //remove session during signout
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};