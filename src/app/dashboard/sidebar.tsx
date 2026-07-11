import { Logo } from "@/app/dashboard/logo";
import { SidebarRoutes } from "@/app/dashboard/sidebar-routes";

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex fixed flex-col w-75 left-0 shrink-0 h-full">
      <Logo />
      <SidebarRoutes />
    </aside>
  );
};
