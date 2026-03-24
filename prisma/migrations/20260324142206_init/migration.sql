-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "currentVolume" INTEGER NOT NULL DEFAULT 0,
    "peakVolume" INTEGER NOT NULL DEFAULT 0,
    "momentum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'google',
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPoint" (
    "id" TEXT NOT NULL,
    "trendId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,

    CONSTRAINT "DataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoIdea" (
    "id" TEXT NOT NULL,
    "trendId" TEXT NOT NULL,
    "generatedPitch" TEXT NOT NULL,
    "viabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trend_keyword_key" ON "Trend"("keyword");

-- CreateIndex
CREATE INDEX "Trend_keyword_idx" ON "Trend"("keyword");

-- CreateIndex
CREATE INDEX "DataPoint_trendId_timestamp_idx" ON "DataPoint"("trendId", "timestamp");

-- CreateIndex
CREATE INDEX "AutoIdea_trendId_idx" ON "AutoIdea"("trendId");

-- AddForeignKey
ALTER TABLE "DataPoint" ADD CONSTRAINT "DataPoint_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoIdea" ADD CONSTRAINT "AutoIdea_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
