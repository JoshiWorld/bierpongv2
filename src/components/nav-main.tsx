"use client";

import { ChevronRight, Trophy } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { UserRole } from "@prisma/client";

// navMain: [
//     {
//       title: "Test Turnier",
//       url: "#",
//       icon: Trophy,
//       isActive: true,
//       items: [
//         {
//           title: "Übersicht",
//           url: "#",
//         },
//         {
//           title: "Gruppen",
//           url: "#",
//         },
//         {
//           title: "Teams",
//           url: "#",
//         },
//         {
//           title: "Spieler",
//           url: "#",
//         },
//         {
//           title: "Einstellungen",
//           url: "#",
//         },
//       ],
//     },
//   ],

const tournamentItems = [
  {
    title: "Übersicht",
    url: "/dashboard/tournament/overview",
  },
  {
    title: "Gruppen",
    url: "/dashboard/tournament/groups",
  },
  {
    title: "Spiele",
    url: "/dashboard/tournament/games",
  },
];

const tournamentItemsAdmin = [
  {
    title: "Übersicht",
    url: "/dashboard/tournament/overview",
  },
  {
    title: "Gruppen",
    url: "/dashboard/tournament/groups",
  },
  {
    title: "Spiele",
    url: "/dashboard/tournament/games",
  },
  {
    title: "Einstellungen",
    url: "/dashboard/tournament/settings",
  },
];

type Tournament = {
  id: string;
  name: string;
  admin: {
    id: string;
  }
};

type User = {
  id: string;
  name: string;
  role: UserRole;
}

export function NavMain({ items, user }: { items: Tournament[] | undefined; user: User | undefined | null }) {
  const activeItem = !items ? "" : items[0] ? items[0].id : "";

  if(!user) return <p>Waiting for user..</p>

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Beigetretene Turniere</SidebarGroupLabel>
      {!items || items.length === 0 ? (
        <p>Du bist noch keinem Turnier beigetreten</p>
      ) : (
        <SidebarMenu>
          {items.map((tournament) => (
            <Collapsible
              key={tournament.id}
              asChild
              defaultOpen={tournament.id === activeItem}
            >
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={tournament.name}>
                  <a
                    href={`/dashboard/tournament/overview?id=${tournament.id}`}
                  >
                    <Trophy />
                    <span>{tournament.name}</span>
                  </a>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {tournament.admin.id === user.id || user.role === UserRole.ADMIN ? (
                    <SidebarMenuSub>
                      {tournamentItemsAdmin?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={`${subItem.url}?id=${tournament.id}`}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : (
                    <SidebarMenuSub>
                      {tournamentItems?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={`${subItem.url}?id=${tournament.id}`}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
