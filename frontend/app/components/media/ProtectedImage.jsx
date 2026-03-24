"use client";

export function ProtectedImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading,
}) {
  if (!src) {
    return null;
  }

  return (
    <div
      className={`relative ${wrapperClassName}`.trim()}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none" }}
    >
      <img
        src={src}
        alt={alt}
        className={`select-none ${className}`.trim()}
        draggable={false}
        loading={loading}
        style={{ userSelect: "none" }}
      />
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-transparent" />
    </div>
  );
}