type LiveSummary = {
  prompt: string;
  style: string;
  hasImage: boolean;
};

type PreviewProps = {
  imageUrl?: string;
  liveSummary: LiveSummary;
};

export default function Preview({ imageUrl, liveSummary }: PreviewProps) {
  return (
    <section className="lg:col-span-2">
      <div className="bg-white rounded-2xl shadow p-4 md:p-6">
        <h2 className="text-lg font-medium mb-4">Live Summary</h2>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-gray-100 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Selected preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-sm text-gray-500">No image selected</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Prompt</div>
              <p className="mt-1 p-3 rounded-xl border bg-gray-50 min-h-[56px] whitespace-pre-wrap">
                {liveSummary.prompt}
              </p>
            </div>
            <div>
              <div className="text-sm text-gray-600">Style</div>
              <p className="mt-1 inline-flex items-center gap-2 p-2 rounded-xl border">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-indigo-600"
                  aria-hidden="true"
                ></span>
                {liveSummary.style}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Ready to generate:{" "}
              {liveSummary.hasImage && liveSummary.prompt.trim() ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500" aria-live="polite">
        Tips: Use Tab/Shift+Tab to move through inputs. All interactive elements
        have visible focus rings.
      </div>
    </section>
  );
}
