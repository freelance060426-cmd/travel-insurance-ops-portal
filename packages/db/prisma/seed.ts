import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
    // Asia plans
    { name: "Prime - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 1, maxDays: 45, premiumAmount: 500 },
    { name: "Ace - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 1, maxDays: 45, premiumAmount: 750 },
    { name: "Elite - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 1, maxDays: 45, premiumAmount: 1200 },
    { name: "Prime - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 46, maxDays: 180, premiumAmount: 900 },
    { name: "Ace - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 46, maxDays: 180, premiumAmount: 1350 },
    { name: "Elite - Asia", insurer: "Bajaj Allianz", region: "Asia", minDays: 46, maxDays: 180, premiumAmount: 2100 },

    // Europe / Schengen plans
    { name: "Prime - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 1, maxDays: 45, premiumAmount: 700 },
    { name: "Ace - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 1, maxDays: 45, premiumAmount: 1050 },
    { name: "Elite - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 1, maxDays: 45, premiumAmount: 1600 },
    { name: "Prime - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 46, maxDays: 180, premiumAmount: 1300 },
    { name: "Ace - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 46, maxDays: 180, premiumAmount: 1900 },
    { name: "Elite - Europe", insurer: "Bajaj Allianz", region: "Europe", minDays: 46, maxDays: 180, premiumAmount: 2800 },

    // Americas plans
    { name: "Prime - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 1, maxDays: 45, premiumAmount: 800 },
    { name: "Ace - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 1, maxDays: 45, premiumAmount: 1200 },
    { name: "Elite - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 1, maxDays: 45, premiumAmount: 1800 },
    { name: "Prime - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 46, maxDays: 180, premiumAmount: 1500 },
    { name: "Ace - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 46, maxDays: 180, premiumAmount: 2200 },
    { name: "Elite - Americas", insurer: "Bajaj Allianz", region: "Americas", minDays: 46, maxDays: 180, premiumAmount: 3200 },

    // Worldwide plans
    { name: "Prime - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 1, maxDays: 45, premiumAmount: 900 },
    { name: "Ace - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 1, maxDays: 45, premiumAmount: 1350 },
    { name: "Elite - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 1, maxDays: 45, premiumAmount: 2000 },
    { name: "Prime - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 46, maxDays: 180, premiumAmount: 1700 },
    { name: "Ace - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 46, maxDays: 180, premiumAmount: 2500 },
    { name: "Elite - Worldwide", insurer: "Bajaj Allianz", region: "Worldwide", minDays: 46, maxDays: 180, premiumAmount: 3600 },
];

async function main() {
    console.log("Seeding plans...");

    for (const plan of plans) {
        await prisma.plan.create({ data: plan });
    }

    console.log(`Seeded ${plans.length} plans.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
