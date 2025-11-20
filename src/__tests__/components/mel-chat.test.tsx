/**
 * M.E.L. Chat Component Tests
 * Tests for MELChat component
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MELChat } from '@/components/portal/mel-chat';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('MELChat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial message', () => {
    render(<MELChat />);
    expect(screen.getByText(/Hello, I'm M.E.L./i)).toBeInTheDocument();
  });

  it('should display M.E.L. AI branding', () => {
    render(<MELChat />);
    expect(screen.getByText(/M.E.L. AI Coaching Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Powered by Claude Sonnet 4/i)).toBeInTheDocument();
  });

  it('should check M.E.L. status on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'active' }),
    });

    render(<MELChat />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/mel');
    });
  });

  it('should disable input when not configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'not_configured' }),
    });

    render(<MELChat />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
      expect(textarea).toBeDisabled();
    });
  });

  it('should show quick action buttons', () => {
    render(<MELChat />);
    expect(screen.getByText(/Analyze Formation/i)).toBeInTheDocument();
    expect(screen.getByText(/Triangle Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Game Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/Coaching Tips/i)).toBeInTheDocument();
  });

  it('should populate input when quick action clicked', () => {
    render(<MELChat />);
    const analyzeButton = screen.getByText(/Analyze Formation/i);
    fireEvent.click(analyzeButton);

    const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
    expect(textarea).toHaveValue(/Analyze a LARRY formation/i);
  });

  it('should send message on Enter key', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'active' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Test response',
          usage: { inputTokens: 10, outputTokens: 20 },
        }),
      });

    render(<MELChat />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
      expect(textarea).not.toBeDisabled();
    });

    const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
    fireEvent.change(textarea, { target: { value: 'Test question' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mel',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test question'),
        })
      );
    });
  });

  it('should display loading indicator while processing', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'active' }),
      })
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1000))
      );

    render(<MELChat />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
      expect(textarea).not.toBeDisabled();
    });

    const sendButton = screen.getByRole('button', { name: /send/i });
    const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/M.E.L. is thinking/i)).toBeInTheDocument();
    });
  });

  it('should accept custom placeholder', () => {
    render(<MELChat placeholder="Custom placeholder text" />);
    expect(screen.getByPlaceholderText(/Custom placeholder text/i)).toBeInTheDocument();
  });

  it('should pass context to API', async () => {
    const context = {
      formationId: 'test-123',
      classification: 'LARRY',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'active' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Test' }),
      });

    render(<MELChat context={context} />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
      expect(textarea).not.toBeDisabled();
    });

    const textarea = screen.getByPlaceholderText(/Ask about Triangle Defense/i);
    fireEvent.change(textarea, { target: { value: 'Question' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mel',
        expect.objectContaining({
          body: expect.stringContaining('LARRY'),
        })
      );
    });
  });
});
