import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${request.method} ${request.path}`));
};
