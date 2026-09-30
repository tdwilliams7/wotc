import express from "express";
import cors from "cors";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { pool } from "./db";
import { migrate } from "./migrate";
import { inviteFor } from "./modules/calendar";
import { CORS_ORIGIN, PORT } from "./config";

const yoga = createYoga({ schema, cors: false });

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/events/:id/invite.ics", async (req, res) => {
  try {
    const invite = await inviteFor(pool, req.params.id);
    if (!invite)
      return res.status(404).type("text/plain").send("Event not found");
    res
      .status(200)
      .set({
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${invite.filename}"`,
      })
      .send(invite.body);
  } catch (err) {
    console.error(err);
    res.status(500).type("text/plain").send("Failed to build invite");
  }
});

// GraphQL at /graphql, mounted as Express middleware.
app.use(yoga.graphqlEndpoint, yoga);

await migrate();
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}/graphql`));
