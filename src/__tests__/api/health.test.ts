/**
 * Health Check API Tests
 * Tests for /api/health endpoint
 */

import { describe, it, expect } from '@jest/globals';

describe('Health Check API', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  it('should return 200 status code', async () => {
    const response = await fetch(`${API_URL}/api/health`);
    expect(response.status).toBe(200);
  });

  it('should return valid health status', async () => {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('services');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  });

  it('should include service checks', async () => {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    expect(data.services).toHaveProperty('graphql');
    expect(data.services).toHaveProperty('database');
    expect(data.services).toHaveProperty('ai');
  });

  it('should include environment information', async () => {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('version');
  });

  it('should set correct cache headers', async () => {
    const response = await fetch(`${API_URL}/api/health`);

    expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
