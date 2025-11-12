import { describe, it, expect, vi } from 'vitest';
import {
  getCommonPinningStyles,
  getFilterOperators,
  getDefaultFilterOperator,
  getValidFilters
} from '../data-table';
import type { Column } from '@tanstack/react-table';
import type { ExtendedColumnFilter } from '@/types/data-table';

describe('getCommonPinningStyles', () => {
  const createMockColumn = (
    isPinned: false | 'left' | 'right',
    isLastLeft = false,
    isFirstRight = false,
    start = 0,
    after = 0,
    size = 100
  ): Column<any> =>
    ({
      getIsPinned: vi.fn(() => isPinned),
      getIsLastColumn: vi.fn(() => isLastLeft),
      getIsFirstColumn: vi.fn(() => isFirstRight),
      getStart: vi.fn(() => start),
      getAfter: vi.fn(() => after),
      getSize: vi.fn(() => size)
    }) as any;

  describe('unpinned columns', () => {
    it('should return relative position for unpinned column', () => {
      const column = createMockColumn(false);
      const styles = getCommonPinningStyles({ column });

      expect(styles.position).toBe('relative');
      expect(styles.opacity).toBe(1);
      expect(styles.zIndex).toBe(0);
      expect(styles.left).toBeUndefined();
      expect(styles.right).toBeUndefined();
    });

    it('should not have box shadow without border', () => {
      const column = createMockColumn(false);
      const styles = getCommonPinningStyles({ column, withBorder: false });

      expect(styles.boxShadow).toBeUndefined();
    });
  });

  describe('left pinned columns', () => {
    it('should return sticky position for left pinned column', () => {
      const column = createMockColumn('left', false, false, 50);
      const styles = getCommonPinningStyles({ column });

      expect(styles.position).toBe('sticky');
      expect(styles.left).toBe('50px');
      expect(styles.right).toBeUndefined();
      expect(styles.opacity).toBe(0.97);
      expect(styles.zIndex).toBe(1);
    });

    it('should add left border shadow for last left pinned column', () => {
      const column = createMockColumn('left', true, false, 50);
      const styles = getCommonPinningStyles({ column, withBorder: true });

      expect(styles.boxShadow).toBe('-4px 0 4px -4px hsl(var(--border)) inset');
    });

    it('should not add border shadow when withBorder is false', () => {
      const column = createMockColumn('left', true, false, 50);
      const styles = getCommonPinningStyles({ column, withBorder: false });

      expect(styles.boxShadow).toBeUndefined();
    });
  });

  describe('right pinned columns', () => {
    it('should return sticky position for right pinned column', () => {
      const column = createMockColumn('right', false, false, 0, 100);
      const styles = getCommonPinningStyles({ column });

      expect(styles.position).toBe('sticky');
      expect(styles.right).toBe('100px');
      expect(styles.left).toBeUndefined();
      expect(styles.opacity).toBe(0.97);
      expect(styles.zIndex).toBe(1);
    });

    it('should add right border shadow for first right pinned column', () => {
      const column = createMockColumn('right', false, true, 0, 100);
      const styles = getCommonPinningStyles({ column, withBorder: true });

      expect(styles.boxShadow).toBe('4px 0 4px -4px hsl(var(--border)) inset');
    });
  });

  describe('column size', () => {
    it('should include column width', () => {
      const column = createMockColumn(false, false, false, 0, 0, 150);
      const styles = getCommonPinningStyles({ column });

      expect(styles.width).toBe(150);
    });
  });

  describe('background color', () => {
    it('should use background color for all columns', () => {
      const unpinned = createMockColumn(false);
      const leftPinned = createMockColumn('left');
      const rightPinned = createMockColumn('right');

      expect(getCommonPinningStyles({ column: unpinned }).background).toBe(
        'hsl(var(--background))'
      );
      expect(getCommonPinningStyles({ column: leftPinned }).background).toBe(
        'hsl(var(--background))'
      );
      expect(getCommonPinningStyles({ column: rightPinned }).background).toBe(
        'hsl(var(--background))'
      );
    });
  });
});

describe('getFilterOperators', () => {
  it('should return text operators for text variant', () => {
    const operators = getFilterOperators('text');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
    expect(operators.length).toBeGreaterThan(0);
  });

  it('should return number operators for number variant', () => {
    const operators = getFilterOperators('number');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return number operators for range variant', () => {
    const operators = getFilterOperators('range');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return date operators for date variant', () => {
    const operators = getFilterOperators('date');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return date operators for dateRange variant', () => {
    const operators = getFilterOperators('dateRange');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return boolean operators for boolean variant', () => {
    const operators = getFilterOperators('boolean');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return select operators for select variant', () => {
    const operators = getFilterOperators('select');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should return multiSelect operators for multiSelect variant', () => {
    const operators = getFilterOperators('multiSelect');
    expect(operators).toBeDefined();
    expect(Array.isArray(operators)).toBe(true);
  });

  it('should have label and value properties', () => {
    const operators = getFilterOperators('text');
    operators.forEach((op) => {
      expect(op).toHaveProperty('label');
      expect(op).toHaveProperty('value');
      expect(typeof op.label).toBe('string');
      expect(typeof op.value).toBe('string');
    });
  });
});

describe('getDefaultFilterOperator', () => {
  it('should return iLike for text variant', () => {
    const operator = getDefaultFilterOperator('text');
    expect(operator).toBe('iLike');
  });

  it('should return first operator for number variant', () => {
    const operator = getDefaultFilterOperator('number');
    expect(operator).toBeDefined();
    expect(typeof operator).toBe('string');
  });

  it('should return first operator for date variant', () => {
    const operator = getDefaultFilterOperator('date');
    expect(operator).toBeDefined();
    expect(typeof operator).toBe('string');
  });

  it('should return first operator for boolean variant', () => {
    const operator = getDefaultFilterOperator('boolean');
    expect(operator).toBeDefined();
    expect(typeof operator).toBe('string');
  });

  it('should return first operator for select variant', () => {
    const operator = getDefaultFilterOperator('select');
    expect(operator).toBeDefined();
    expect(typeof operator).toBe('string');
  });

  it('should fallback to iLike for unknown variants', () => {
    // Unknown variants get text operators, so first operator is 'iLike'
    const operator = getDefaultFilterOperator('unknown' as any);
    expect(operator).toBe('iLike');
  });
});

describe('getValidFilters', () => {
  it('should return filters with non-empty string values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: 'John',
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(filters[0]);
  });

  it('should return filters with non-empty array values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'status',
        value: ['active', 'pending'],
        variant: 'multiSelect',
        operator: 'inArray',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(filters[0]);
  });

  it('should filter out empty string values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: '',
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(0);
  });

  it('should filter out empty array values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'status',
        value: [],
        variant: 'multiSelect',
        operator: 'inArray',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(0);
  });

  it('should filter out null values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: null as any,
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(0);
  });

  it('should filter out undefined values', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: undefined as any,
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(0);
  });

  it('should keep isEmpty operator regardless of value', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: '',
        variant: 'text',
        operator: 'isEmpty',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(1);
  });

  it('should keep isNotEmpty operator regardless of value', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: '',
        variant: 'text',
        operator: 'isNotEmpty',
        filterId: '1'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(1);
  });

  it('should handle mixed valid and invalid filters', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: 'John',
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      },
      {
        id: 'email',
        value: '',
        variant: 'text',
        operator: 'iLike',
        filterId: '2'
      },
      {
        id: 'status',
        value: ['active'],
        variant: 'multiSelect',
        operator: 'inArray',
        filterId: '3'
      },
      {
        id: 'tags',
        value: [],
        variant: 'multiSelect',
        operator: 'inArray',
        filterId: '4'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('name');
    expect(result[1]?.id).toBe('status');
  });

  it('should return empty array for all invalid filters', () => {
    const filters: ExtendedColumnFilter<any>[] = [
      {
        id: 'name',
        value: '',
        variant: 'text',
        operator: 'iLike',
        filterId: '1'
      },
      {
        id: 'status',
        value: [],
        variant: 'multiSelect',
        operator: 'inArray',
        filterId: '2'
      }
    ];

    const result = getValidFilters(filters);
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty input', () => {
    const result = getValidFilters([]);
    expect(result).toHaveLength(0);
  });
});
