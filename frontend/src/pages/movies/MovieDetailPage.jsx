import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Breadcrumbs from '../../components/Breadcrumbs';
import MovieRow from '../../components/MovieRow';
import PurchaseModal from '../../components/PurchaseModal';
import TrailerModal from '../../components/TrailerModal';
import ReviewSection from '../../components/ReviewSection';
import { formatCurrency, formatDuration, getImageUrl } from '../../utils/format';

export default function MovieDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPurchase, setShowPurchase] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const { data: movie, isLoading } = useFetch(['movie', slug], `/movies/slug/${slug}`);
  const { data: related } = useFetch(
    ['related', movie?.data?.genre],
    movie?.data?.genre ? `/movies?genre=${movie.data.genre}&limit=10` : null
  );

  if (isLoading) return <Loader fullPage />;
  if (!movie?.data) return (
    <EmptyState
      icon="movie"
      title="Movie not found"
      message="The movie you're looking for doesn't exist or has been removed"
      actionLabel="Browse Movies"
      actionTo="/movies"
    />
  );

  const m = movie.data;
  const inLibrary = movie.inLibrary;
  const alreadyPurchased = movie.hasPurchased;

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[50vh] md:h-[65vh] overflow-hidden">
        <img
          src={getImageUrl(m.coverUrl || m.posterUrl)}
          alt={m.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
          <Breadcrumbs items={[
            { label: 'Movies', to: '/movies' },
            { label: m.title },
          ]} />

          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-end">
            {/* Poster */}
            <div className="hidden md:block w-48 lg:w-56 flex-shrink-0 -mb-24 relative z-10">
              <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-brand-border">
                <img src={getImageUrl(m.posterUrl)} alt={m.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {m.genre && (
                  <span className="text-sm font-medium text-brand-primary uppercase tracking-wider">{m.genre}</span>
                )}
                {m.releaseYear && <span className="text-sm text-gray-400">{m.releaseYear}</span>}
                {m.duration && <span className="text-sm text-gray-400">{formatDuration(m.duration)}</span>}
                {m.quality && (
                  <span className="text-xs px-2 py-0.5 rounded border border-brand-accent/30 text-brand-accent font-semibold uppercase tracking-wider">{m.quality}</span>
                )}
                {m.isFree && <span className="badge badge-success">Free</span>}
              </div>

              <h1 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-white mb-3">
                {m.title}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                {m.averageRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-semibold">{m.averageRating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-gray-600">|</span>
                <span className="text-gray-400 text-sm">{m.viewCount?.toLocaleString() || 0} views</span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400 text-sm">{m.language || 'English'}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {user ? (
                  alreadyPurchased || inLibrary || m.isFree ? (
                    <Link to={`/watch/${m.id}`} className="btn-primary inline-flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Watch Now
                    </Link>
                  ) : m.price > 0 ? (
                    <>
                      <button onClick={() => setShowPurchase(true)} className="btn-primary inline-flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        Buy Now - {formatCurrency(m.price)}
                      </button>
                      <button onClick={() => setShowTrailer(true)} className="btn-secondary inline-flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Watch Trailer
                      </button>
                    </>
                  ) : (
                    <Link to={`/watch/${m.id}`} className="btn-primary">Watch Now</Link>
                  )
                ) : (
                  <>
                    <button onClick={() => navigate(`/login?redirect=/movies/${slug}`)} className="btn-primary inline-flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Sign In to Watch
                    </button>
                    <button onClick={() => navigate(`/register?redirect=/movies/${slug}`)} className="btn-secondary">
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content below banner */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-28 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-heading font-bold text-xl mb-3">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{m.description}</p>
            </section>

            {(m.cast?.length > 0 || m.director) && (
              <section>
                <h2 className="font-heading font-bold text-xl mb-4">Cast & Crew</h2>
                {m.director && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Director</p>
                    <p className="text-white font-medium">{m.director}</p>
                  </div>
                )}
                {m.cast?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Cast</p>
                    <div className="flex flex-wrap gap-2">
                      {m.cast.map((actor) => (
                        <span key={actor} className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-300">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <ReviewSection movieId={m.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-brand-card rounded-xl border border-brand-border p-5 space-y-4">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-gray-400">Movie Info</h3>
              <div className="space-y-3 text-sm">
                {m.director && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Director</span>
                    <span className="text-white">{m.director}</span>
                  </div>
                )}
                {m.releaseYear && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Released</span>
                    <span className="text-white">{m.releaseYear}</span>
                  </div>
                )}
                {m.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Runtime</span>
                    <span className="text-white">{formatDuration(m.duration)}</span>
                  </div>
                )}
                {m.language && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Language</span>
                    <span className="text-white">{m.language}</span>
                  </div>
                )}
                {m.quality && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality</span>
                    <span className="text-white">{m.quality}</span>
                  </div>
                )}
                {m.ageRating && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating</span>
                    <span className="text-white">{m.ageRating}</span>
                  </div>
                )}
                {m.movieSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">File Size</span>
                    <span className="text-white">{formatBytes(m.movieSize)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price card */}
            <div className="bg-brand-card rounded-xl border border-brand-border p-5">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-gray-400 mb-3">Pricing</h3>
              {m.isFree ? (
                <p className="text-2xl font-bold text-green-400">Free</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-white">{formatCurrency(m.price)}</p>
                  <p className="text-xs text-gray-500 mt-1">One-time payment. Lifetime access.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Movies */}
        {related?.data?.length > 0 && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }} className="mt-12">
            <MovieRow
              title="Related Movies"
              subtitle="You might also like"
              viewAllLink={`/movies?genre=${m.genre}`}
              movies={related.data.filter((r) => r.id !== m.id).slice(0, 10)}
            />
          </motion.div>
        )}

        {showPurchase && <PurchaseModal movie={m} onClose={() => setShowPurchase(false)} />}
        {showTrailer && <TrailerModal movie={m} onClose={() => setShowTrailer(false)} />}
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
  return `${(Number(bytes) / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
