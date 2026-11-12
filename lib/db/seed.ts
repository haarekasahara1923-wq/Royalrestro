import 'dotenv/config'
import { db } from './index'
import { users, categories, dishes, restaurantInfo } from './schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { bustCache } from '../cache'

async function seed() {
  console.log('🌱 Seeding database...')

  // 1. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const staffPassword = await bcrypt.hash('Staff@123', 10)

  // 2. Insert Users
  console.log('👤 Inserting users...')
  await db.insert(users).values([
    { name: 'Admin User', email: 'admin@royalcomfort.com', passwordHash: adminPassword, role: 'admin' },
    { name: 'Reception User', email: 'reception@royalcomfort.com', passwordHash: staffPassword, role: 'reception' },
    { name: 'Kitchen User', email: 'kitchen@royalcomfort.com', passwordHash: staffPassword, role: 'kitchen' },
  ]).onConflictDoNothing()

  // 3. Insert Restaurant Info
  console.log('🏠 Inserting restaurant info...')
  await db.insert(restaurantInfo).values({
    name: 'The Royal Comfort Hotel and Restaurant',
    address: 'Hotel and Restaurant',
    themeColor: '#B5451B',
    accentColor: '#F4A261',
    slug: 'royal-comfort',
  }).onConflictDoNothing()

  // 4. Insert Categories & Dishes
  console.log('🥘 Seeding categories and dishes...')
  const cats = [
    { name: '🌅 Breakfast', order: 1 },
    { name: '🥗 Starters', order: 2 },
    { name: '🍛 Main Course', order: 3 },
    { name: '🥤 Beverages', order: 4 },
  ]

  for (const catData of cats) {
    const [insertedCat] = await db.insert(categories).values({
      name: catData.name,
      displayOrder: catData.order,
      isActive: true,
    })
    .onConflictDoUpdate({
        target: categories.name,
        set: { displayOrder: catData.order }
    })
    .returning({ id: categories.id })

    // Helper to insert or update dish image
    const upsertDish = async (dishData: any) => {
        // Try to find by name (case-insensitive for better matching)
        const allDishes = await db.select().from(dishes);
        const existing = allDishes.find(d => d.name.toLowerCase() === dishData.name.toLowerCase());

        if (existing) {
            console.log(`📡 Updating dish: ${dishData.name}`);
            await db.update(dishes).set({ 
                images: dishData.images, 
                categoryId: insertedCat.id,
                description: dishData.description,
                isVeg: dishData.isVeg,
                sizes: dishData.sizes || existing.sizes
            }).where(eq(dishes.id, existing.id));
        } else {
            console.log(`✨ Creating dish: ${dishData.name}`);
            await db.insert(dishes).values(dishData);
        }
    }

    // Add dishes for this category
    if (catData.name.includes('Breakfast')) {
      await upsertDish({ 
          categoryId: insertedCat.id, 
          name: 'Masala Dosa', 
          description: 'Crispy rice pancake with potato filling', 
          isVeg: true, 
          sizes: [{ label: 'Standard', price: 120 }],
          images: ['https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=800&auto=format&fit=crop']
      })
      await upsertDish({ 
          categoryId: insertedCat.id, 
          name: 'Poha Jalebi', 
          description: 'Indori special beaten rice with sweet jalebi', 
          isVeg: true, 
          sizes: [{ label: 'Standard', price: 60 }],
          images: ['https://images.unsplash.com/photo-1599307767316-776533da941c?q=80&w=800&auto=format&fit=crop']
      })
    } else if (catData.name.includes('Main Course')) {
      await upsertDish({ 
          categoryId: insertedCat.id, 
          name: 'Paneer Butter Masala', 
          description: 'Creamy tomato based paneer curry', 
          isVeg: true, 
          sizes: [{ label: 'Half', price: 180 }, { label: 'Full', price: 320 }],
          images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800&auto=format&fit=crop']
      })
      await upsertDish({ 
          categoryId: insertedCat.id, 
          name: 'Dal Makhani', 
          description: 'Slow cooked black lentils with butter', 
          isVeg: true, 
          sizes: [{ label: 'Bowl', price: 150 }],
          images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop']
      })
    } else if (catData.name.includes('Starters')) {
      await upsertDish({ 
          categoryId: insertedCat.id, 
          name: 'Crispy Corn', 
          description: 'Deep fried corn tossed with spices', 
          isVeg: true, 
          sizes: [{ label: 'Plate', price: 140 }],
          images: ['https://images.unsplash.com/photo-1517093157656-b99917c6471c?q=80&w=800&auto=format&fit=crop']
      })
    }
  }

  console.log('🧹 Attempting to clear Redis cache: menu:all')
  try {
    await bustCache('menu:all')
    console.log('✨ Cache busted successfully.')
  } catch (err) {
    console.error('❌ Failed to clear cache. You may need to manual clear Redis:', err)
  }
  console.log('✅ Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
