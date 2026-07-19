import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { submitContactMessage } from "./contact.server";

// Public — a guest fills this out with no account, same posture as the rest
// of the app's public read RPCs (e.g. getPublicPackagesFn), just a write.
export const submitContactMessageFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email(),
      phone: z.string().nullable(),
      message: z.string().min(1, "Message is required"),
    }),
  )
  .handler(async ({ data }) => submitContactMessage(data));
