"use client";

import dynamic from "next/dynamic";

// Forcing CSR in order to avoid missing jsdom runtime error
const Editor = dynamic(
    () => import("@/features/editor/components/editor").then((mod) => mod.Editor),
    { ssr: false }
)

const EditorProjectIdPage = () => {
    return <Editor />
};

export default EditorProjectIdPage;