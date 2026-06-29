"use client";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useSignUp } from "../hooks/use-sign-up";
import { TriangleAlert } from "lucide-react";

export const SignUpCard = () => {
  const mutation = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onCredentialSignUp = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutation.mutate(
      {
        name,
        email,
        password,
      },
      {
        onSuccess: () => {
          // TODO: Replace "/editor" with "/dashboard" when dashboard is implemented
          signIn("credentials", {
            email,
            password,
            redirectTo: "/editor/1",
          });
        },
      },
    );
  };

  const onProviderSignUp = (provider: "github" | "google") => {
    // TODO: Replace "/editor" with "/dashboard" when dashboard is implemented
    signIn(provider, { redirectTo: "/editor/1" });
  };

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>
      {!!mutation.error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
          <TriangleAlert className="size-4" />
          <p>{mutation.error?.message || "Something went wrong"}</p>
        </div>
      )}

      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={onCredentialSignUp} className="space-y-2.5">
          <Input
            disabled={mutation.isPending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            type="text"
            required
          />
          <Input
            disabled={mutation.isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <Input
            disabled={mutation.isPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            minLength={3}
            maxLength={20}
            required
          />
          <Button
            disabled={mutation.isPending}
            type="submit"
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
        </form>
        <Separator />
        <div className="flex flex-col gap-y-2.5">
          <Button
            disabled={mutation.isPending}
            variant="outline"
            size="lg"
            className="w-full relative"
            onClick={() => onProviderSignUp("google")}
          >
            <FcGoogle className="mr-2 size-5 top-2.5 left-2.5 absolute" />
            Continue with Google
          </Button>
          <Button
            disabled={mutation.isPending}
            variant="outline"
            size="lg"
            className="w-full relative"
            onClick={() => onProviderSignUp("github")}
          >
            <FaGithub className="mr-2 size-5 top-2.5 left-2.5 absolute" />
            Continue with GitHub
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Already have an account?{" "}
          <Link href="/sign-in">
            <span className="text-sky-700 hover:underline">Sign in</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};
