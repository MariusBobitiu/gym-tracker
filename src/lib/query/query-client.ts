import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { showQueryError } from "@/lib/query/query-error";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => showQueryError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => showQueryError(error),
  }),
});
