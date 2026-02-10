"use client";

import { useEditor } from "@/features/editor/hooks/use-editor";
import { useEffect, useRef } from "react";

export const Editor = () => {
    const { init } = useEditor();

    const canvasRef = useRef(null);
    const workspaceRef = useRef(null);

    useEffect(() => {
        init();
    }, [init]);

    return (
        <div ref={workspaceRef}>
            <canvas ref={canvasRef} />
        </div>
    );
};