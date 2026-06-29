import { protectServer } from "@/features/auth/utils";
import { EditorClient } from "./editor-client";

const EditorProjectIdPage = async () => {
  await protectServer();

  return <EditorClient />;
};

export default EditorProjectIdPage;
