import { auth } from "@/auth";
import { SignUpCard } from "@/features/auth/components/sign-up-card";
import { redirect } from "next/navigation";

const SignUpPage = async () => {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="h-full w-full md:h-auto md:w-105">
        <SignUpCard />
      </div>
    </div>
  );
};

export default SignUpPage;
