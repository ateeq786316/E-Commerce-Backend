// // seed.ts
// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   // Create a demo user
//   const hashedPassword = await bcrypt.hash('password123', 10);
  
//   const demoUser = await prisma.user.create({
//     data: {
//       email: 'demo@example.com',
//       password: hashedPassword,
//       name: 'Demo User',
//     },
//   });
  
//   console.log('Demo user created:', demoUser.email);
  
//   // Create categories
//   const categories = [
//     { name: 'Electronics', description: 'Electronic devices and gadgets' },
//     { name: 'Clothing', description: 'Apparel and fashion items' },
//     { name: 'Books', description: 'Books and educational materials' },
//     { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
//     { name: 'Sports', description: 'Sports equipment and accessories' },
//   ];
  
//   const createdCategories = [];
//   for (const categoryData of categories) {
//     const category = await prisma.category.create({
//       data: categoryData,
//     });
//     createdCategories.push();
//     console.log('Category created:', category.name);
//   }
  
//   // Create sample products
//   const products = [
//     {
//       name: 'Smartphone',
//       description: 'Latest model smartphone with advanced features',
//       price: 699.99,
//       stock: 25,
//       categoryId: createdCategories[0].id, // Electronics
//     },
//     {
//       name: 'T-Shirt',
//       description: 'Comfortable cotton t-shirt',
//       price: 19.99,
//       stock: 100,
//       categoryId: createdCategories[1].id, // Clothing
//     },
//     {
//       name: 'Programming Book',
//       description: 'Learn programming with this comprehensive guide',
//       price: 39.99,
//       stock: 50,
//       categoryId: createdCategories[2].id, // Books
//     },
//     {
//       name: 'Garden Tools Set',
//       description: 'Complete set of essential garden tools',
//       price: 89.99,
//       stock: 15,
//       categoryId: createdCategories[3].id, // Home & Garden
//     },
//     {
//       name: 'Yoga Mat',
//       description: 'Non-slip yoga mat for exercise',
//       price: 29.99,
//       stock: 30,
//       categoryId: createdCategories[4].id, // Sports
//     },
//   ];
  
//   const createdProducts = [];
//   for (const productData of products) {
//     const product = await prisma.product.create({
//       data: {
//         ...productData,
//         userId: demoUser.id,
//       },
//     });
//     createdProducts.push(product);
//     console.log('Product created:', product.name);
//   }
  
//   // Create sample reviews
//   const reviews = [
//     {
//       rating: 5,
//       comment: 'Excellent product! Highly recommended.',
//       userId: demoUser.id,
//       productId: createdProducts[0].id, // Smartphone
//     },
//     {
//       rating: 4,
//       comment: 'Good quality t-shirt, comfortable to wear.',
//       userId: demoUser.id,
//       productId: createdProducts[1].id, // T-Shirt
//     },
//     {
//       rating: 5,
//       comment: 'This book helped me learn programming quickly.',
//       userId: demoUser.id,
//       productId: createdProducts[2].id, // Programming Book
//     },
//   ];
  
//   for (const reviewData of reviews) {
//     const review = await prisma.review.create({
//       data: reviewData,
//     });
//     console.log('Review created for product ID:', review.productId);
//   }
  
//   console.log('Seeding completed successfully!');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });