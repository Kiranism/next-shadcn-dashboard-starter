import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const dirItem = z.object({
  id: z.string(),
  name: z.string(),
  // status: z.string(),
  item_type: z.string(),
  media_type: z.string(),
  // priority: z.string(),
});

export type DirItem = z.infer<typeof dirItem>;
