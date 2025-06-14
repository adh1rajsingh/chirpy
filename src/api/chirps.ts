import type { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import {
  BadRequestError,
  NotFoundError,
  UserNotAuthenticatedError,
} from "./errors.js";
import {
  createChirp,
  deleteChirpById,
  getChirps,
  getChirpsByAuthor,
  getChirpsId,
} from "../db/queries/chirps.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";

export async function getChirpsById(req: Request, res: Response) {
  try {
    const Id = req.params.chirpID;
    const chirp = await getChirpsId(Id);
    if (!chirp) {
      throw new NotFoundError("Missing chirp");
    }
    respondWithJSON(res, 200, {
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.user_id,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Interval server error" });
    }
  }
}

export async function getChirpsByCreatedAt(req: Request, res: Response) {
  try {
    let authorId = "";
    let authorIdQuery = req.query.authorId;
    if (typeof authorIdQuery === "string") {
      authorId = authorIdQuery;
    }

    let sort = "asc"; 
    let sortQuery = req.query.sort;
    if (typeof sortQuery === "string" && (sortQuery === "asc" || sortQuery === "desc")) {
      sort = sortQuery;
    }


    let chirps;
    if (authorId) {
      // Get chirps filtered by author
      chirps = await getChirpsByAuthor(authorId);
      if (!chirps || chirps.length === 0) {
        return respondWithJSON(res, 200, []);
      }
    } else {
      // Get all chirps
      chirps = await getChirps();
      if (!chirps || chirps.length === 0) {
        return respondWithJSON(res, 200, []); 
      }
    }

    const formattedChirps = chirps.map((chirp) => ({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.user_id,
    }));

    // Sort the chirps by createdAt
    formattedChirps.sort((a, b) => {
      if (sort === "asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    respondWithJSON(res, 200, formattedChirps);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function handlerChirpsValidate(req: Request, res: Response) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;
  const token = await getBearerToken(req);
  if (!token) {
    throw new UserNotAuthenticatedError("User not authenticated");
  }

  const userId = validateJWT(token, config.jwt.secret);
  if (!userId) {
    throw new UserNotAuthenticatedError("User Id not found");
  }
  const maxChirpLength = 140;
  if (params.body.length > maxChirpLength) {
    throw new BadRequestError(
      `Chirp is too long. Max length is ${maxChirpLength}`
    );
  }

  const chirp = await createChirp({
    body: params.body,
    user_id: userId,
  });

  if (!chirp) {
    throw new Error("Could not create new chirp");
  }

  respondWithJSON(res, 201, {
    id: chirp.id,
    createdAt: chirp.createdAt,
    updatedAt: chirp.updatedAt,
    body: chirp.body,
    userId: chirp.user_id,
  });
  
}

export async function deleteChirp(req: Request, res: Response) {
  try {
    const token = await getBearerToken(req);
    const userId = validateJWT(token, config.jwt.secret);
    const Id = req.params.chirpID;
    const chirp = await getChirpsId(Id);
    if (!chirp) {
      throw new NotFoundError("Missing chirp");
    }
    if (chirp.user_id !== userId) {
      throw new UserNotAuthenticatedError("User not authenticated");
    }
    const deletedChirp = await deleteChirpById(Id);

    res.status(204).end();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof UserNotAuthenticatedError) {
      if (
        error.message === "Authorization not found" ||
        error.message === "Empty token" ||
        error.message === "Invalid or expired token"
      ) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(403).json({ error: error.message });
      }
    } else {
      console.error("Chirp delete error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
