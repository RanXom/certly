import { useState, useRef } from "react";
import Papa from "papaparse";
import { Download, Upload, Mail } from "lucide-react";
import { toast } from "sonner";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";


import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

    // Email bulk states
    const [emailColumn, setEmailColumn] = useState<string>("");
    const [emailSubject, setEmailSubject] = useState<string>("Your Certificate");
    const [emailBody, setEmailBody] = useState<string>("Here is your generated certificate!");
    const [isEmailing, setIsEmailing] = useState(false);

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

                    // Auto-detect email field
                    const emailField = results.meta.fields.find(f => f.toLowerCase().includes("email"));
                    if (emailField) setEmailColumn(emailField);
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

    const handleEmail = async () => {
        if (!editor || parsedData.length === 0 || !emailColumn) return;
        setIsEmailing(true);
        const result = await editor.emailBulk(parsedData, emailColumn, emailSubject, emailBody, format);
        setIsEmailing(false);

        if (result) {
            if (result.failed === 0) {
                toast.success(`Successfully sent ${result.success} emails!`, {
                    duration: 4000,
                });
            } else if (result.success === 0) {
                toast.error(`Failed to send ${result.failed} emails.`, {
                    duration: 4000,
                });
            } else {
                toast.warning(`Sent ${result.success} emails, but ${result.failed} failed.`, {
                    duration: 4000,
                });
            }
        }
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
                description="Generate bulk certificatees using a CSV file."
            />

            <div className="flex-1 overflow-y-auto">
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
                            disabled={parsedData.length === 0 || isExporting || isEmailing}
                            variant="outline"
                        >
                            {isExporting ? "Generating Zip..." : "Export Zip"}
                            {!isExporting && <Download className="size-4 ml-2" />}
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">4. Send Emails</h3>
                        <p className="text-xs text-muted-foreground">
                            Automatically generate and email certificates.
                        </p>

                        <div className="space-y-2">
                            <Label>Email Column</Label>
                            <Select value={emailColumn} onValueChange={setEmailColumn}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select email column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fields.map((field) => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email Subject"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Body</Label>
                            <textarea
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                placeholder="Email Body"
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                            />
                        </div>

                        <Button
                            onClick={handleEmail}
                            className="w-full"
                            disabled={parsedData.length === 0 || isEmailing || isExporting || !emailColumn}
                        >
                            {isEmailing ? "Sending Emails..." : "Send Emails"}
                            {!isEmailing && <Mail className="size-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </div>

            <ToolSidebarClose onClick={onClose} />
        </aside>
    );
};
