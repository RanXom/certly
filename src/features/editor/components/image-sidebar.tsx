import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";

import { cn } from "@/lib/utils";


interface ImageSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ImageSidebarProps) => {
  const value = editor?.getActiveFontFamily();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-40 w-[360px] h-full flex flex-col overflow-hidden",
        activeTool === "images" ? "visible" : "hidden",
      )}
    >
      <ToolSidebarHeader title="Images" description="Add images to your canvas" />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-1 border-b">

        </div>
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
