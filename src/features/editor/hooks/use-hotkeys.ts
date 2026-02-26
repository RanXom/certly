import { fabric } from "fabric";

interface UseHotkeysProps {
    canvas: fabric.Canvas | null;
    undo: () => void;
    redo: () => void;
    save: (skip?: boolean) => void;
    copy: () => void;
    paste: () => void;
};

export const useHotkeys = ({
    canvas,
    undo,
    redo,
    save,
    copy,
    paste
}: UseHotkeysProps) => {};