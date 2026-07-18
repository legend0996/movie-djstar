import { useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import VideoPlayer from '../../components/VideoPlayer';
import Breadcrumbs from '../../components/Breadcrumbs';
import client from '../../api/client';
import { formatDuration, getImageUrl } from '../../utils/format';

export default function WatchPage() {
  const { id } = useParams();

  const { data: movie, isLoading } = useFetch(['watch', id], `/movies/${id}`);

  useEffect(() => {
    if (movie?.data?.id) {
      client.post(`/movies/${movie.data.id}/view`).catch(() => {});
    }
  }, [movie]);

  const handleProgress = useCallback((time) => {
    if (movie?.data?.id) {
      client.post(`/movies/library/progress`, {
        movieId: movie.data.id,
        positionSeconds: time,
        durationSeconds: 0,
        completed: false,
      }).catch(() => {});
    }
  }, [movie]);

  if (isLoading) return <Loader fullPage />;
  if (!movie?.data) return (
    <div className="min-h-screen bg-brand-bg pt-24 flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-6">Movie not found or you don't have access</p>
        <Link to="/my-library" className="btn-primary">Go to Library</Link>
      </div>
    </div>
  );

  const m = movie.data;

  return (
    <div className="min-h-screen bg-black">
      <VideoPlayer
        src={m.videoUrl}
        poster={getImageUrl(m.posterUrl)}
        onProgress={handleProgress}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[
          { label: 'My Library', to: '/my-library' },
          { label: m.title },
        ]} />

        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">{m.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
              {m.releaseYear && <span>{m.releaseYear}</span>}
              {m.duration && <><span>&#183;</span><span>{formatDuration(m.duration)}</span></>}
              {m.quality && <><span>&#183;</span><span className="text-brand-accent font-semibold">{m.quality}</span></>}
              {m.language && <><span>&#183;</span><span>{m.language}</span></>}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{m.description}</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link to={`/movies/${m.slug}`} className="btn-secondary text-sm !py-2.5">
              Movie Details
            </Link>
            <Link to="/my-library" className="btn-ghost text-sm !py-2.5">
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
