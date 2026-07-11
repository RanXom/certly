import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.users)["forgot-password"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.users)["forgot-password"]["$post"]
>["json"];

export const useForgotPassword = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.users["forgot-password"].$post({
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
    onError: (error) => {
      toast.error(error.message || "Failed to send reset link");
    },
  });

  return mutation;
};
