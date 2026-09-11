/*
  Warnings:

  - A unique constraint covering the columns `[position]` on the table `officers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_memberId_date_key" ON "attendance"("memberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "officers_position_key" ON "officers"("position");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
