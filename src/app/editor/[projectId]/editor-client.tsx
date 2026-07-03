"use client";

import { ResponseType } from "@/features/projects/api/use-get-project";
import dynamic from "next/dynamic";

// Forcing CSR in order to avoid missing jsdom runtime error
const Editor = dynamic(
  () => import("@/features/editor/components/editor").then((mod) => mod.Editor),
  { ssr: false },
);

interface EditorClientProps {
  initialData: ResponseType["data"];
}

export const EditorClient = ({ initialData }: EditorClientProps) => {
  return <Editor />;
};
