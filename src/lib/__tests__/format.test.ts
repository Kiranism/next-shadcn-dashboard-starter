import { describe, it, expect } from 'vitest';
import { formatDate } from '../format';

describe('formatDate', () => {
  describe('with Date objects', () => {
    it('should format a date with default options', () => {
      const date = new Date(2024, 0, 15); // Month is 0-indexed
      const result = formatDate(date);
      expect(result).toBe('January 15, 2024');
    });

    it('should format current date', () => {
      const date = new Date(2024, 11, 25); // Month is 0-indexed
      const result = formatDate(date);
      expect(result).toBe('December 25, 2024');
    });
  });

  describe('with string dates', () => {
    it('should format ISO string date', () => {
      const result = formatDate('2024-01-15T12:00:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });

    it('should format date string with time', () => {
      const result = formatDate('2024-01-15T12:00:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });

    it('should format date string with timezone', () => {
      const result = formatDate('2024-01-15T12:00:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });
  });

  describe('with number timestamps', () => {
    it('should format timestamp in milliseconds', () => {
      const timestamp = new Date(2024, 0, 15).getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('January 15, 2024');
    });

    it('should format epoch timestamp', () => {
      const timestamp = new Date(2024, 0, 15).getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('January 15, 2024');
    });
  });

  describe('with custom options', () => {
    it('should format with short month', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, { month: 'short' });
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format with numeric month', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, { month: 'numeric' });
      expect(result).toBe('1/15/2024');
    });

    it('should format with 2-digit day', () => {
      const date = new Date(2024, 0, 5);
      const result = formatDate(date, { day: '2-digit' });
      expect(result).toBe('January 05, 2024');
    });

    it('should format with 2-digit year', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, { year: '2-digit' });
      expect(result).toBe('January 15, 24');
    });

    it('should format with multiple custom options', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, {
        month: 'short',
        day: '2-digit',
        year: '2-digit'
      });
      expect(result).toBe('Jan 15, 24');
    });

    it('should include weekday when specified', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, { weekday: 'long' });
      expect(result).toBe('Monday, January 15, 2024');
    });

    it('should include short weekday', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, { weekday: 'short' });
      expect(result).toBe('Mon, January 15, 2024');
    });

    it('should include time when specified', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      const result = formatDate(date, {
        hour: '2-digit',
        minute: '2-digit'
      });
      expect(result).toContain('January 15, 2024');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatDate(null as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('should handle invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('');
    });

    it('should handle invalid date object', () => {
      expect(formatDate(new Date('invalid'))).toBe('');
    });

    it('should handle NaN', () => {
      expect(formatDate(NaN)).toBe('');
    });

    it('should handle very old dates', () => {
      const result = formatDate(new Date(1900, 0, 1));
      expect(result).toBe('January 1, 1900');
    });

    it('should handle future dates', () => {
      const result = formatDate(new Date(2099, 11, 31));
      expect(result).toBe('December 31, 2099');
    });

    it('should handle leap year dates', () => {
      const result = formatDate(new Date(2024, 1, 29));
      expect(result).toBe('February 29, 2024');
    });
  });

  describe('with different locales (implicit)', () => {
    // The function uses 'en-US' locale by default
    it('should use US date format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date);
      expect(result).toBe('January 15, 2024');
    });
  });
});
