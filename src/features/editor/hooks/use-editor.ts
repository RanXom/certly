import { useCallback } from "react";

export const useEditor = () => {
    const init = useCallback(() => {
        console.log("Init Editor...");
    }, []);

    return { init };
};