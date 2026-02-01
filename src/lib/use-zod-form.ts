import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import type { ZodType } from "zod";

type UseZodFormOptions<T extends FieldValues> = Omit<
  UseFormProps<T>,
  "resolver"
>;

export function useZodForm<T extends FieldValues>(
  schema: ZodType<T, any>,
  options?: UseZodFormOptions<T>
) {
  return useForm<T>({
    ...options,
    resolver: zodResolver(schema),
  });
}
