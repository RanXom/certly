import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":id"]["$patch"],
  200
>;
type Json = InferRequestType<
  (typeof client.api.projects)[":id"]["$patch"]
>["json"];

type Variables = {
  id: string;
  json: Json;
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, Variables>({
    mutationFn: async ({ id, json }) => {
      const response = await client.api.projects[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      return response.json();
    },

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({
        queryKey: ["project", { id }],
      });
    },

    onError: () => {
      toast.error("Failed to update project");
    },
  });

  return mutation;
};
