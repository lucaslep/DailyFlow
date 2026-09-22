-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Preserve tasks created before authentication was introduced.
INSERT INTO "User" ("name", "email", "passwordHash", "updatedAt")
VALUES ('Usuário legado', 'legacy@local.invalid', 'LOGIN_DISABLED', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "userId" INTEGER;
UPDATE "Task" SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'legacy@local.invalid');
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
