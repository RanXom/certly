import { useMutation } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.users)["delete-account"]["$post"]
>;

export const useRequestDeleteAccount = () => {
  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.users["delete-account"].$post();

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Something went wrong",
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Confirmation email sent! Please check your inbox.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to request account deletion");
    },
  });

  return mutation;
};
