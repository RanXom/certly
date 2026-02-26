import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/features/editor/components/logo";

export default function Home() {
  return (
    <div className="relative h-screen bg-[#fafafa] flex flex-col overflow-hidden selection:bg-blue-200">

      {/* Decorative Background Elements (Extended to cover full page, animations removed) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-3xl" />
        <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-pink-400/30 to-rose-400/30 blur-3xl" />
        <div className="absolute -bottom-[10%] left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-cyan-400/20 to-teal-400/20 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-24 bg-white/50 backdrop-blur-md border-b border-gray-200/50">
        <div className="flex items-center gap-x-2">
          <Logo />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Certly</span>
        </div>
        <div className="flex items-center gap-x-4">
          <Link href="/editor/1">
            <Button className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
              Go to Editor
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section (Centered vertically and horizontally) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-200 shadow-sm">
          <Sparkles className="size-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">The easiest way to design certificates</span>
        </div>

        {/* Headline */}
        <div className="max-w-4xl text-center space-y-6 relative">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Create stunning <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              certificates & awards
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
            Build beautiful certificates in minutes. Upload a CSV to bulk-export hundreds of personalized designs effortlessly. No design skills required.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/editor/1">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 flex items-center gap-2 group">
              Start Designing
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Feature Highlights mini */}
        <div className="mt-20 pt-10 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-3xl opacity-80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100/50 text-blue-600">
              <Layers className="size-5" />
            </div>
            <span className="font-medium text-gray-700">Drag & Drop Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100/50 text-emerald-600">
              <Zap className="size-5" />
            </div>
            <span className="font-medium text-gray-700">Bulk CSV Export</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100/50 text-pink-600">
              <Sparkles className="size-5" />
            </div>
            <span className="font-medium text-gray-700">Premium Quality</span>
          </div>
        </div>

      </main>

    </div>
  );
}
