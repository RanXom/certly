import { useCallback } from "react";

export const useHistory = () => {
    const save = useCallback(() => {
        console.log("saving")
    }, []);

    return { save };
};