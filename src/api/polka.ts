import { Request, Response } from "express";
import { NotFoundError, UserNotAuthenticatedError } from "./errors.js";
import { upgradeToChirpRed } from "../db/queries/users.js";
import { error } from "console";
import { getAPIKey } from "../auth.js";
import { config } from "../config.js";

export async function upgradeUserToChirpRed(req: Request, res: Response) {
  type parameters = {
    event: string;
    data: {
      userId: string;
    };
  };

  try {
    const params: parameters = req.body;

    const apikey = await getAPIKey(req);


    if (apikey !== config.api.apikey) {
      throw new UserNotAuthenticatedError("User not authenticated");
    }

    if (params.event !== "user.upgraded") {
      return res.status(204).end();
    }

    const userId = params.data.userId;
    const updatedUser = await upgradeToChirpRed(userId);
    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }
    return res.status(204).json({});
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof UserNotAuthenticatedError) {
      res.status(401).json({ error: error.message });
    } else {
      console.error("User upgrade error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
