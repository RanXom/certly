'use client'

import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "sonner"

interface ProviderProps {
    children: React.ReactNode;
};

export const Providers = ({ children }: ProviderProps) => {
    return (
        <QueryProvider>
            <Toaster />
            {children}
        </QueryProvider>
    );
};