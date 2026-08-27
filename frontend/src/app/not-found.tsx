import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-zinc-600">
        This page does not exist or the link is invalid.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
      >
        ← Back to the start page
      </Link>
    </div>
  );
}
