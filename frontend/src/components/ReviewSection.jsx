import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFetch, usePost, usePut } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatDate } from '../utils/format';
import Loader from './Loader';

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 transition-colors"
        >
          <svg
            className={`w-7 h-7 ${star <= value ? 'text-brand-accent' : 'text-gray-600 hover:text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-brand-accent' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewSection({ movieId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useFetch(['reviews', movieId, page], `/movies/${movieId}/reviews?page=${page}&limit=10`);
  const { data: myReviewData } = useFetch(['my-review', movieId], user ? `/movies/${movieId}/reviews/mine` : null);

  const submitMutation = usePost(`/movies/${movieId}/reviews`, {
    invalidate: ['reviews', 'my-review', 'movie'],
    onSuccess: () => {
      toast('Review submitted!', 'success');
      setShowForm(false);
      setRating(0);
      setComment('');
    },
  });

  const updateMutation = usePut(`/movies/reviews/${myReviewData?.data?.id}`, {
    invalidate: ['reviews', 'my-review', 'movie'],
    onSuccess: () => {
      toast('Review updated!', 'success');
      setShowForm(false);
    },
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;
  const myReview = myReviewData?.data;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) {
      toast('Please select a rating', 'error');
      return;
    }
    if (myReview) {
      updateMutation.mutate({ rating, comment: comment || undefined });
    } else {
      submitMutation.mutate({ movieId, rating, comment });
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-xl">Reviews</h2>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-ghost text-sm"
          >
            {showForm ? 'Cancel' : myReview ? 'Edit Your Review' : 'Write a Review'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-brand-card rounded-xl border border-brand-border p-4 mb-6 space-y-3"
          >
            <StarInput value={rating} onChange={setRating} />
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Share your thoughts about this movie..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary text-sm"
                disabled={submitMutation.isPending || updateMutation.isPending}
              >
                {submitMutation.isPending || updateMutation.isPending ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Loader />
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-brand-card rounded-xl border border-brand-border">
          <svg className="w-10 h-10 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-brand-card rounded-xl border border-brand-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary">
                    {(review.user?.username || 'A')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{review.user?.username || 'Anonymous'}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
              <StarDisplay rating={review.rating} />
              {review.comment && (
                <p className="text-sm text-gray-300 mt-2 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 self-center">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
