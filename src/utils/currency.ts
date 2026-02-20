const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  return d.toLocaleDateString("en-IN", {
    timeZone: "UTC", // prevents date shifting in IST
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatBookingPeriod = (startDate, endDate) => {
 
  if (startDate && endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // same-day booking UX
    if (start === end) {
      return `${start} (9:00 AM – 6:00 PM)`;
    }

    return `${start} 9:00 AM to ${end} 6:00 PM`;
  }

  if (startDate) {
    const start = formatDate(startDate);
    return `${start} 9:00 AM onwards`;
  }

  // only endDate
  const end = formatDate(endDate);
  return `Till ${end} 6:00 PM`;
};
