interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="bg-[url(/bg.png)] bg-top bg-cover h-full flex items-center justify-center">
      <div className="h-full w-full md:h-auto md:w-105">{children}</div>
    </div>
  );
};

export default AuthLayout;
