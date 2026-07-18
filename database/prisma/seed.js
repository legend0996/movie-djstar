const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  const roleData = [
    { name: 'User', slug: 'user', description: 'Regular platform user', isSystem: true },
    { name: 'Movie Owner', slug: 'movie_owner', description: 'Can upload and manage movies', isSystem: true },
    { name: 'Developer', slug: 'developer', description: 'Full platform access', isSystem: true },
  ];

  const createdRoles = {};
  for (const role of roleData) {
    const r = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: role,
    });
    createdRoles[role.slug] = r;
    console.log(`✅ Role "${role.name}" (${role.slug}) created/updated`);
  }

  // Create system configurations
  console.log('📦 Creating system configurations...');
  const configs = [
    { key: 'platform_name', value: 'DJ Star Original Movies', description: 'Platform display name' },
    { key: 'commission_percentage', value: '40', description: 'Developer commission percentage' },
    { key: 'currency', value: 'KES', description: 'Default currency' },
    { key: 'max_login_attempts', value: '5', description: 'Failed login attempts before lockout' },
    { key: 'lockout_duration_minutes', value: '30', description: 'Account lockout duration' },
    { key: 'enable_registration', value: 'true', description: 'Allow new user registration' },
    { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode' },
    { key: 'max_active_streams', value: '3', description: 'Maximum concurrent streams per user' },
    { key: 'session_timeout_minutes', value: '60', description: 'Inactive session timeout' },
    { key: 'verification_code_expiry', value: '15', description: 'Verification code expiry in minutes' },
    { key: 'password_reset_expiry', value: '15', description: 'Password reset code expiry in minutes' },
  ];

  for (const conf of configs) {
    await prisma.systemConfiguration.upsert({
      where: { configKey: conf.key },
      update: { configValue: conf.value, description: conf.description },
      create: {
        configKey: conf.key,
        configValue: conf.value,
        description: conf.description,
      },
    });
  }
  console.log(`✅ ${configs.length} system configurations created/updated`);

  // Create default categories
  console.log('📂 Creating default categories...');
  const categories = [
    { name: 'Action', description: 'Action-packed movies', displayOrder: 1 },
    { name: 'Comedy', description: 'Comedy movies and stand-up', displayOrder: 2 },
    { name: 'Drama', description: 'Drama and emotional stories', displayOrder: 3 },
    { name: 'Romance', description: 'Romantic movies', displayOrder: 4 },
    { name: 'Thriller', description: 'Thriller and suspense', displayOrder: 5 },
    { name: 'Horror', description: 'Horror and scary movies', displayOrder: 6 },
    { name: 'Documentary', description: 'Documentaries and real stories', displayOrder: 7 },
    { name: 'Animation', description: 'Animated movies for all ages', displayOrder: 8 },
    { name: 'Science Fiction', description: 'Sci-fi and futuristic movies', displayOrder: 9 },
    { name: 'Series', description: 'TV series and shows', displayOrder: 10, isSeries: true },
  ];

  for (const cat of categories) {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.category.upsert({
      where: { slug },
      update: { name: cat.name, description: cat.description, displayOrder: cat.displayOrder, isSeries: cat.isSeries || false },
      create: { ...cat, slug },
    });
  }
  console.log(`✅ ${categories.length} categories created/updated`);

  // Create user accounts
  console.log('👤 Creating user accounts...');
  const hashedPassword = await bcrypt.hash('Admin@123456', 12);
  const ownerPassword = await bcrypt.hash('Owner@123456', 12);
  const demoPassword = await bcrypt.hash('Demo@123456', 12);
  const userPassword = await bcrypt.hash('User@123456', 12);

  const users = [
    {
      email: 'dev@djstarmovies.com',
      passwordHash: hashedPassword,
      username: 'developer',
      roleSlug: 'developer',
      status: 'active',
      firstName: 'System',
      lastName: 'Developer',
      emailVerifiedAt: new Date(),
    },
    {
      email: 'owner@djstarmovies.com',
      passwordHash: ownerPassword,
      username: 'movie_owner',
      roleSlug: 'movie_owner',
      status: 'active',
      firstName: 'Movie',
      lastName: 'Owner',
      emailVerifiedAt: new Date(),
    },
    {
      email: 'demo@djstarmovies.com',
      passwordHash: demoPassword,
      username: 'demo_user',
      roleSlug: 'user',
      status: 'active',
      firstName: 'Demo',
      lastName: 'User',
      emailVerifiedAt: new Date(),
    },
    {
      email: 'user@djstarmovies.com',
      passwordHash: userPassword,
      username: 'test_user',
      roleSlug: 'user',
      status: 'unverified',
      firstName: 'Test',
      lastName: 'User',
    },
  ];

  for (const userData of users) {
    const { roleSlug, ...rest } = userData;
    await prisma.user.upsert({
      where: { email: rest.email },
      update: { ...rest },
      create: {
        ...rest,
        role: { connect: { slug: roleSlug } },
      },
    });
    console.log(`✅ User "${rest.email}" created/updated`);
  }

  // Create sample movies
  console.log('🎬 Creating sample movies...');
  const ownerUser = await prisma.user.findUnique({ where: { email: 'owner@djstarmovies.com' } });
  const catMap = {};
  for (const c of await prisma.category.findMany()) {
    catMap[c.slug] = c.id;
  }

  const sampleMovies = [
    {
      title: 'The Last Horizon',
      slug: 'the-last-horizon',
      categoryId: catMap['action'],
      description: 'A retired special forces operative must return to action when a shadowy organization threatens global security. With breathtaking stunts and an emotional core, this action thriller redefines the genre.',
      shortDescription: 'An retired operative returns to save the world.',
      duration: 7380,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'PG-13',
      director: 'James Cameron',
      castMembers: ['Chris Evans', 'Emily Blunt', 'Idris Elba', 'Zendaya'],
      price: 9.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2024-03-15'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/last-horizon/300/450',
      coverUrl: 'https://picsum.photos/seed/last-horizon-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 1000000,
      movieFormat: 'mp4',
    },
    {
      title: 'Midnight in Paris',
      slug: 'midnight-in-paris',
      categoryId: catMap['romance'],
      description: 'A enchanting love story set against the backdrop of the most romantic city in the world. When two strangers meet at a quaint Parisian café, neither expects the journey that follows.',
      shortDescription: 'A love story set in the City of Light.',
      duration: 5640,
      releaseYear: 2023,
      language: 'English',
      quality: 'HD',
      ageRating: 'PG',
      director: 'Sophie Laurent',
      castMembers: ['Emma Stone', 'Ryan Gosling', 'Marion Cotillard'],
      price: 7.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2023-09-20'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/midnight-paris/300/450',
      coverUrl: 'https://picsum.photos/seed/midnight-paris-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 850000,
      movieFormat: 'mp4',
    },
    {
      title: 'Laugh Factory',
      slug: 'laugh-factory',
      categoryId: catMap['comedy'],
      description: 'A hilarious ensemble comedy following the staff of a failing comedy club as they band together for one last show. Non-stop laughs from beginning to end.',
      shortDescription: 'A comedy about saving a legendary comedy club.',
      duration: 5520,
      releaseYear: 2024,
      language: 'English',
      quality: 'HD',
      ageRating: 'R',
      director: 'Tina Fey',
      castMembers: ['Kevin Hart', 'Tiffany Haddish', 'John Mulaney', 'Awkwafina'],
      price: 0,
      isFree: true,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2024-01-10'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/laugh-factory/300/450',
      coverUrl: 'https://picsum.photos/seed/laugh-factory-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 720000,
      movieFormat: 'mp4',
    },
    {
      title: 'The Dark Waters',
      slug: 'the-dark-waters',
      categoryId: catMap['thriller'],
      description: 'A psychological thriller that keeps you guessing until the final frame. A detective investigating a series of disappearances discovers a conspiracy that goes deeper than anyone imagined.',
      shortDescription: 'A detective uncovers a sinister conspiracy.',
      duration: 7200,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'R',
      director: 'David Fincher',
      castMembers: ['Jake Gyllenhaal', 'Saoirse Ronan', 'Willem Dafoe'],
      price: 11.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2024-02-14'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/dark-waters/300/450',
      coverUrl: 'https://picsum.photos/seed/dark-waters-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 1200000,
      movieFormat: 'mp4',
    },
    {
      title: 'Spirit of the Wild',
      slug: 'spirit-of-the-wild',
      categoryId: catMap['documentary'],
      description: 'An award-winning documentary that takes you on a breathtaking journey through Earth\'s most remote wilderness. Stunning cinematography captures nature in its purest form.',
      shortDescription: 'A breathtaking journey through Earth\'s wilderness.',
      duration: 5400,
      releaseYear: 2023,
      language: 'English',
      quality: '4K',
      ageRating: 'G',
      director: 'David Attenborough',
      castMembers: [],
      price: 0,
      isFree: true,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2023-11-05'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/spirit-wild/300/450',
      coverUrl: 'https://picsum.photos/seed/spirit-wild-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 2000000,
      movieFormat: 'mp4',
    },
    {
      title: 'Neon Dreams',
      slug: 'neon-dreams',
      categoryId: catMap['science-fiction'],
      description: 'In a cyberpunk future where memories can be bought and sold, a data courier discovers a secret that could topple the corporate oligarchy. Stunning visuals and a thought-provoking story.',
      shortDescription: 'A cyberpunk thriller about memory and freedom.',
      duration: 7740,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'PG-13',
      director: 'Denis Villeneuve',
      castMembers: ['Timothée Chalamet', 'Florence Pugh', 'Oscar Isaac'],
      price: 12.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2024-04-01'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/neon-dreams/300/450',
      coverUrl: 'https://picsum.photos/seed/neon-dreams-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 1500000,
      movieFormat: 'mp4',
    },
    {
      title: 'The Garden of Hope',
      slug: 'the-garden-of-hope',
      categoryId: catMap['drama'],
      description: 'A moving drama about a community coming together to save their local garden from urban development. A testament to the human spirit and the power of collective action.',
      shortDescription: 'A community fights to save their garden.',
      duration: 6480,
      releaseYear: 2023,
      language: 'English',
      quality: 'HD',
      ageRating: 'PG',
      director: 'Greta Gerwig',
      castMembers: ['Viola Davis', 'Tom Hanks', 'Sandra Oh'],
      price: 6.99,
      isFree: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2023-07-15'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/garden-hope/300/450',
      coverUrl: 'https://picsum.photos/seed/garden-hope-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 900000,
      movieFormat: 'mp4',
    },
    {
      title: 'Whispering Shadows',
      slug: 'whispering-shadows',
      categoryId: catMap['horror'],
      description: 'A family moves into a centuries-old mansion only to discover they are not alone. This masterfully crafted horror film builds dread with every scene, leading to a terrifying climax.',
      shortDescription: 'A family encounters an ancient evil in their new home.',
      duration: 6060,
      releaseYear: 2024,
      language: 'English',
      quality: 'HD',
      ageRating: 'R',
      director: 'Jordan Peele',
      castMembers: ['Lupita Nyongo', 'Daniel Kaluuya', 'Jenna Ortega'],
      price: 8.99,
      isFree: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2024-03-30'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/whispering-shadows/300/450',
      coverUrl: 'https://picsum.photos/seed/whispering-shadows-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 800000,
      movieFormat: 'mp4',
    },
    {
      title: 'Dragon Quest',
      slug: 'dragon-quest',
      categoryId: catMap['animation'],
      description: 'A young dragon must embark on an epic quest to save her magical kingdom from an ancient curse. Beautiful animation and a heartwarming story for the whole family.',
      shortDescription: 'An animated epic about a young dragon\'s quest.',
      duration: 5700,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'G',
      director: 'Pete Docter',
      castMembers: ['Jack Black', 'Anya Taylor-Joy', 'Keegan-Michael Key'],
      price: 0,
      isFree: true,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2024-02-20'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/dragon-quest/300/450',
      coverUrl: 'https://picsum.photos/seed/dragon-quest-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 1100000,
      movieFormat: 'mp4',
    },
    {
      title: 'The Nairobi Job',
      slug: 'the-nairobi-job',
      categoryId: catMap['action'],
      description: 'A high-octane action film set in Nairobi, following a team of elite operatives on a daring mission. Explosive action sequences and a gripping storyline set against Kenya\'s vibrant capital.',
      shortDescription: 'An elite team takes on a mission in Nairobi.',
      duration: 6900,
      releaseYear: 2024,
      language: 'Swahili',
      quality: 'HD',
      ageRating: 'PG-13',
      director: 'Wanuri Kahiu',
      castMembers: ['Lupita Nyongo', 'John Boyega', 'Oliver Litondo'],
      price: 4.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2024-05-01'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/nairobi-job/300/450',
      coverUrl: 'https://picsum.photos/seed/nairobi-job-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 950000,
      movieFormat: 'mp4',
    },
    {
      title: 'Sahara Love',
      slug: 'sahara-love',
      categoryId: catMap['romance'],
      description: 'Two travelers from different worlds meet on a journey across the Sahara desert. A visually stunning romance that explores love, loss, and the ties that bind us.',
      shortDescription: 'A romance unfolds across the Sahara desert.',
      duration: 6120,
      releaseYear: 2023,
      language: 'English',
      quality: 'HD',
      ageRating: 'PG-13',
      director: 'Mira Nair',
      castMembers: ['Dev Patel', 'Freida Pinto', 'Idris Elba'],
      price: 5.99,
      isFree: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2023-12-10'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/sahara-love/300/450',
      coverUrl: 'https://picsum.photos/seed/sahara-love-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 780000,
      movieFormat: 'mp4',
    },
    {
      title: 'Kaleidoscope',
      slug: 'kaleidoscope',
      categoryId: catMap['drama'],
      description: 'A groundbreaking film told from five different perspectives, each revealing a different facet of the same story. An innovative narrative that challenges how we see the world.',
      shortDescription: 'One story told from five unique perspectives.',
      duration: 8040,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'R',
      director: 'Christopher Nolan',
      castMembers: ['Cillian Murphy', 'Margot Robbie', 'Robert Downey Jr.', 'Natalie Portman'],
      price: 14.99,
      isFree: false,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2024-04-15'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/kaleidoscope/300/450',
      coverUrl: 'https://picsum.photos/seed/kaleidoscope-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 1800000,
      movieFormat: 'mp4',
    },
    {
      title: 'Coastal Roads',
      slug: 'coastal-roads',
      categoryId: catMap['comedy'],
      description: 'A hilarious road trip comedy following three friends on a journey along Kenya\'s stunning coastline. Misadventures, unexpected friendships, and plenty of laughs.',
      shortDescription: 'A comedic road trip along the Kenyan coast.',
      duration: 5400,
      releaseYear: 2024,
      language: 'English',
      quality: 'HD',
      ageRating: 'PG-13',
      director: 'Mugambi Nthiga',
      castMembers: ['Brian Ogola', 'Nice Githinji', 'Joseph Wairimu'],
      price: 0,
      isFree: true,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2024-01-25'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/coastal-roads/300/450',
      coverUrl: 'https://picsum.photos/seed/coastal-roads-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 650000,
      movieFormat: 'mp4',
    },
    {
      title: 'Beyond the Stars',
      slug: 'beyond-the-stars',
      categoryId: catMap['science-fiction'],
      description: 'The year 2157. Humanity\'s first interstellar colony ship encounters an alien intelligence beyond anything imagined. A thought-provoking sci-fi epic about first contact.',
      shortDescription: 'Humanity makes first contact with alien intelligence.',
      duration: 8220,
      releaseYear: 2024,
      language: 'English',
      quality: '4K',
      ageRating: 'PG-13',
      director: 'Ridley Scott',
      castMembers: ['Zendaya', 'Tom Hardy', 'Cate Blanchett'],
      price: 13.99,
      isFree: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2024-06-01'),
      createdBy: ownerUser.id,
      posterUrl: 'https://picsum.photos/seed/beyond-stars/300/450',
      coverUrl: 'https://picsum.photos/seed/beyond-stars-cover/1200/600',
      movieUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      movieSize: 2200000,
      movieFormat: 'mp4',
    },
  ];

  for (const movie of sampleMovies) {
    await prisma.movie.upsert({
      where: { slug: movie.slug },
      update: movie,
      create: movie,
    });
  }
  console.log(`✅ ${sampleMovies.length} sample movies created/updated`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Default accounts:');
  console.log('  Developer:    dev@djstarmovies.com / Admin@123456');
  console.log('  Movie Owner:  owner@djstarmovies.com / Owner@123456');
  console.log('  Demo User:    demo@djstarmovies.com / Demo@123456');
  console.log('  Test User:    user@djstarmovies.com / User@123456 (unverified)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
