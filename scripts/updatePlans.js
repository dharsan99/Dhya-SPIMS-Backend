const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete all existing plans
  await prisma.plan.deleteMany();

  // Create the three plans
  await prisma.plan.createMany({
    data: [
      {
        name: 'Starter',
        price: 0,
        billingCycle: 'trial',
        description: 'Basic 14-day trial plan',
        features: [
          'Up to 5 users',
          'Basic order management',
          'Email support',
          '14-day trial'
        ],
        maxUsers: 5,
        maxOrders: 20,
        maxStorage: '2GB',
        popular: false,
        is_active: true
      },
      {
        name: 'Growth',
        price: 49,
        billingCycle: 'month',
        description: 'For growing businesses',
        features: [
          'Up to 50 users',
          'Full order management',
          'Priority email support',
          'Advanced analytics'
        ],
        maxUsers: 50,
        maxOrders: 500,
        maxStorage: '50GB',
        popular: true,
        is_active: true
      },
      {
        name: 'Enterprise',
        price: 199,
        billingCycle: 'month',
        description: 'For large mills with complex operations',
        features: [
          'Unlimited users',
          'Full order management suite',
          'Real-time production & inventory',
          '24/7 phone support',
          'Unlimited storage',
          'Custom analytics dashboard',
          'White-label solutions',
          'Dedicated account manager',
          'Custom training sessions'
        ],
        maxUsers: 'Unlimited',
        maxOrders: 'Unlimited',
        maxStorage: 'Unlimited',
        popular: false,
        is_active: true
      }
    ]
  });

  console.log('Plans updated!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 