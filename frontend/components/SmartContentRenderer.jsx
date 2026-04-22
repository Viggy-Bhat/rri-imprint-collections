import Link from "next/link";

export default function SmartContentRenderer({ blocks, galleryHref }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const data = block.value;

        switch (block.type) {
          case "publication":
            return (
              <div key={index} className="card-academic p-6">
                <h3 className="text-xl font-semibold text-[#8b1c1c]">
                  {data.title}
                </h3>

                {data.journal && (
                  <p>
                    <strong>Journal:</strong> {data.journal}
                  </p>
                )}

                {data.year && (
                  <p>
                    <strong>Year:</strong> {data.year}
                  </p>
                )}

                {data.link && (
                  <a
                    href={data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b1c1c] underline"
                  >
                    Read Publication
                  </a>
                )}
              </div>
            );

          case "guidance":
            return (
              <div key={index} className="card-academic p-6">
                <h3 className="text-lg font-semibold">
                  {data.student_name}
                </h3>

                <p>{data.thesis_title}</p>

                {data.year && <p>{data.year}</p>}

                {data.link && (
                  <a
                    href={data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-[#8b1c1c] underline"
                  >
                    Open Link
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            );

          case "news":
            return (
              <div key={index} className="card-academic p-6">
                <h3 className="font-semibold">{data.headline}</h3>

                {data.source && <p>{data.source}</p>}

                {data.link && (
                  <a href={data.link} target="_blank" rel="noopener noreferrer">
                    View article
                  </a>
                )}
              </div>
            );

          case "supervision":
            return (
              <div key={index} className="card-academic p-6">
                <h3 className="font-semibold">{data.student}</h3>
                <p>{data.topic}</p>
                {data.year && <p>{data.year}</p>}
              </div>
            );

          case "gallery": {
            const galleryImages = Array.isArray(data?.images) ? data.images : [];

            return (
              <div key={index} className="card-academic p-6 space-y-3">
                {data?.title ? (
                  <h3 className="text-xl font-semibold text-[#8b1c1c]">{data.title}</h3>
                ) : null}
                <p className="text-sm text-gray-700">
                  {galleryImages.length > 0
                    ? `${galleryImages.length} gallery image${galleryImages.length === 1 ? "" : "s"} available.`
                    : "Gallery images available."}
                </p>
                {galleryHref ? (
                  <Link
                    href={galleryHref}
                    className="inline-flex items-center gap-2 text-[#8b1c1c] underline underline-offset-4"
                  >
                    View Full Gallery
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
