import { AppError } from "./app-error.js";

export const requiredParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "INVALID_PARAMETER", `The ${name} parameter is invalid.`);
  }
  return value;
};
