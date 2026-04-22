import { ProtectedImage } from "@/app/components/media/ProtectedImage";

export function ProfileCard({ researcher, profileImageUrl, items = [] }) {
  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0">
      <section
        className="bg-amber-50/90 border border-red-100 p-4 sm:p-5 rounded-2xl shadow-md xl:sticky xl:top-6"
        aria-labelledby="profile-summary-heading"
      >
        <h2 id="profile-summary-heading" className="font-serif text-lg sm:text-xl text-red-800 border-b border-red-300 pb-3 mb-4">
          Profile Summary
        </h2>

        {profileImageUrl && (
          <ProtectedImage
            src={profileImageUrl}
            alt={researcher?.title || "Researcher"}
            wrapperClassName="mb-4 w-full rounded-2xl overflow-hidden shadow-sm aspect-[4/5] md:aspect-auto"
            className="block w-full h-full md:h-auto rounded-2xl object-cover object-center"
          />
        )}

        <h3 className="font-serif text-2xl leading-tight text-gray-900 mb-4">{researcher?.title}</h3>

        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No profile details available.</p>
        ) : (
          <dl className="space-y-2.5 text-sm">
            {items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-[96px_1fr] gap-3 items-start">
                <dt className="text-red-700 font-semibold">{item.label}</dt>
                <dd className="text-gray-700 leading-6">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </aside>
  );
}
