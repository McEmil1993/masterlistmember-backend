-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "studentId" VARCHAR(50) NOT NULL,
    "fullname" VARCHAR(150) NOT NULL,
    "position" VARCHAR(150),
    "yearLevel" VARCHAR(50),
    "email" VARCHAR(255),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_studentId_key" ON "members"("studentId");

-- CreateIndex
CREATE INDEX "members_deleted_at_idx" ON "members"("deleted_at");
