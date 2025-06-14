import {
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  makeRefreshToken,
} from "../auth.js";
import { NotFoundError, UserNotAuthenticatedError } from "./errors.js";

import { Request, Response } from "express";
import { getUserByEmail } from "../db/queries/users.js";
import { respondWithJSON } from "./json.js";
import { config } from "../config.js";
import {
  revokeRefreshToken,
  saveRefreshToken,
  userForRefreshToken,
} from "../db/queries/refresh.js";


export async function userLogin(req: Request, res: Response) {
  type parameters = {
    password: string;
    email: string;
    expiresInSeconds?: number;
  };

  try {
    const params = req.body as parameters;

    if (!params.email) {
      throw new NotFoundError("Missing email");
    }
    if (!params.password) {
      throw new NotFoundError("Missing password");
    }
    const user = await getUserByEmail(params.email);
    if (!user) {
      throw new UserNotAuthenticatedError("Incorrect email or password.");
    }
    const isPass = await checkPasswordHash(
      params.password,
      user.hashed_password
    );

    if (!isPass) {
      throw new UserNotAuthenticatedError("Incorrect email or password.");
    }
    if (params.expiresInSeconds && params.expiresInSeconds > 3600) {
      params.expiresInSeconds = 3600;
    }
    if (!params.expiresInSeconds) {
      params.expiresInSeconds = 3600;
    }
    const token = makeJWT(user.id, params.expiresInSeconds, config.jwt.secret);

    const accessToken = makeJWT(
      user.id,
      config.jwt.defaultDuration,
      config.jwt.secret
    );
    const refreshToken = makeRefreshToken();

    const saved = await saveRefreshToken(user.id, refreshToken);
    if (!saved) {
      throw new UserNotAuthenticatedError("could not save refresh token");
    }

    respondWithJSON(res, 200, {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: token,
      refreshToken: refreshToken,
      isChirpyRed: user.is_chirpy_red
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof UserNotAuthenticatedError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function handlerRefresh(req: Request, res: Response) {
  let refreshToken = getBearerToken(req);

  const result = await userForRefreshToken(await refreshToken);
  if (!result) {
    throw new UserNotAuthenticatedError("invalid refresh token");
  }

  const user = result.user;
  const accessToken = makeJWT(
    user.id,
    config.jwt.defaultDuration,
    config.jwt.secret
  );

  type response = {
    token: string;
  };

  respondWithJSON(res, 200, {
    token: accessToken,
  } satisfies response);
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(await refreshToken);
  res.status(204).send();
}
