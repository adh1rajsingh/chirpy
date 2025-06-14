import type { Request, Response } from "express";

import { createUser, getUserByEmail, updateUser } from "../db/queries/users.js";
import {
  BadRequestError,
  NotFoundError,
  UserNotAuthenticatedError,
} from "./errors.js";
import { respondWithJSON } from "./json.js";
import { getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { config } from "../config.js";

export async function handlerUsersCreate(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };
  const params: parameters = req.body;

  if (!params.email || !params.password) {
    throw new BadRequestError("Missing required fields");
  }

  const hashedPassword = await hashPassword(params.password);

  const user = await createUser({
    email: params.email,
    hashed_password: hashedPassword,
  });

  if (!user) {
    throw new Error("Could not create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.is_chirpy_red,
  });
}

export async function updateUserPassword(req: Request, res: Response) {
  type parameters = {
    email?: string;
    password?: string;
  };
  try {
    const params: parameters = req.body;
    const token = await getBearerToken(req);
    const userId = validateJWT(token, config.jwt.secret);


    const user = await getUserByEmail(params.email || ""); 


    const updates: { email?: string; hashed_password?: string } = {};

    if (params.email) {
      updates.email = params.email;
    }

    if (params.password) {
      updates.hashed_password = await hashPassword(params.password);
    }

    const updatedUser = await updateUser(userId, updates);

    if (!updatedUser) {
      throw new NotFoundError("User not updated");
    }

    respondWithJSON(res, 200, {
      id: updatedUser.id,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      isChirpyRed: updatedUser.is_chirpy_red,
    });
  } catch (error) {
    if (error instanceof UserNotAuthenticatedError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof BadRequestError) {
      res.status(400).json({ error: error.message });
    } else {
      console.error("User update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

