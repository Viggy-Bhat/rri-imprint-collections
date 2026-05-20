/**
 * BioBlock - Renders rich text content
 */
export function BioBlock({ value }) {
  return (
    <div className="cms-content rich-text-content prose max-w-none my-4 text-gray-900 prose-p:leading-7 prose-a:text-red-700 prose-a:underline">
      <div
        className="text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
