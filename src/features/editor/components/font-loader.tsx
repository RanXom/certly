"use client";

import { fonts } from "@/features/editor/types";
import { useEffect } from "react";

export const FontLoader = () => {
    useEffect(() => {
        const fontLink = document.createElement("link");
        fontLink.href = `https://fonts.googleapis.com/css?family=${fonts.join("|").replace(/ /g, "+")}`;
        fontLink.rel = "stylesheet";
        document.head.appendChild(fontLink);

        return () => {
            document.head.removeChild(fontLink);
        };
    }, []);

    return null;
};
