export function FooterRight({ settings }) {
  const instituteName = settings?.institute_name || "";
  const department = settings?.department || "";
  const address = settings?.address || "";
  const phone = settings?.phone || "";
  const email = settings?.email || "";

  return (
    <address className="not-italic text-sm text-gray-700 leading-relaxed text-center md:text-right">
      {department && <p className="font-semibold tracking-wide text-red-800">{department}</p>}
      {instituteName && <p className="font-semibold tracking-wide text-red-800">{instituteName}</p>}
      {address && <p>{address}</p>}
      {phone && <p>Phone: {phone}</p>}
      {email && <p>Email: {email}</p>}
    </address>
  );
}
