/**
 * Formats a doctor's name cleanly, ensuring exactly one "Dr." prefix
 */
export const formatDoctorName = (name?: string | null): string => {
  if (!name) return 'Dr. Specialist';
  const clean = name.replace(/^(Dr\.?\s*)+/i, '').trim();
  return `Dr. ${clean}`;
};

/**
 * Formats a Date object to YYYY-MM-DD using local time
 */
export const formatDateToYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayLocalDateStr = (): string => formatDateToYYYYMMDD(new Date());

