import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { requiredParam } from "../utils/params.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: { children: { orderBy: { name: "asc" } } },
    });
    response.json({ data: categories });
  }),
);

categoriesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const category = await prisma.category.findUnique({ where: { id: requiredParam(request.params.id, "id") }, include: { children: true, parent: true } });
    if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    response.json({ data: category });
  }),
);
