import { fabric } from "fabric";
import { useCallback, useRef, useState } from "react";
import { JSON_KEYS } from "@/features/editor/types";

interface UseHistoryProps {
  canvas: fabric.Canvas | null;
}

export const useHistory = ({ canvas }: UseHistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasHistory = useRef<string[]>([]);
  const skipSave = useRef(false);
  const historyIndexRef = useRef(0);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  const save = useCallback((skip = false) => {
    if (!canvas) return;

    const currentState = canvas.toJSON(JSON_KEYS);
    const json = JSON.stringify(currentState);

    if (!skip && !skipSave.current) {
      canvasHistory.current = canvasHistory.current.slice(0, historyIndexRef.current + 1);

      // Avoid saving duplicate sequential states
      if (canvasHistory.current.length > 0 &&
        canvasHistory.current[canvasHistory.current.length - 1] === json) {
        return;
      }

      canvasHistory.current.push(json);
      historyIndexRef.current = canvasHistory.current.length - 1;
      setHistoryIndex(historyIndexRef.current);
    }

    // TODO: Save callback
    // Save to DB
  }, [canvas]);

  const undo = useCallback(() => {
    if (canUndo()) {
      skipSave.current = true;
      canvas?.clear().renderAll();

      const previousIndex = historyIndex - 1;
      const previousState = JSON.parse(canvasHistory.current[previousIndex]);

      canvas?.loadFromJSON(previousState, () => {
        canvas.renderAll();
        setHistoryIndex(previousIndex);
        historyIndexRef.current = previousIndex;
        skipSave.current = false;
      });
    }
  }, [canUndo, canvas, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo()) {
      skipSave.current = true;
      canvas?.clear().renderAll();

      const nextIndex = historyIndex + 1;
      const nextState = JSON.parse(canvasHistory.current[nextIndex]);

      canvas?.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryIndex(nextIndex);
        historyIndexRef.current = nextIndex;
        skipSave.current = false;
      });
    }
  }, [canRedo, canvas, historyIndex]);

  return { save, canUndo, canRedo, undo, redo, setHistoryIndex, canvasHistory };
};
