/*
  Warnings:

  - You are about to drop the column `policyId` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_policyId_fkey";

-- DropIndex
DROP INDEX "Invoice_policyId_idx";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "policyId";

-- CreateTable
CREATE TABLE "InvoicePolicy" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "premiumAmount" DECIMAL(10,2),

    CONSTRAINT "InvoicePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoicePolicy_invoiceId_idx" ON "InvoicePolicy"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePolicy_policyId_idx" ON "InvoicePolicy"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePolicy_invoiceId_policyId_key" ON "InvoicePolicy"("invoiceId", "policyId");

-- AddForeignKey
ALTER TABLE "InvoicePolicy" ADD CONSTRAINT "InvoicePolicy_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePolicy" ADD CONSTRAINT "InvoicePolicy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
