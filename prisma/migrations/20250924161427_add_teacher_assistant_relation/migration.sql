-- CreateTable
CREATE TABLE "public"."TeacherAssistant" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "assistantId" INTEGER NOT NULL,

    CONSTRAINT "TeacherAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssistant_teacherId_assistantId_key" ON "public"."TeacherAssistant"("teacherId", "assistantId");

-- AddForeignKey
ALTER TABLE "public"."TeacherAssistant" ADD CONSTRAINT "TeacherAssistant_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssistant" ADD CONSTRAINT "TeacherAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
