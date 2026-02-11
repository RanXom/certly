import { fabric } from "fabric";
import { useCallback, useMemo, useState } from "react";

import {
  BuildEditorProps,
  CIRCLE_OPTIONS,
  Editor,
  RECTANGLE_OPTIONS,
  TRIANGLE_OPTONS,
} from "@/features/editor/types";
import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";

const buildEditor = ({ canvas }: BuildEditorProps): Editor => {
  const getWorkspace = () => {
    return canvas
      .getObjects()
      .find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const center = workspace?.getCenterPoint();

    if(!center) return;

    // @ts-ignore
    canvas._centerObject(object, center);
  };

  const addToCanvas = (object: fabric.Object) => {
      center(object);
      canvas.add(object);
      canvas.setActiveObject(object);
  };

  return {
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
      });

      addToCanvas(object);
    },

    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx:25,
        ry:25,
      });

      addToCanvas(object);
    },

    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
      });

      addToCanvas(object);
    },

    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTONS,
      });

      addToCanvas(object);
    },

    addInverseTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTONS,
        angle: 180,
      });

      addToCanvas(object);
    },
  };
};

export const useEditor = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useAutoResize({ canvas, container });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        canvas,
      });
    }

    return undefined;
  }, [canvas]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: 1200,
        height: 900,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);
    },
    [],
  );

  return { init, editor };
};
