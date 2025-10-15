import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function for colored console output
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`\x1b[36m${message}\x1b[0m`);
const logError = (message: string) => console.log(`\x1b[31m${message}\x1b[0m`);

async function main() {
  logInfo('🌱 Seeding database...');

  // 1️⃣ --- Users ---
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ateeq@gmail.com' },
      update: {},
      create: {
        email: 'ateeq@gmail.com',
        password: passwordHash,
        name: 'ateeq',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test@gmail.com' },
      update: {},
      create: {
        email: 'test@gmail.com',
        password: passwordHash,
        name: 'abc',
      },
    }),
  ]);

  logSuccess(`✅ Users seeded: ${users.map(u => u.email).join(', ')}`);

  // 2️⃣ --- Categories ---
  // First, check if categories already exist to avoid duplication
  const existingCategories = await prisma.category.findMany({
    where: {
      name: {
        in: [
          'Home Electronics',
          'Army Weapons',
          'Gym Equipment',
          'Kitchen Appliances',
          'Fashion',
          'Books',
          'Sports',
          'Beauty',
          'Toys',
          'Automotive'
        ]
      }
    }
  });

  const existingCategoryNames = existingCategories.map(c => c.name);
  
  // Only create categories that don't already exist
  const categoriesToCreate = [
    { name: 'Home Electronics', description: 'Electronic devices and appliances for home use' },
    { name: 'Army Weapons', description: 'Military-grade weapons and equipment' },
    { name: 'Gym Equipment', description: 'Fitness equipment and workout tools' },
    { name: 'Kitchen Appliances', description: 'Modern kitchen tools and appliances' },
    { name: 'Fashion', description: 'Clothing, shoes, and accessories' },
    { name: 'Books', description: 'Fiction, non-fiction, and educational books' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
    { name: 'Beauty', description: 'Cosmetics and personal care products' },
    { name: 'Toys', description: 'Toys and games for children of all ages' },
    { name: 'Automotive', description: 'Car parts and accessories' },
  ].filter(category => !existingCategoryNames.includes(category.name));

  let newCategories: any[] = [];
  if (categoriesToCreate.length > 0) {
    newCategories = await Promise.all(
      categoriesToCreate.map(category => 
        prisma.category.create({
          data: category,
        })
      )
    );
    logSuccess(`✅ Created ${newCategories.length} new categories`);
  } else {
    logInfo('ℹ️  All categories already exist, skipping creation');
  }

  // Get all categories (both existing and newly created)
  const allCategories = await prisma.category.findMany({
    where: {
      name: {
        in: [
          'Home Electronics',
          'Army Weapons',
          'Gym Equipment',
          'Kitchen Appliances',
          'Fashion',
          'Books',
          'Sports',
          'Beauty',
          'Toys',
          'Automotive'
        ]
      }
    }
  });

  logSuccess(`✅ Categories available: ${allCategories.length} categories`);

  // 3️⃣ --- Products ---
  // Create a map of category names to IDs for easy lookup
  const categoryMap = allCategories.reduce((acc, category) => {
    acc[category.name] = category.id;
    return acc;
  }, {} as Record<string, string>);

  const productData = [
    // Home Electronics - 2 products
    {
      name: 'LED Smart TV',
      description: 'A 55-inch 4K smart television with HDR',
      price: 850,
      stock: 25,
      categoryId: categoryMap['Home Electronics'],
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable wireless speaker with excellent sound quality',
      price: 120,
      stock: 50,
      categoryId: categoryMap['Home Electronics'],
    },
    
    // Army Weapons - 2 products
    {
      name: 'Assault Rifle M4',
      description: 'Standard army weapon for field soldiers',
      price: 1200,
      stock: 5,
      categoryId: categoryMap['Army Weapons'],
    },
    {
      name: 'Tactical Vest',
      description: 'Bulletproof vest with multiple pouches',
      price: 350,
      stock: 15,
      categoryId: categoryMap['Army Weapons'],
    },
    
    // Gym Equipment - 2 products
    {
      name: 'Treadmill',
      description: 'Electric treadmill for home workouts',
      price: 500,
      stock: 10,
      categoryId: categoryMap['Gym Equipment'],
    },
    {
      name: 'Dumbbell Set',
      description: 'Adjustable dumbbells for strength training',
      price: 200,
      stock: 30,
      categoryId: categoryMap['Gym Equipment'],
    },
    
    // Kitchen Appliances - 2 products
    {
      name: 'Microwave Oven',
      description: 'Compact microwave with multiple cooking modes',
      price: 150,
      stock: 40,
      categoryId: categoryMap['Kitchen Appliances'],
    },
    {
      name: 'Coffee Maker',
      description: 'Automatic drip coffee maker with timer',
      price: 80,
      stock: 35,
      categoryId: categoryMap['Kitchen Appliances'],
    },
    
    // Fashion - 2 products
    {
      name: 'Leather Jacket',
      description: 'Genuine leather jacket for men',
      price: 180,
      stock: 20,
      categoryId: categoryMap['Fashion'],
    },
    {
      name: 'Running Shoes',
      description: 'Comfortable athletic shoes for running',
      price: 90,
      stock: 60,
      categoryId: categoryMap['Fashion'],
    },
    
    // Books - 2 products
    {
      name: 'Programming Guide',
      description: 'Complete guide to modern programming languages',
      price: 45,
      stock: 100,
      categoryId: categoryMap['Books'],
    },
    {
      name: 'Science Fiction Novel',
      description: 'Bestselling sci-fi adventure story',
      price: 25,
      stock: 75,
      categoryId: categoryMap['Books'],
    },
    
    // Sports - 2 products
    {
      name: 'Basketball',
      description: 'Official size basketball for indoor/outdoor play',
      price: 30,
      stock: 50,
      categoryId: categoryMap['Sports'],
    },
    {
      name: 'Tennis Racket',
      description: 'Professional grade tennis racket',
      price: 120,
      stock: 25,
      categoryId: categoryMap['Sports'],
    },
    
    // Beauty - 2 products
    {
      name: 'Skincare Set',
      description: 'Complete skincare routine package',
      price: 75,
      stock: 40,
      categoryId: categoryMap['Beauty'],
    },
    {
      name: 'Hair Dryer',
      description: 'Professional hair dryer with multiple heat settings',
      price: 60,
      stock: 35,
      categoryId: categoryMap['Beauty'],
    },
    
    // Toys - 2 products
    {
      name: 'Remote Control Car',
      description: 'High-speed remote control racing car',
      price: 40,
      stock: 60,
      categoryId: categoryMap['Toys'],
    },
    {
      name: 'Building Blocks',
      description: 'Educational building blocks for kids',
      price: 35,
      stock: 80,
      categoryId: categoryMap['Toys'],
    },
    
    // Automotive - 2 products
    {
      name: 'Car Battery',
      description: 'High-performance car battery with long life',
      price: 120,
      stock: 30,
      categoryId: categoryMap['Automotive'],
    },
    {
      name: 'Tire Pressure Monitor',
      description: 'Digital tire pressure monitoring system',
      price: 50,
      stock: 45,
      categoryId: categoryMap['Automotive'],
    },
  ];

  // Check if products already exist to avoid duplication
  const existingProducts = await prisma.product.findMany({
    where: {
      name: {
        in: productData.map(p => p.name)
      }
    },
    select: {
      name: true
    }
  });

  const existingProductNames = existingProducts.map(p => p.name);
  const productsToCreate = productData.filter(product => !existingProductNames.includes(product.name));

  let newProducts: any[] = [];
  if (productsToCreate.length > 0) {
    newProducts = await Promise.all(
      productsToCreate.map(product => 
        prisma.product.create({
          data: product,
        })
      )
    );
    logSuccess(`✅ Created ${newProducts.length} new products`);
  } else {
    logInfo('ℹ️  All products already exist, skipping creation');
  }

  logSuccess(`✅ Products available: ${productData.length} products`);

  // 4️⃣ --- Reviews (optional example) ---
  const firstProduct = await prisma.product.findFirst();
  if (firstProduct) {
    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: users[0].id,
          productId: firstProduct.id,
        },
      },
    });

    if (!existingReview) {
      const review = await prisma.review.create({
        data: {
          rating: 5,
          comment: 'This is a great product!',
          productId: firstProduct.id,
          userId: users[0].id,
        },
      });
      logSuccess('✅ Example review added');
    } else {
      logInfo('ℹ️  Example review already exists, skipping creation');
    }
  }

  logSuccess(`🎉 Seeding completed successfully!`);
  logSuccess(`📊 Summary: ${users.length} users, ${allCategories.length} categories, ${productData.length} products.`);
}

// --- Run + Handle Errors ---
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logError(`❌ Seeding error: ${e}`);
    await prisma.$disconnect();
    process.exit(1);
  });
