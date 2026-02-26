import { useState, useRef } from "react";
import Papa from "papaparse";
import { Download, Upload } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface BulkExportSidebarProps {
    editor: Editor | undefined;
    activeTool: ActiveTool;
    onChangeActiveTool: (tool: ActiveTool) => void;
}

export const BulkExportSidebar = ({
    editor,
    activeTool,
    onChangeActiveTool,
}: BulkExportSidebarProps) => {
    const [fields, setFields] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [format, setFormat] = useState<"png" | "jpg" | "svg">("png");
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onClose = () => {
        onChangeActiveTool("select");
    };

    const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields) {
                    setFields(results.meta.fields);
                    setParsedData(results.data);
                }
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
            },
        });

        // reset
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const addFieldToCanvas = (field: string) => {
        editor?.addText(`{{${field}}}`);
    };

    const handleExport = async () => {
        if (!editor || parsedData.length === 0) return;
        setIsExporting(true);
        await editor.saveBulk(parsedData, format);
        setIsExporting(false);
    };

    return (
        <aside
            className={cn(
                "bg-white relative border-r z-40 w-[360px] h-full flex flex-col",
                activeTool === "bulk-export" ? "visible" : "hidden"
            )}
        >
            <ToolSidebarHeader
                title="Bulk Export"
                description="Generate multiple variations of your design using a CSV file."
            />

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">1. Upload Data</h3>
                        <div className="flex flex-col gap-y-2">
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={onFileUpload}
                            />
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                Upload CSV
                            </Button>
                            {parsedData.length > 0 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Loaded {parsedData.length} rows.
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">2. Add Variables</h3>
                        <p className="text-xs text-muted-foreground">
                            Click to add these variables to your design. They will be replaced during export.
                        </p>
                        {fields.length > 0 ? (
                            <div className="space-y-2">
                                {fields.map((field) => (
                                    <div key={field} className="flex items-center justify-between p-2 border rounded-md">
                                        <span className="text-sm font-medium">{field}</span>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => addFieldToCanvas(field)}
                                        >
                                            Add to canvas
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                Upload a CSV to see variables
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">3. Export</h3>
                        <div className="space-y-2">
                            <Label>Format</Label>
                            <Select
                                value={format}
                                onValueChange={(value: "png" | "jpg" | "svg") => setFormat(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="jpg">JPG</SelectItem>
                                    <SelectItem value="svg">SVG</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleExport}
                            className="w-full"
                            disabled={parsedData.length === 0 || isExporting}
                        >
                            {isExporting ? "Generating Zip..." : "Export Zip"}
                            {!isExporting && <Download className="size-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            <ToolSidebarClose onClick={onClose} />
        </aside>
    );
};
