"use client";

import * as React from "react";
import { ArrowBigRight, Beer, LifeBuoy, Send, Trophy } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
// import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { api } from "@/trpc/react";

const data = {
  navMain: [
    {
      title: "Test Turnier",
      url: "#",
      icon: Trophy,
      isActive: true,
      items: [
        {
          title: "Übersicht",
          url: "#",
        },
        {
          title: "Gruppen",
          url: "#",
        },
        {
          title: "Teams",
          url: "#",
        },
        {
          title: "Spieler",
          url: "#",
        },
        {
          title: "Einstellungen",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Turnier beitreten",
      url: "/dashboard/tournament/join",
      icon: ArrowBigRight,
    },
    {
      name: "Turnier erstellen",
      url: "/dashboard/tournament/create",
      icon: Trophy,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading: isLoadingUser } = api.user.get.useQuery();
  const { data: tournaments, isLoading: isLoadingTournaments } = api.user.joinedTournaments.useQuery();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                  <Beer className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Bierpong</span>
                  <span className="truncate text-xs">Turnier</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoadingTournaments ? (
          <div className="aspect-video h-12 w-full animate-pulse rounded-xl bg-muted/50" />
        ) : (
          <NavMain items={tournaments} user={user} />
        )}
        <NavProjects projects={data.projects} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {isLoadingUser || !user ? (
          <div className="aspect-video h-12 w-full animate-pulse rounded-xl bg-muted/50" />
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
