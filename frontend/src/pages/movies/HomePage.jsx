import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import HeroCarousel from '../../components/HeroCarousel';
import MovieRow from '../../components/MovieRow';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  const { data: featured, isLoading: featuredLoading } = useFetch('home-featured', '/movies/featured');
  const { data: popular, isLoading: popularLoading } = useFetch('home-popular', '/movies/popular');
  const { data: recent, isLoading: recentLoading } = useFetch('home-recent', '/movies/recent');
  const { data: allMovies, isLoading: allLoading } = useFetch('home-all', '/movies?limit=50&sort=newest');

  const trending = allMovies?.data?.slice(0, 10) || [];
  const recommended = allMovies?.data?.slice(2, 12) || [];
  const topRated = allMovies?.data?.filter(m => m.averageRating > 0).slice(0, 10) || [];

  const featuredMovies = featured?.data || [];
  const popularMovies = popular?.data || [];
  const recentMovies = recent?.data || [];

  return (
    <div className="bg-brand-bg relative bg-noise">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Carousel */}
      <HeroCarousel movies={featuredMovies} isLoading={featuredLoading} />

      {/* Content sections */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 md:space-y-16 -mt-20 relative z-10 pb-12">
        {/* Featured */}
        {featuredMovies.length > 1 && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
            <MovieRow
              title="Featured"
              subtitle="Curated picks just for you"
              viewAllLink="/movies?filter=featured"
              movies={featuredMovies.slice(1)}
              isLoading={featuredLoading}
            />
          </motion.div>
        )}

        {/* Popular */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <MovieRow
            title="Popular Now"
            subtitle="What everyone's watching"
            viewAllLink="/movies?sort=popular"
            movies={popularMovies}
            isLoading={popularLoading}
          />
        </motion.div>

        {/* Trending */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <MovieRow
            title="Trending"
            subtitle="Rising fast"
            viewAllLink="/movies"
            movies={trending}
            isLoading={allLoading}
          />
        </motion.div>

        {/* Recently Added */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <MovieRow
            title="New Releases"
            subtitle="Fresh off the press"
            viewAllLink="/movies?sort=newest"
            movies={recentMovies}
            isLoading={recentLoading}
          />
        </motion.div>

        {/* Recommended */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <MovieRow
            title="Recommended For You"
            subtitle="Based on your watching history"
            viewAllLink="/movies"
            movies={recommended}
            isLoading={allLoading}
          />
        </motion.div>

        {/* Top Rated */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <MovieRow
            title="Top Rated"
            subtitle="Highest rated movies"
            viewAllLink="/movies?sort=popular"
            movies={topRated}
            isLoading={allLoading}
          />
        </motion.div>
      </div>
    </div>
  );
}
