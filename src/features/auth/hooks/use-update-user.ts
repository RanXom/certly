import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.users)["$patch"]>;
type RequestType = InferRequestType<(typeof client.api.users)["$patch"]>["json"];

export const useUpdateUser = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.users.$patch({ json });

      if (!response.ok) {
        const data = await response.json();
        throw new Error((data as { error?: string }).error || "Something went wrong");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  return mutation;
};
