"use client";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
      <h2 className="font-semibold">Could not load this page</h2>
      <p className="mt-1 text-sm">
        The CharityHub API is not reachable. Make sure the backend is running
        (see the backend README), then try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}
