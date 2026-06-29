import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("aura", {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});

