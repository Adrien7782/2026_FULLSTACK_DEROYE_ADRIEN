import { Router } from "express";
import { z } from "zod";
import { cancelSuggestion, createSuggestion, listUserSuggestions } from "./suggestions.service.js";

export const suggestionsRouter = Router();

const createSuggestionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  synopsis: z.string().trim().max(2000).optional(),
});

suggestionsRouter.post("/", async (req, res) => {
  const { title, synopsis } = createSuggestionSchema.parse(req.body);
  const suggestion = await createSuggestion(req.auth!.user.id, title, synopsis);
  res.status(201).json({ suggestion });
});

suggestionsRouter.get("/", async (req, res) => {
  const items = await listUserSuggestions(req.auth!.user.id);
  res.json({ items });
});

suggestionsRouter.delete("/:id", async (req, res) => {
  await cancelSuggestion(req.auth!.user.id, req.params.id);
  res.status(204).end();
});
