import { Hono } from "hono";
import { handle } from "hono/vercel";

import images from "./images";
import emails from "./emails";
import users from "./users";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

const routes = app
  .route("/images", images)
  .route("/users", users)
  .route("/emails", emails);

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof routes;
