import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.users)["change-password"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.users)["change-password"]["$post"]
>["json"];

export const useChangePassword = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.users["change-password"].$post({
        json,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Something went wrong",
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  return mutation;
};
