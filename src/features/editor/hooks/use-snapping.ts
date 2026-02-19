import { fabric } from "fabric";
import { useEffect } from "react";

interface UseSnappingProps {
    canvas: fabric.Canvas | null;
}

const SNAP_THRESHOLD = 5;
const GUIDELINE_COLOR = "rgba(0, 157, 255, 1)"; // Light blue
const GUIDELINE_WIDTH = 1;

export const useSnapping = ({ canvas }: UseSnappingProps) => {
    useEffect(() => {
        if (!canvas) return;

        const handleObjectMoving = (e: fabric.IEvent) => {
            const object = e.target as fabric.Object;
            if (!object) return;

            const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
            if (!workspace) return;

            const workspaceCenter = workspace.getCenterPoint();
            const centerX = workspaceCenter.x;
            const centerY = workspaceCenter.y;

            const objectCenter = object.getCenterPoint();

            // We will track if we snapped to center to show/hide lines
            let snappedVertical = false;
            let snappedHorizontal = false;

            // Vertical Line (Snapping to horizontal center)
            if (Math.abs(objectCenter.x - centerX) < SNAP_THRESHOLD) {
                object.setPositionByOrigin(
                    new fabric.Point(centerX, objectCenter.y),
                    "center",
                    "center"
                );
                snappedVertical = true;
            }

            // Horizontal Line (Snapping to vertical center)
            if (Math.abs(objectCenter.y - centerY) < SNAP_THRESHOLD) {
                object.setPositionByOrigin(
                    new fabric.Point(objectCenter.x, centerY),
                    "center",
                    "center"
                );
                snappedHorizontal = true;
            }

            // Clear existing guidelines
            canvas.getObjects("line").forEach((obj) => {
                if (
                    obj.name === "vertical-guideline" ||
                    obj.name === "horizontal-guideline"
                ) {
                    canvas.remove(obj);
                }
            });

            // Draw vertical guideline
            if (snappedVertical) {
                const line = new fabric.Line([centerX, 0, centerX, canvas.getHeight()], {
                    stroke: GUIDELINE_COLOR,
                    strokeWidth: GUIDELINE_WIDTH,
                    selectable: false,
                    evented: false,
                    name: "vertical-guideline",
                });
                canvas.add(line);
            }

            // Draw horizontal guideline
            if (snappedHorizontal) {
                const line = new fabric.Line([0, centerY, canvas.getWidth(), centerY], {
                    stroke: GUIDELINE_COLOR,
                    strokeWidth: GUIDELINE_WIDTH,
                    selectable: false,
                    evented: false,
                    name: "horizontal-guideline",
                });
                canvas.add(line);
            }

            // If we snapped, we might need to re-render to show the lines immediately
            if (snappedVertical || snappedHorizontal) {
                canvas.requestRenderAll();
            }
        };

        const clearGuidelines = () => {
            canvas.getObjects("line").forEach((obj) => {
                if (
                    obj.name === "vertical-guideline" ||
                    obj.name === "horizontal-guideline"
                ) {
                    canvas.remove(obj);
                }
            });
            canvas.requestRenderAll();
        };

        canvas.on("object:moving", handleObjectMoving);
        canvas.on("mouse:up", clearGuidelines);

        return () => {
            canvas.off("object:moving", handleObjectMoving);
            canvas.off("mouse:up", clearGuidelines);
        };
    }, [canvas]);
};
