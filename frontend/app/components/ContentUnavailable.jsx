import Link from "next/link";

export function ContentUnavailable() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">Content unavailable</h1>
        <p className="text-gray-600 mt-2">Please try again in a moment.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Researchers
        </Link>
      </div>
    </main>
  );
}
