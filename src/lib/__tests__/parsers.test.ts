import { describe, it, expect } from 'vitest';
import { getSortingStateParser, getFiltersStateParser } from '../parsers';

describe('getSortingStateParser', () => {
  describe('parse', () => {
    it('should parse valid sorting state', () => {
      const parser = getSortingStateParser();
      const input = JSON.stringify([
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ]);

      const result = parser.parse(input);

      expect(result).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ]);
    });

    it('should return null for invalid JSON', () => {
      const parser = getSortingStateParser();
      const result = parser.parse('invalid json');

      expect(result).toBeNull();
    });

    it('should return null for non-array input', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify({ id: 'name', desc: false }));

      expect(result).toBeNull();
    });

    it('should return null for invalid sorting item schema', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(
        JSON.stringify([{ id: 'name', desc: 'invalid' }])
      );

      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([{ id: 'name' }]));

      expect(result).toBeNull();
    });

    it('should parse empty array', () => {
      const parser = getSortingStateParser();
      const result = parser.parse(JSON.stringify([]));

      expect(result).toEqual([]);
    });
  });

  describe('parse with column validation', () => {
    it('should accept valid column IDs from array', () => {
      const parser = getSortingStateParser(['name', 'age']);
      const input = JSON.stringify([{ id: 'name', desc: false }]);

      const result = parser.parse(input);

      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should accept valid column IDs from Set', () => {
      const parser = getSortingStateParser(new Set(['name', 'age']));
      const input = JSON.stringify([{ id: 'name', desc: false }]);

      const result = parser.parse(input);

      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should return null for invalid column ID', () => {
      const parser = getSortingStateParser(['name', 'age']);
      const input = JSON.stringify([{ id: 'invalid', desc: false }]);

      const result = parser.parse(input);

      expect(result).toBeNull();
    });

    it('should return null if any column ID is invalid', () => {
      const parser = getSortingStateParser(['name', 'age']);
      const input = JSON.stringify([
        { id: 'name', desc: false },
        { id: 'invalid', desc: true }
      ]);

      const result = parser.parse(input);

      expect(result).toBeNull();
    });

    it('should accept all column IDs when validation is not provided', () => {
      const parser = getSortingStateParser();
      const input = JSON.stringify([
        { id: 'anyColumn', desc: false },
        { id: 'anotherColumn', desc: true }
      ]);

      const result = parser.parse(input);

      expect(result).not.toBeNull();
    });
  });

  describe('serialize', () => {
    it('should serialize sorting state to JSON', () => {
      const parser = getSortingStateParser();
      const input = [
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ];

      const result = parser.serialize(input as any);

      expect(result).toBe(JSON.stringify(input));
    });

    it('should serialize empty array', () => {
      const parser = getSortingStateParser();
      const result = parser.serialize([]);

      expect(result).toBe('[]');
    });
  });

  describe('eq (equality check)', () => {
    it('should return true for equal sorting states', () => {
      const parser = getSortingStateParser();
      const a = [
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ];
      const b = [
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(true);
    });

    it('should return false for different lengths', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different IDs', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [{ id: 'age', desc: false }];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different desc values', () => {
      const parser = getSortingStateParser();
      const a = [{ id: 'name', desc: false }];
      const b = [{ id: 'name', desc: true }];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return true for empty arrays', () => {
      const parser = getSortingStateParser();
      const result = parser.eq([], []);

      expect(result).toBe(true);
    });

    it('should return false for different order', () => {
      const parser = getSortingStateParser();
      const a = [
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ];
      const b = [
        { id: 'age', desc: true },
        { id: 'name', desc: false }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });
  });
});

describe('getFiltersStateParser', () => {
  describe('parse', () => {
    it('should parse valid filter state', () => {
      const parser = getFiltersStateParser();
      const input = JSON.stringify([
        {
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        }
      ]);

      const result = parser.parse(input);

      expect(result).toEqual([
        {
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        }
      ]);
    });

    it('should parse filter with array value', () => {
      const parser = getFiltersStateParser();
      const input = JSON.stringify([
        {
          id: 'status',
          value: ['active', 'pending'],
          variant: 'multiSelect',
          operator: 'inArray',
          filterId: '1'
        }
      ]);

      const result = parser.parse(input);

      expect(result).toEqual([
        {
          id: 'status',
          value: ['active', 'pending'],
          variant: 'multiSelect',
          operator: 'inArray',
          filterId: '1'
        }
      ]);
    });

    it('should return null for invalid JSON', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse('invalid json');

      expect(result).toBeNull();
    });

    it('should return null for non-array input', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify({
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        })
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid filter schema', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'John',
            variant: 'invalid',
            operator: 'iLike',
            filterId: '1'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(
        JSON.stringify([
          {
            id: 'name',
            value: 'John'
          }
        ])
      );

      expect(result).toBeNull();
    });

    it('should parse empty array', () => {
      const parser = getFiltersStateParser();
      const result = parser.parse(JSON.stringify([]));

      expect(result).toEqual([]);
    });
  });

  describe('parse with column validation', () => {
    it('should accept valid column IDs from array', () => {
      const parser = getFiltersStateParser(['name', 'email']);
      const input = JSON.stringify([
        {
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        }
      ]);

      const result = parser.parse(input);

      expect(result).not.toBeNull();
    });

    it('should accept valid column IDs from Set', () => {
      const parser = getFiltersStateParser(new Set(['name', 'email']));
      const input = JSON.stringify([
        {
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        }
      ]);

      const result = parser.parse(input);

      expect(result).not.toBeNull();
    });

    it('should return null for invalid column ID', () => {
      const parser = getFiltersStateParser(['name', 'email']);
      const input = JSON.stringify([
        {
          id: 'invalid',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        }
      ]);

      const result = parser.parse(input);

      expect(result).toBeNull();
    });

    it('should return null if any column ID is invalid', () => {
      const parser = getFiltersStateParser(['name', 'email']);
      const input = JSON.stringify([
        {
          id: 'name',
          value: 'John',
          variant: 'text',
          operator: 'iLike',
          filterId: '1'
        },
        {
          id: 'invalid',
          value: 'test',
          variant: 'text',
          operator: 'iLike',
          filterId: '2'
        }
      ]);

      const result = parser.parse(input);

      expect(result).toBeNull();
    });
  });

  describe('serialize', () => {
    it('should serialize filter state to JSON', () => {
      const parser = getFiltersStateParser();
      const input = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];

      const result = parser.serialize(input as any);

      expect(result).toBe(JSON.stringify(input));
    });

    it('should serialize empty array', () => {
      const parser = getFiltersStateParser();
      const result = parser.serialize([]);

      expect(result).toBe('[]');
    });
  });

  describe('eq (equality check)', () => {
    it('should return true for equal filter states', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(true);
    });

    it('should return false for different lengths', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        },
        {
          id: 'email',
          value: 'test',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '2'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different IDs', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'email',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different values', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'Jane',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different variants', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'John',
          variant: 'select' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return false for different operators', () => {
      const parser = getFiltersStateParser();
      const a = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'iLike' as const,
          filterId: '1'
        }
      ];
      const b = [
        {
          id: 'name',
          value: 'John',
          variant: 'text' as const,
          operator: 'eq' as const,
          filterId: '1'
        }
      ];

      const result = parser.eq(a as any, b as any);

      expect(result).toBe(false);
    });

    it('should return true for empty arrays', () => {
      const parser = getFiltersStateParser();
      const result = parser.eq([], []);

      expect(result).toBe(true);
    });
  });
});
