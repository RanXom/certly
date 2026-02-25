import { fabric } from "fabric";
import { useEffect } from "react";

interface UseCanvasEventsProps {
    save: () => void;
    canvas: fabric.Canvas | null;
    setSelectedObjects: (objects: fabric.Object[]) => void;
    clearSelectionCallback?: () => void;
};

export const useCanvasEvents = ({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
}: UseCanvasEventsProps) => {
    useEffect(() => {
        if (canvas) {
            canvas.on("object:added", (e) => {
                const object = e.target;
                if (object?.name === "vertical-guideline" || object?.name === "horizontal-guideline") return;
                save();
            });
            canvas.on("object:removed", (e) => {
                const object = e.target;
                if (object?.name === "vertical-guideline" || object?.name === "horizontal-guideline") return;
                save();
            });
            canvas.on("object:modified", (e) => {
                const object = e.target;
                if (object?.name === "vertical-guideline" || object?.name === "horizontal-guideline") return;
                save();
            });
            canvas.on("selection:created", (e) => {
                setSelectedObjects(e.selected || []);
            });
            canvas.on("selection:updated", (e) => {
                setSelectedObjects(e.selected || []);
            });
            canvas.on("selection:cleared", () => {
                setSelectedObjects([]);
                clearSelectionCallback?.();
            });
        }

        return () => {
            if (canvas) {
                canvas.off("selection:added")
                canvas.off("selection:removed")
                canvas.off("selection:modified")
                canvas.off("selection:created")
                canvas.off("selection:updated")
                canvas.off("selection:cleared")
            }
        };
    }, [
        save,
        canvas,
        setSelectedObjects,
        clearSelectionCallback
    ]);
};