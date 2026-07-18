import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDuration, formatFileSize, getStatusBadge } from '../utils/format';

describe('formatCurrency', () => {
  it('formats KES currency', () => {
    expect(formatCurrency(100)).toBe('KES 100.00');
    expect(formatCurrency(1500.5)).toBe('KES 1,500.50');
    expect(formatCurrency(0)).toBe('KES 0.00');
  });
});

describe('formatDuration', () => {
  it('formats seconds into human readable', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(600)).toBe('10m');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('formats date strings', () => {
    expect(formatDate('2024-01-15')).toBeTruthy();
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(0)).toBe('');
  });
});

describe('getStatusBadge', () => {
  it('returns correct badge classes', () => {
    expect(getStatusBadge('active')).toBe('badge-success');
    expect(getStatusBadge('suspended')).toBe('badge-error');
    expect(getStatusBadge('pending')).toBe('badge-warning');
    expect(getStatusBadge('unknown')).toBe('badge-default');
  });
});
