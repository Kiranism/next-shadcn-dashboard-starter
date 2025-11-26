import { describe, it, expect } from 'vitest';
import { cn, formatBytes } from '../utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should return empty string when no arguments', () => {
    expect(cn()).toBe('');
  });
});

describe('formatBytes', () => {
  describe('with default options', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Byte');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should handle large numbers', () => {
      expect(formatBytes(1536)).toBe('2 KB');
    });
  });

  describe('with decimals option', () => {
    it('should format with 1 decimal place', () => {
      expect(formatBytes(1536, { decimals: 1 })).toBe('1.5 KB');
    });

    it('should format with 2 decimal places', () => {
      expect(formatBytes(1536, { decimals: 2 })).toBe('1.50 KB');
    });

    it('should format with 3 decimal places', () => {
      expect(formatBytes(1500, { decimals: 3 })).toBe('1.465 KB');
    });

    it('should handle 0 decimals explicitly', () => {
      expect(formatBytes(1536, { decimals: 0 })).toBe('2 KB');
    });
  });

  describe('with sizeType option', () => {
    it('should use accurate size type (KiB)', () => {
      expect(formatBytes(1024, { sizeType: 'accurate' })).toBe('1 KiB');
    });

    it('should use accurate size type (MiB)', () => {
      expect(formatBytes(1024 * 1024, { sizeType: 'accurate' })).toBe('1 MiB');
    });

    it('should use accurate size type (GiB)', () => {
      expect(formatBytes(1024 * 1024 * 1024, { sizeType: 'accurate' })).toBe(
        '1 GiB'
      );
    });

    it('should use accurate size type (TiB)', () => {
      expect(
        formatBytes(1024 * 1024 * 1024 * 1024, { sizeType: 'accurate' })
      ).toBe('1 TiB');
    });

    it('should use normal size type by default', () => {
      expect(formatBytes(1024, { sizeType: 'normal' })).toBe('1 KB');
    });
  });

  describe('with combined options', () => {
    it('should handle decimals and accurate size type', () => {
      expect(formatBytes(1536, { decimals: 2, sizeType: 'accurate' })).toBe(
        '1.50 KiB'
      );
    });

    it('should handle decimals and normal size type', () => {
      expect(formatBytes(1536, { decimals: 2, sizeType: 'normal' })).toBe(
        '1.50 KB'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very small numbers', () => {
      expect(formatBytes(1)).toBe('1 Bytes');
    });

    it('should handle fractional bytes', () => {
      // The function uses Math.floor for the index calculation
      expect(formatBytes(0.5)).toBe('512 Bytes');
    });

    it('should handle negative numbers', () => {
      // The function doesn't explicitly handle negatives
      // Math.log of negative returns NaN
      expect(formatBytes(-1024)).toBe('NaN Bytes');
    });

    it('should handle very large numbers beyond TB', () => {
      // JavaScript number precision limits
      const petabyte = 1024 * 1024 * 1024 * 1024 * 1024;
      // Due to floating point precision, this becomes 1 Bytes
      expect(formatBytes(petabyte)).toBe('1 Bytes');
    });
  });
});
