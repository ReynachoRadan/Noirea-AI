-- CreateTable
CREATE TABLE "saved_outfits" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reasoning" TEXT,
    "itemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_outfits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_outfits_userId_createdAt_idx" ON "saved_outfits"("userId", "createdAt");