import { fabric } from "fabric";
import { useEffect } from "react";

interface UseCanvasEventsProps {
    canvas: fabric.Canvas | null;
    setSelectedObjects: (objects: fabric.Object[]) => void;
};

export const useCanvasEvents = ({
    canvas,
    setSelectedObjects
}: UseCanvasEventsProps) => {
    useEffect(() => {
        if (canvas) {
            canvas.on("selection:created", (e) => {
                setSelectedObjects(e.selected || []);
                console.log("selection created");
            });
            canvas.on("selection:updated", (e) => {
                setSelectedObjects(e.selected || []);
                console.log("selection updated");
            });
            canvas.on("selection:cleared", () => {
                setSelectedObjects([]);
                console.log("selection cleared");
            });
        }

        return () => {
            if (canvas) {
                canvas.off("selection:created")
                canvas.off("selection:updated")
                canvas.off("selection:cleared")
            }
        };
    }, [
        canvas,
        setSelectedObjects  // No need for this, this is from useState
    ]);
};