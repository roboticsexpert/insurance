-- CreateTable
CREATE TABLE "PolicyCounter" (
    "insurerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PolicyCounter_pkey" PRIMARY KEY ("insurerId","period")
);
