export function formatIndianDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatIndianDateRange(birthDate, deathDate) {
  const formattedBirthDate = formatIndianDate(birthDate);
  const formattedDeathDate = formatIndianDate(deathDate);

  if (formattedBirthDate && formattedDeathDate) {
    return `${formattedBirthDate} – ${formattedDeathDate}`;
  }

  return formattedBirthDate || formattedDeathDate || "";
}