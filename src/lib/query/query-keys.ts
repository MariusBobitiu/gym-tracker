type QueryKeyParams = Record<string, unknown>;

export const queryKeys = {
  scope: (key: string) => ({
    all: () => [key] as const,
    list: (params?: QueryKeyParams) =>
      params ? ([key, "list", params] as const) : ([key, "list"] as const),
    detail: (id: string | number) => [key, "detail", id] as const,
  }),
};
