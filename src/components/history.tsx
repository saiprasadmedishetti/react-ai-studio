import type { HistoryItem } from "./prompt";

type HistoryProps = {
  history: HistoryItem[];
  restoreFromHistory: (item: HistoryItem) => void;
};

export default function History({ history, restoreFromHistory }: HistoryProps) {
  return (
    <div className="mt-6 bg-white rounded-2xl shadow p-4 md:p-5">
      <h2 className="text-lg font-medium mb-3">History (last 5)</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">No generations yet.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => restoreFromHistory(item)}
                className="w-full text-left flex items-center gap-3 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                <img
                  src={item.imageUrl}
                  alt={`Generated preview for ${item.style}`}
                  className="h-12 w-12 object-cover rounded-lg border"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item.prompt}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full border border-gray-300">
                      {item.style}
                    </span>
                    <time dateTime={item.createdAt} className="truncate">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
