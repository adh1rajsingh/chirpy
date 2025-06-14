import * as bcrypt from "bcrypt";
import pkg from "jsonwebtoken";
const { sign, verify } = pkg;
import type { JwtPayload } from "jsonwebtoken";
import { NotFoundError, UserNotAuthenticatedError } from "./api/errors.js";
import { Request } from "express";
import crypto from "crypto";
const saltRounds = 10;

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getBearerToken(req: Request): Promise<string> {
  const header = req.headers.authorization;

  if (!header) {
    throw new UserNotAuthenticatedError("Authorization not found");
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer") {
    throw new UserNotAuthenticatedError("wrong header scheme");
  }
  
  if (!token) {
    throw new UserNotAuthenticatedError("Empty token");
  }

  return token;
}

export async function getAPIKey(req: Request){
  const header = req.headers.authorization;

  if (!header) {
    throw new UserNotAuthenticatedError("Authorization not found");
  }
  const [scheme, apikey] = header.split(" ");

  if (scheme !== "ApiKey") {
    throw new UserNotAuthenticatedError("wrong header scheme");
  }
  
  if (!apikey) {
    throw new UserNotAuthenticatedError("Empty token");
  }

  return apikey;
}

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;
  const payload: payload = {
    iss: "chirp",
    sub: userID,
    iat: now,
    exp: exp,
  };

  const token = sign(payload, secret);
  return token;
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = verify(tokenString, secret) as JwtPayload;
    if (!decoded) {
      throw new UserNotAuthenticatedError("Did not decode");
    }
    const userId = decoded.sub as string;
    return userId;
  } catch (error) {
    throw new UserNotAuthenticatedError("Invalid or expired token");
  }
}
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  if (hash === "unset") {
    return false;
  }

  try {
    const isPass = await bcrypt.compare(password, hash);
    return isPass;
  } catch (error) {
    console.error("Password verification error:", error);
    return false; 
  }
}
