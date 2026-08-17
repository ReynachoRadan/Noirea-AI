-- CreateEnum
CREATE TYPE "ClothingCategory" AS ENUM ('top', 'bottom', 'outerwear', 'shoes', 'accessory');

-- CreateTable
CREATE TABLE "wardrobe_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'local-user',
    "name" TEXT NOT NULL,
    "category" "ClothingCategory" NOT NULL,
    "color" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wardrobe_items_pkey" PRIMARY KEY ("id")
);
