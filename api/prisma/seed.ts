import "dotenv/config";
import { hashPassword } from "../src/utils/password.js";
import { prisma } from "../src/lib/prisma.js";
import { Currency, ListingCondition, ListingStatus, Role } from "../generated/prisma/client.js";

const imageUrls = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80",
];

const rootCategories = [
  ["Electronics", "electronics"],
  ["Home and Furniture", "home-furniture"],
  ["Fashion", "fashion"],
  ["Vehicles and Parts", "vehicles-parts"],
  ["Baby and Kids", "baby-kids"],
  ["Books and Media", "books-media"],
  ["Sports and Outdoors", "sports-outdoors"],
  ["Beauty and Personal Care", "beauty-personal-care"],
  ["Other", "other"],
] as const;

const childCategories = [
  ["Phones and Tablets", "phones-tablets", "electronics"],
  ["Computers", "computers", "electronics"],
  ["Shoes and Accessories", "shoes-accessories", "fashion"],
] as const;

const listingTitles = [
  "Lightly used smartphone", "Mechanical keyboard", "Compact desk lamp", "Vintage denim jacket", "Mountain bicycle", "Wooden coffee table", "Wireless headphones", "Everyday running shoes", "Study desk and chair", "Mirrorless camera", "Classic novels bundle", "Camping backpack", "Kitchen appliance set", "Tablet with case", "Office monitor", "Baby stroller", "Handmade bookshelf", "Fitness watch", "Bluetooth speaker", "Portable fan",
];

const conditions = [ListingCondition.GOOD, ListingCondition.LIKE_NEW, ListingCondition.FAIR, ListingCondition.NEW, ListingCondition.GOOD];
const cities = ["Yangon", "Mandalay", "Nay Pyi Taw", "Bago", "Mawlamyine"];

const at = <T>(values: readonly T[], index: number) => {
  const value = values[index % values.length];
  if (value === undefined) throw new Error("Seed data array is empty.");
  return value;
};

async function main() {
  await prisma.report.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categoryBySlug = new Map<string, string>();
  for (const [name, slug] of rootCategories) {
    const category = await prisma.category.create({ data: { name, slug } });
    categoryBySlug.set(slug, category.id);
  }
  for (const [name, slug, parentSlug] of childCategories) {
    const category = await prisma.category.create({ data: { name, slug, parentId: categoryBySlug.get(parentSlug) } });
    categoryBySlug.set(slug, category.id);
  }

  const passwordHash = await hashPassword("MillyDemo123!");
  const admin = await prisma.user.create({ data: { id: "seed-admin", name: "Milly Admin", email: "admin@milly.local", passwordHash, role: Role.ADMIN, location: "Yangon" } });
  const users = [];
  for (let index = 1; index <= 20; index += 1) {
    users.push(await prisma.user.create({
      data: { id: `seed-user-${String(index).padStart(2, "0")}`, name: `Milly Seller ${index}`, email: `seller${index}@milly.local`, passwordHash, location: cities[(index - 1) % cities.length] },
    }));
  }

  const categories = [...categoryBySlug.values()];
  const listings = [];
  for (let index = 0; index < 100; index += 1) {
    const seller = at(users, index);
    const categoryId = at(categories, index);
    const status = index % 17 === 0 ? ListingStatus.SOLD : index % 13 === 0 ? ListingStatus.RESERVED : ListingStatus.ACTIVE;
    const currency = index % 3 === 0 ? Currency.USD : Currency.MMK;
    const listing = await prisma.listing.create({
      data: {
        id: `seed-listing-${String(index + 1).padStart(3, "0")}`,
        sellerId: seller.id,
        categoryId,
        title: `${listingTitles[index % listingTitles.length]} #${index + 1}`,
        description: `A carefully described second-hand item from a local Milly seller. Item ${index + 1} is ready for its next owner and can be inspected before purchase.`,
        priceMinor: currency === Currency.USD ? 25 + (index * 7) % 500 : 50000 + (index * 17500) % 900000,
        currency,
        condition: at(conditions, index),
        status,
        location: at(cities, index),
        viewCount: index * 3,
        publishedAt: status === ListingStatus.ACTIVE || status === ListingStatus.SOLD || status === ListingStatus.RESERVED ? new Date(Date.now() - index * 86_400_000) : null,
        images: { create: [0, 1 + (index % 4)].map((sortOrder) => ({ url: at(imageUrls, index + sortOrder), sortOrder, altText: `Photo of item ${index + 1}` })) },
      },
    });
    listings.push(listing);
  }

  for (let index = 0; index < 30; index += 1) {
    await prisma.favorite.create({ data: { userId: at(users, index).id, listingId: at(listings, index * 3).id } });
  }
  await prisma.report.create({ data: { reporterId: at(users, 0).id, listingId: at(listings, 4).id, reason: "INACCURATE_INFORMATION", details: "The title and description appear inconsistent." } });
  await prisma.report.create({ data: { reporterId: at(users, 1).id, reportedUserId: at(users, 4).id, reason: "SPAM", details: "Repeated duplicate listings." } });

  console.log("Milly seed complete.");
  console.log(`Admin: ${admin.email} / MillyDemo123!`);
  console.log(`Users: seller1@milly.local through seller20@milly.local / MillyDemo123!`);
  console.log(`Created ${users.length} users, ${listings.length} listings, ${categoryBySlug.size} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
