/**
 * Formations API Tests
 * Tests for /api/formations endpoint
 */

import { describe, it, expect } from '@jest/globals';

describe('Formations API', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  describe('GET /api/formations', () => {
    it('should return formations list', async () => {
      const response = await fetch(`${API_URL}/api/formations`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter by classification', async () => {
      const response = await fetch(`${API_URL}/api/formations?classification=LARRY`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.every((f: any) => f.classification === 'LARRY')).toBe(true);
    });

    it('should filter by minSuccessRate', async () => {
      const minRate = 60;
      const response = await fetch(`${API_URL}/api/formations?minSuccessRate=${minRate}`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.every((f: any) => f.successRate >= minRate)).toBe(true);
    });

    it('should include analytics', async () => {
      const response = await fetch(`${API_URL}/api/formations`);
      const data = await response.json();

      expect(data).toHaveProperty('analytics');
      expect(data.analytics).toHaveProperty('totalFormations');
      expect(data.analytics).toHaveProperty('avgSuccessRate');
      expect(data.analytics).toHaveProperty('mostCommon');
    });

    it('should search by name', async () => {
      const response = await fetch(`${API_URL}/api/formations?search=trips`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/formations', () => {
    it('should analyze formation', async () => {
      const response = await fetch(`${API_URL}/api/formations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId: '1',
          situation: {
            down: 1,
            distance: 10,
            fieldPosition: '50',
          },
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('formation');
      expect(data.data).toHaveProperty('analysis');
    });

    it('should return 400 for missing formationId', async () => {
      const response = await fetch(`${API_URL}/api/formations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should include triangle defense analysis', async () => {
      const response = await fetch(`${API_URL}/api/formations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formationId: '1' }),
      });
      const data = await response.json();

      expect(data.data.analysis).toHaveProperty('optimalTriangle');
      expect(data.data.analysis).toHaveProperty('positions');
      expect(data.data.analysis).toHaveProperty('coverageSchemes');
      expect(data.data.analysis).toHaveProperty('rushPatterns');
    });

    it('should generate recommendations', async () => {
      const response = await fetch(`${API_URL}/api/formations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formationId: '1' }),
      });
      const data = await response.json();

      expect(data.data).toHaveProperty('recommendations');
      expect(Array.isArray(data.data.recommendations)).toBe(true);
      expect(data.data.recommendations.length).toBeGreaterThan(0);
    });
  });
});
