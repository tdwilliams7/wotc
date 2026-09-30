import { Db } from "../../db";
import { getEvent } from "../events/service";
import { getTemplate } from "../templates/repo";
import { buildIcs } from "./ics";

export async function inviteFor(db: Db, eventId: string) {
  const event = await getEvent(db, eventId);
  if (!event) return null;
  const template = (await getTemplate(db, event.gameId)) ?? undefined;
  const slug =
    event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event";
  return { filename: `${slug}.ics`, body: buildIcs(event, template) };
}
