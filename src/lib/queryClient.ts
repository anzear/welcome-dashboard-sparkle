import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    });
  } else {
    // Browser: create a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      });
    }
    return browserQueryClient;
  }
}
