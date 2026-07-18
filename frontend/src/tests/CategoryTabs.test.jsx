import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryTabs from '../components/CategoryTabs';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('CategoryTabs', () => {
  it('renders All tab by default', () => {
    render(<CategoryTabs selected="" onSelect={() => {}} />, { wrapper: Wrapper });
    expect(screen.getByText('All')).toBeInTheDocument();
  });
});
