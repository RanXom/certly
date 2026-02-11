"use client";

import {
  LayoutTemplate,
  ImageIcon,
  Pencil,
  Presentation,
  Settings,
  Shapes,
  Type,
} from "lucide-react";
import { SidebarItem } from "./sidebar-items";

export const Sidebar = () => {
  return (
    <aside className="bg-white flex flex-col w-[100px] h-full border-r overflow-y-auto">
      <ul className="flex flex-col">
        <SidebarItem
          icon={LayoutTemplate}
          label="Design"
          isActive={false}
          onClick={() => {}} //TODO
        />
        <SidebarItem
          icon={ImageIcon}
          label="Image"
          isActive={false}
          onClick={() => {}} //TODO
        />
        <SidebarItem
          icon={Type}
          label="Text"
          isActive={false}
          onClick={() => {}} //TODO
        />
        <SidebarItem
          icon={Shapes}
          label="Shapes"
          isActive={false}
          onClick={() => {}} //TODO
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          isActive={false}
          onClick={() => {}} //TODO
        />
      </ul>
    </aside>
  );
};
