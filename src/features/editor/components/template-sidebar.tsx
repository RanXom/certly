import { AlertTriangle, Crown, Loader } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TemplateSidebarProps {
    editor: Editor | undefined;
    activeTool: ActiveTool;
    onChangeActiveTool: (tool: ActiveTool) => void;
}

const TEMPLATES = [
    {
        id: "certificate_of_participation",
        name: "Participation",
        image: "/1.png",
        file: "/certificate_of_participation.json",
        isPro: false,
    },
];

export const TemplateSidebar = ({
    editor,
    activeTool,
    onChangeActiveTool,
}: TemplateSidebarProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const onClose = () => {
        onChangeActiveTool("select");
    };

    const onClick = async (template: typeof TEMPLATES[0]) => {
        try {
            setIsLoading(true);
            const res = await fetch(template.file);

            if (!res.ok) {
                throw new Error("Failed to load template");
            }

            const json = await res.json();
            editor?.loadJson(JSON.stringify(json));
        } catch (error) {
            console.error(error);
            window.alert("Failed to load template");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <aside
            className={cn(
                "bg-white relative border-r z-40 w-[360px] h-full flex flex-col",
                activeTool === "templates" ? "visible" : "hidden",
            )}
        >
            <ToolSidebarHeader
                title="Templates"
                description="Choose from a variety of templates to get started"
            />
            {isLoading && (
                <div className="flex items-center justify-center flex-1">
                    <Loader className="size-4 text-muted-foreground animate-spin" />
                </div>
            )}
            {!isLoading && (
                <ScrollArea>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            {TEMPLATES.map((template) => {
                                return (
                                    <button
                                        style={{
                                            aspectRatio: "1.414/1" // A4 landscape aspect ratio approx
                                        }}
                                        onClick={() => onClick(template)}
                                        key={template.id}
                                        className="relative w-full group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
                                    >
                                        <Image
                                            fill
                                            src={template.image}
                                            alt={template.name}
                                            className="object-cover"
                                        />
                                        {template.isPro && (
                                            <div className="absolute top-2 right-2 size-8 items-center flex justify-center bg-black/50 rounded-full">
                                                <Crown className="size-4 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        )}
                                        <div className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white hover:underline p-1 bg-black/50 text-left">
                                            {template.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>

            )}
            <ToolSidebarClose onClick={onClose} />
        </aside>
    );
};
