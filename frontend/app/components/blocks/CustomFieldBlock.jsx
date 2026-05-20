/**
 * CustomFieldBlock - Renders custom label/value pairs
 */
export function CustomFieldBlock({ value }) {
  if (!value) return null;

  const { label, value: fieldValue } = value;

  return (
    <div className="my-4 px-4 py-3 bg-gray-100 rounded border border-gray-300">
      <div className="flex gap-2">
        <span className="font-semibold text-gray-700">{label}:</span>
        <span className="text-gray-600">{fieldValue}</span>
      </div>
    </div>
  );
}
