/**
 * Utility functions for formatting currencies, dates, deadlines, and exports.
 */

/**
 * Formats a numeric currency amount with proper locale separators.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable format.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'TBD';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return dateString;
}

/**
 * Calculates remaining calendar days between today and the target event date.
 */
export function calculateDaysRemaining(targetDateStr: string, referenceDateStr?: string): number {
  const target = new Date(targetDateStr);
  const reference = referenceDateStr ? new Date(referenceDateStr) : new Date();

  // Reset hours to start of day for accurate calendar day comparison
  target.setHours(0, 0, 0, 0);
  reference.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - reference.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns accessible CSS badge classes based on task priority.
 */
export function getPriorityBadgeClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'badge badge-danger';
    case 'medium':
      return 'badge badge-warning';
    case 'low':
      return 'badge badge-neutral';
    default:
      return 'badge badge-neutral';
  }
}

/**
 * Generates an RFC 4180 compliant CSV string from an array of records.
 */
export function generateCsv(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a browser file download of arbitrary text/CSV/JSON content.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
