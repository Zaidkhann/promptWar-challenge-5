import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  calculateDaysRemaining,
  getPriorityBadgeClass,
  generateCsv,
} from '../utils/formatters';

describe('Client Formatters & Export Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive integer currencies cleanly', () => {
      const formatted = formatCurrency(25000);
      expect(formatted).toBe('$25,000');
    });

    it('should handle zero gracefully', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBe('$0');
    });

    it('should handle NaN or infinite values safely', () => {
      const formatted = formatCurrency(NaN);
      expect(formatted).toBe('$0');
    });
  });

  describe('formatDate', () => {
    it('should parse and format ISO YYYY-MM-DD date strings', () => {
      const formatted = formatDate('2026-10-15');
      expect(formatted).toBe('Oct 15, 2026');
    });

    it('should return TBD for empty or falsy strings', () => {
      expect(formatDate('')).toBe('TBD');
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate future days accurately', () => {
      const days = calculateDaysRemaining('2026-12-31', '2026-12-01');
      expect(days).toBe(30);
    });

    it('should return 0 for same-day deadlines', () => {
      const days = calculateDaysRemaining('2026-10-10', '2026-10-10');
      expect(days).toBe(0);
    });

    it('should return negative values for past dates', () => {
      const days = calculateDaysRemaining('2026-10-01', '2026-10-10');
      expect(days).toBe(-9);
    });
  });

  describe('getPriorityBadgeClass', () => {
    it('should return danger badge for high priority', () => {
      expect(getPriorityBadgeClass('high')).toBe('badge badge-danger');
      expect(getPriorityBadgeClass('HIGH')).toBe('badge badge-danger');
    });

    it('should return warning badge for medium priority', () => {
      expect(getPriorityBadgeClass('medium')).toBe('badge badge-warning');
    });

    it('should return neutral badge for low or unrecognized priority', () => {
      expect(getPriorityBadgeClass('low')).toBe('badge badge-neutral');
      expect(getPriorityBadgeClass('unknown')).toBe('badge badge-neutral');
    });
  });

  describe('generateCsv', () => {
    it('should format CSV with proper headers and row values', () => {
      const headers = ['Category', 'Allocated', 'Spent'];
      const rows = [
        ['Venue', 8000, 7500],
        ['Catering', 6000, 6200],
      ];
      const csv = generateCsv(headers, rows);
      expect(csv).toContain('Category,Allocated,Spent');
      expect(csv).toContain('Venue,8000,7500');
      expect(csv).toContain('Catering,6000,6200');
    });

    it('should properly escape cells containing commas or quotes', () => {
      const headers = ['Item', 'Notes'];
      const rows = [['Special Decor', 'Include "gold", silver ribbons']];
      const csv = generateCsv(headers, rows);
      expect(csv).toContain('"Include ""gold"", silver ribbons"');
    });
  });
});
