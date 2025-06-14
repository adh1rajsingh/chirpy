import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, getAPIKey, getBearerToken, hashPassword, makeJWT, validateJWT } from "../auth.js";
import { Request } from "express";
import { NotFoundError, UserNotAuthenticatedError } from "../api/errors.js";
describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});

describe("Get Bearer Token", () => {
  // Helper function to create mock requests
  const mockRequest = (authHeader?: string): Request => {
    return {
      headers: {
        authorization: authHeader
      }
    } as Request;
  };

  it("should extract token from valid Bearer header", async () => {
    const expectedToken = "abc123.def456.ghi789";
    const req = mockRequest(`Bearer ${expectedToken}`);
    
    const token = await getBearerToken(req);
    expect(token).toBe(expectedToken);
  });

  it("should throw error when authorization header is missing", async () => {
    const req = mockRequest(undefined);
    
    await expect(getBearerToken(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getBearerToken(req)).rejects.toThrow("Authorization not found");
  });

  it("should throw error when scheme is not Bearer", async () => {
    const req = mockRequest("Basic dXNlcjpwYXNzd29yZA==");
    
    await expect(getBearerToken(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getBearerToken(req)).rejects.toThrow("wrong header scheme");
  });

  it("should throw error when token is empty", async () => {
    const req = mockRequest("Bearer ");
    
    await expect(getBearerToken(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getBearerToken(req)).rejects.toThrow("Empty token");
  });
});

describe("Get API Key", () => {
  // Helper function to create mock requests
  const mockRequest = (authHeader?: string): Request => {
    return {
      headers: {
        authorization: authHeader
      }
    } as Request;
  };

  it("should extract API key from valid ApiKey header", async () => {
    const expectedKey = "api-key-123456";
    const req = mockRequest(`ApiKey ${expectedKey}`);
    
    const apiKey = await getAPIKey(req);
    expect(apiKey).toBe(expectedKey);
  });

  it("should throw error when authorization header is missing", async () => {
    const req = mockRequest(undefined);
    
    await expect(getAPIKey(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getAPIKey(req)).rejects.toThrow("Authorization not found");
  });

  it("should throw error when scheme is not ApiKey", async () => {
    const req = mockRequest("Bearer token123");
    
    await expect(getAPIKey(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getAPIKey(req)).rejects.toThrow("wrong header scheme");
  });

  it("should throw error when API key is empty", async () => {
    const req = mockRequest("ApiKey ");
    
    await expect(getAPIKey(req)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(getAPIKey(req)).rejects.toThrow("Empty token");
  });
});