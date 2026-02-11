import { ChevronsLeft } from "lucide-react";

interface ToolSidebarCloseProps {
  onClick: () => void;
}

export const ToolSidebarClose = ({ onClick }: ToolSidebarCloseProps) => {
  return (
    <button onClick={onClick}>
      <ChevronsLeft className="size-4 text-black group-hover:opacity-75 transition" />
    </button>
  );
};
