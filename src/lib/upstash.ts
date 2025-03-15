import { env } from "@/env";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL ?? "",
  token: env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

export const publishMatchUpdate = async (tournamentId: string) => {
  try {
    await redis.publish("match-updates", tournamentId);
    console.log("Echtzeit Update gesendet für Turnier:", tournamentId);
  } catch (error) {
    console.error("Fehler beim Senden des Echtzeit Updates:", error);
  }
};
