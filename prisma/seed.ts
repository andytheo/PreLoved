import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users
  const password = await bcrypt.hash('Password1', 12)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Chen',
      email: 'alice@example.com',
      password,
      city: 'Toronto, ON',
      bio: 'Minimalist living advocate. Love giving my things a new home!',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Martinez',
      email: 'bob@example.com',
      password,
      city: 'Vancouver, BC',
      bio: 'Moving soon — lots of great stuff to give away!',
    },
  })

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      name: 'Carol Johnson',
      email: 'carol@example.com',
      password,
      city: 'Toronto, ON',
    },
  })

  // Clear existing listings so re-seeding is idempotent
  await prisma.favorite.deleteMany()
  await prisma.listing.deleteMany()

  // Image helper — stores Unsplash URL + photographer credit
  const img = (photoId: string, credit: string, creditUrl: string) =>
    JSON.stringify([{ url: `https://images.unsplash.com/${photoId}?w=600&q=80`, credit, creditUrl }])

  // Create sample listings
  const listings = [
    {
      title: 'IKEA KALLAX Shelf Unit — White',
      description: 'Great condition 2x4 KALLAX in white. We are redecorating and it no longer fits. No scratches or damage. You must be able to carry it yourself — it is heavy! Dimensions: 77x147cm.',
      category: 'furniture',
      condition: 'good',
      city: 'Toronto, ON',
      address: 'Kensington Market area',
      userId: alice.id,
      images: img('photo-1555041469-a586c61ea9bc', 'Kam Idris', 'https://unsplash.com/@kamiceri'),
    },
    {
      title: "Bundle of Women's Clothes — Size M",
      description: 'Clearing out my wardrobe! About 15 items including tops, jeans, a blazer and dresses. All washed and in good condition. Some fast fashion brands, some nicer pieces.',
      category: 'clothing',
      condition: 'good',
      city: 'Toronto, ON',
      address: 'Annex area',
      userId: alice.id,
      images: img('photo-1567401893414-76b7b1e5a7a5', 'nrd', 'https://unsplash.com/@the_nrd'),
    },
    {
      title: 'Sony 32" LED TV — Works perfectly',
      description: 'Upgrading to a bigger screen. This Sony Bravia 32" works flawlessly. Has HDMI, USB ports. Remote included. Just needs a home!',
      category: 'electronics',
      condition: 'like-new',
      city: 'Vancouver, BC',
      address: 'Kitsilano',
      userId: bob.id,
      images: img('photo-1593359677879-a4bb92f4dd55', 'DESIGNECOLOGIST', 'https://unsplash.com/@designecologist'),
    },
    {
      title: "Stack of Children's Books",
      description: "About 20 children's books for ages 3-8. Authors include Eric Carle, Dr. Seuss, Mo Willems. All in great condition — no torn pages.",
      category: 'books',
      condition: 'good',
      city: 'Toronto, ON',
      userId: carol.id,
      images: img('photo-1481627834876-b7833e8f5570', 'Kimberly Farmer', 'https://unsplash.com/@kimberlyfarmer'),
    },
    {
      title: 'Outdoor Patio Set — Table + 4 chairs',
      description: 'Moving to a smaller place without a patio. Metal patio set, slight rust on one chair leg but otherwise solid. Table folds down for storage.',
      category: 'furniture',
      condition: 'fair',
      city: 'Vancouver, BC',
      address: 'Commercial Drive',
      userId: bob.id,
      images: img('photo-1600210492486-724fe5c67fb3', 'Lotus Design N Print', 'https://unsplash.com/@lotusdesignnprint'),
    },
    {
      title: 'Baby Swing — Fisher Price',
      description: 'Baby has outgrown it. Fisher Price My Little Snugabunny Swing. Works perfectly, all settings functional. Comes with all original parts. Cleaned and sanitized.',
      category: 'baby',
      condition: 'good',
      city: 'Toronto, ON',
      address: 'East York',
      userId: carol.id,
      images: img('photo-1544367567-0f2fcb009e0b', 'Bonnie Kittle', 'https://unsplash.com/@bonniekdesign'),
    },
    {
      title: 'Box of LEGO (mixed sets)',
      description: 'Large box of mixed LEGO — probably 3-4 sets worth. Not sorted. Great for creative free building or if you have the patience to find the sets. For kids 6+.',
      category: 'toys',
      condition: 'good',
      city: 'Toronto, ON',
      userId: alice.id,
      images: img('photo-1585366119957-e9730b6d0f60', 'Xavi Cabrera', 'https://unsplash.com/@xavi_cabrera'),
    },
    {
      title: 'KitchenAid Stand Mixer (needs repair)',
      description: 'Classic KitchenAid stand mixer. The lift mechanism is slightly stiff but it still works. Good for someone handy or wanting to use it as-is. Includes original bowl and 3 attachments.',
      category: 'kitchen',
      condition: 'for-parts',
      city: 'Vancouver, BC',
      userId: bob.id,
      images: img('photo-1556909114-f6e7ad7d3136', 'Jason Briscoe', 'https://unsplash.com/@jbriscoe24'),
    },
  ]

  for (const listing of listings) {
    await prisma.listing.create({ data: listing })
  }

  console.log('✅ Seed complete!')
  console.log('Demo accounts:')
  console.log('  alice@example.com / Password1')
  console.log('  bob@example.com / Password1')
  console.log('  carol@example.com / Password1')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
