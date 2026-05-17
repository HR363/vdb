import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  errorFormat: 'pretty',
});

async function main() {
  console.log('🌱 Seeding database with mock data...');
  
  try {
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    console.log('✓ Cleared existing data');
  } catch (error) {
    console.warn('⚠️  Could not clear existing data (might be first run)');
  }

  // Create sellers with varied locations for testing distance
  const sellerA = await prisma.user.create({
    data: {
      role: 'SELLER',
      name: 'Alex Vintage',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      bio: 'Curated streetwear and vintage classics.',
      city: 'Brooklyn',
      lat: 40.6782,
      lng: -73.9442,
    },
  });

  const sellerB = await prisma.user.create({
    data: {
      role: 'SELLER',
      name: 'Nora Home',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      bio: 'Cozy decor and handmade pieces.',
      city: 'Queens',
      lat: 40.7282,
      lng: -73.7949,
    },
  });

  const sellerC = await prisma.user.create({
    data: {
      role: 'SELLER',
      name: 'Jordan Tech',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
      bio: 'Electronics and gadgets - great prices!',
      city: 'Manhattan',
      lat: 40.7128,
      lng: -74.0060,
    },
  });

  const sellerD = await prisma.user.create({
    data: {
      role: 'SELLER',
      name: 'Maya Books',
      avatarUrl: 'https://i.pravatar.cc/150?img=15',
      bio: 'Rare books and collectibles.',
      city: 'Brooklyn',
      lat: 40.6895,
      lng: -73.9749,
    },
  });

  const sellerE = await prisma.user.create({
    data: {
      role: 'SELLER',
      name: 'Chris Sports',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      bio: 'Sports equipment and fitness gear.',
      city: 'Long Island City',
      lat: 40.7505,
      lng: -73.9776,
    },
  });

  // Create demo buyers
  const buyerA = await prisma.user.create({
    data: {
      role: 'BUYER',
      name: 'Demo Buyer',
      avatarUrl: 'https://i.pravatar.cc/150?img=20',
      city: 'Brooklyn',
      lat: 40.6782,
      lng: -73.9442,
    },
  });

  const buyerB = await prisma.user.create({
    data: {
      role: 'BUYER',
      name: 'Sam Explorer',
      avatarUrl: 'https://i.pravatar.cc/150?img=25',
      city: 'Manhattan',
      lat: 40.7128,
      lng: -74.0060,
    },
  });

  // Create posts with varied categories and locations
  const posts = await Promise.all([
    // Alex Vintage - Apparel
    prisma.post.create({
      data: {
        sellerId: sellerA.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Retro Leather Jacket',
        description: 'Barely worn, perfect condition. Classic brown leather. Size M.',
        price: 120,
        category: 'Apparel',
        stockStatus: 'IN_STOCK',
        lat: 40.6782,
        lng: -73.9442,
        areaLabel: 'Williamsburg',
      },
    }),
    prisma.post.create({
      data: {
        sellerId: sellerA.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-787c62d465d1?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Vintage Band Tees Bundle',
        description: '5 authentic band t-shirts from the 90s. All in great condition.',
        price: 85,
        category: 'Apparel',
        stockStatus: 'IN_STOCK',
        lat: 40.6782,
        lng: -73.9442,
        areaLabel: 'Williamsburg',
      },
    }),
    // Nora Home - Home & Furniture
    prisma.post.create({
      data: {
        sellerId: sellerB.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=60',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '2-grid',
        title: 'Minimalist Wall Set',
        description: 'Two framed prints (8x10 each), ready for pickup. Perfect for any room.',
        price: 48,
        category: 'Home',
        stockStatus: 'IN_STOCK',
        lat: 40.7282,
        lng: -73.7949,
        areaLabel: 'Astoria',
      },
    }),
    prisma.post.create({
      data: {
        sellerId: sellerB.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Ceramic Plant Pots Set',
        description: 'Set of 4 hand-thrown ceramic pots. Includes drainage holes.',
        price: 65,
        category: 'Home',
        stockStatus: 'IN_STOCK',
        lat: 40.7282,
        lng: -73.7949,
        areaLabel: 'Astoria',
      },
    }),
    // Jordan Tech - Electronics
    prisma.post.create({
      data: {
        sellerId: sellerC.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Wireless Bluetooth Headphones',
        description: 'High quality audio, 30hr battery. Great for travel.',
        price: 75,
        category: 'Electronics',
        stockStatus: 'IN_STOCK',
        lat: 40.7128,
        lng: -74.0060,
        areaLabel: 'Midtown',
      },
    }),
    prisma.post.create({
      data: {
        sellerId: sellerC.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'USB-C Cable Pack',
        description: '3 heavy-duty cables (6ft each). Fast charging capable.',
        price: 18,
        category: 'Electronics',
        stockStatus: 'IN_STOCK',
        lat: 40.7128,
        lng: -74.0060,
        areaLabel: 'Midtown',
      },
    }),
    // Maya Books - Books & Media
    prisma.post.create({
      data: {
        sellerId: sellerD.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1507842217343-583f7270bfeb?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Rare First Edition Books',
        description: 'Lot of 3 collectible books. Good condition, signed copies.',
        price: 250,
        category: 'Books',
        stockStatus: 'IN_STOCK',
        lat: 40.6895,
        lng: -73.9749,
        areaLabel: 'Park Slope',
      },
    }),
    prisma.post.create({
      data: {
        sellerId: sellerD.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1543002588-d4d28dd9d971?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Vinyl Record Collection',
        description: '10 classic albums. All in excellent condition with covers.',
        price: 120,
        category: 'Books',
        stockStatus: 'IN_STOCK',
        lat: 40.6895,
        lng: -73.9749,
        areaLabel: 'Park Slope',
      },
    }),
    // Chris Sports - Sports & Fitness
    prisma.post.create({
      data: {
        sellerId: sellerE.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Yoga Mat & Blocks Set',
        description: 'Premium non-slip mat (6mm) with 2 cork blocks.',
        price: 55,
        category: 'Sports',
        stockStatus: 'IN_STOCK',
        lat: 40.7505,
        lng: -73.9776,
        areaLabel: 'Long Island City',
      },
    }),
    prisma.post.create({
      data: {
        sellerId: sellerE.id,
        mediaUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?auto=format&fit=crop&w=800&q=60',
        ]),
        collageType: '1x1',
        title: 'Adjustable Dumbbell Set',
        description: '5-25 lbs with stand. Like new, barely used.',
        price: 150,
        category: 'Sports',
        stockStatus: 'IN_STOCK',
        lat: 40.7505,
        lng: -73.9776,
        areaLabel: 'Long Island City',
      },
    }),
  ]);

  console.log(`✓ Created ${posts.length} posts`);

  // Create conversations with messages
  const conversation1 = await prisma.conversation.create({
    data: {
      buyerId: buyerA.id,
      sellerId: sellerA.id,
      postId: posts[0].id, // Leather Jacket
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: buyerA.id,
        text: 'Is this still available?'
      },
      {
        conversationId: conversation1.id,
        senderId: sellerA.id,
        text: 'Yes! Available for pickup today.'
      },
      {
        conversationId: conversation1.id,
        senderId: buyerA.id,
        text: 'Great, can I grab it after 6pm?'
      },
      {
        conversationId: conversation1.id,
        senderId: sellerA.id,
        text: 'That works. I will set it aside.'
      },
      {
        conversationId: conversation1.id,
        senderId: buyerA.id,
        text: 'Thanks!'
      },
      {
        conversationId: conversation1.id,
        senderId: sellerA.id,
        text: 'See you later!'
      },
    ],
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      buyerId: buyerB.id,
      sellerId: sellerC.id,
      postId: posts[4].id, // Headphones
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation2.id,
        senderId: buyerB.id,
        text: 'Do you have any discount for bundle buying?'
      },
      {
        conversationId: conversation2.id,
        senderId: sellerC.id,
        text: 'Yes, if you buy 2+ items I can offer 10% off'
      },
      {
        conversationId: conversation2.id,
        senderId: buyerB.id,
        text: 'Perfect! I want the headphones and cable pack'
      },
    ],
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      buyerId: buyerA.id,
      sellerId: sellerB.id,
      postId: posts[2].id, // Wall Set
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation3.id,
        senderId: buyerA.id,
        text: 'How much for local pickup?'
      },
      {
        conversationId: conversation3.id,
        senderId: sellerB.id,
        text: 'Same price, no shipping needed! Can meet anytime'
      },
    ],
  });

  console.log(`✓ Created 3 conversations with messages`);
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
