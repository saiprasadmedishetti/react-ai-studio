import type { HistoryItem } from "../components/prompt";

const HISTORY_KEY = "react-ai-studio-mini-history";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
export function saveHistory(list: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 5)));
  } catch (e) {
    console.log(e);
  }
}
