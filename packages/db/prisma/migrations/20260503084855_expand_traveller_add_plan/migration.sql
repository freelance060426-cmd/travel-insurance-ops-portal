-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "travelRegion" TEXT,
ADD COLUMN     "tripDays" INTEGER;

-- AlterTable
ALTER TABLE "PolicyTraveller" ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "crReferenceNumber" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "district" TEXT,
ADD COLUMN     "emergencyContactNumber" TEXT,
ADD COLUMN     "emergencyContactPerson" TEXT,
ADD COLUMN     "emergencyEmail" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "gstState" TEXT,
ADD COLUMN     "nominee" TEXT,
ADD COLUMN     "nomineeRelationship" TEXT,
ADD COLUMN     "pastIllness" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "region" TEXT,
    "minDays" INTEGER,
    "maxDays" INTEGER,
    "premiumAmount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
