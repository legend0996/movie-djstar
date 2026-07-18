import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export function useFetch(key, url, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      if (!url) return null;
      const { data } = await client.get(url, { params: options.params });
      return data;
    },
    enabled: !!url,
    ...options,
  });
}

export function usePost(url, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await client.post(url, body);
      return data;
    },
    ...options,
    onSuccess: (...args) => {
      if (options.invalidate) {
        options.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
      options.onSuccess?.(...args);
    },
  });
}

export function usePut(url, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await client.put(url, body);
      return data;
    },
    ...options,
    onSuccess: (...args) => {
      if (options.invalidate) {
        options.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
      options.onSuccess?.(...args);
    },
  });
}
