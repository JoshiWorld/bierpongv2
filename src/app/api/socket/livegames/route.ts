// // src/app/api/socket/route.ts
// import { Server } from "socket.io";
// import { type NextRequest, NextResponse } from 'next/server';
// import { db } from "@/server/db";

// type MatchViewOverview = {
//     group: string;
//     team1: {
//         name: string;
//     };
//     team2: {
//         name: string;
//     };
// };

// type SocketMessage = {
//     type: 'match-update';
//     payload: MatchViewOverview[];
// };

// interface SocketServer extends Server {
//     _nsps: Map<string, any>;
// }

// async function SocketHandler(req: NextRequest, res: NextResponse) {
//     if ((res.socket?.server as any)?.io) {
//         console.log("Socket is already running");
//         return NextResponse.json({ message: "Socket is already running" });
//     }

//     const io: SocketServer = new Server((res.socket?.server as any), {
//         path: "/api/socket_io",
//     });

//     (res.socket?.server as any).io = io;

//     io.on("connection", async (socket) => {
//         console.log("User connected:", socket.id);

//         try {
//             const tournament = await db.turnier.findUnique({
//                 where: {
//                     id: "input.id",
//                 },
//                 select: {
//                     gruppen: {
//                         select: {
//                             name: true,
//                             spiele: {
//                                 where: {
//                                     done: false,
//                                 },
//                                 take: 1,
//                                 select: {
//                                     team1: {
//                                         select: {
//                                             name: true,
//                                         },
//                                     },
//                                     team2: {
//                                         select: {
//                                             name: true,
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                 },
//             });

//             const matches: MatchViewOverview[] = [];

//             tournament!.gruppen.forEach((group) => {
//                 if (group.spiele[0]) {
//                     matches.push({
//                         group: group.name,
//                         team1: group.spiele[0].team1,
//                         team2: group.spiele[0].team2,
//                     });
//                 }
//             });
//             // Sende die Daten an den Client
//             const message: SocketMessage = {
//                 type: 'match-update',
//                 payload: matches,
//             };
//             socket.emit("match-update", message);
//         } catch (error) {
//             console.error("Failed to load data from MongoDB", error);
//             socket.emit("error", "Failed to load data from MongoDB"); // Optional: Sende eine Fehlermeldung an den Client
//         } finally {
//             await client.close();
//         }

//         socket.on("disconnect", () => {
//             console.log("User disconnected:", socket.id);
//         });

//         socket.on("message", (msg) => {
//             console.log("Received message:", msg);
//             io.emit("message", msg);
//         });
//     });

//     console.log("Socket server started");
//     return NextResponse.json({ message: "Socket server started" });
// }

// export { SocketHandler as GET, SocketHandler as POST };