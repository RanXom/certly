import { cn } from "@/lib/utils";
import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const font = Space_Grotesk({
  weight: ["700"],
  subsets: ["latin"],
});

export const Logo = () => {
  return (
    <Link href="/dashboard">
      <div className="flex items-center gap-x-2 hover:opacity-75 transition h-17 px-4">
        <div className="size-8 relative">
          <Image src="/logo.svg" alt="Certly" fill />
        </div>
        <h1 className={cn(font.className, "text-xl font-bold")}>Certly</h1>
      </div>
    </Link>
  );
};
