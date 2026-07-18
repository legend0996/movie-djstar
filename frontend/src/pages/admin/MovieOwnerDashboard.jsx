import { useState } from 'react';
import { useFetch } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatCurrency } from '../../utils/format';
import client from '../../api/client';

export default function MovieOwnerDashboard() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [form, setForm] = useState({
    title: '', slug: '', description: '', genre: '', releaseYear: '', duration: '',
    quality: '', language: '', director: '', cast: '', price: 0, isFree: false, isFeatured: false,
    videoUrl: '', posterUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const { data, isLoading, refetch } = useFetch(['admin-movies', page], `/movies?page=${page}&limit=20`);
  const { data: stats } = useFetch('admin-stats', '/admin/movie-owner/dashboard');

  function resetForm() {
    setForm({ title: '', slug: '', description: '', genre: '', releaseYear: '', duration: '', quality: '', language: '', director: '', cast: '', price: 0, isFree: false, isFeatured: false, videoUrl: '', posterUrl: '' });
    setEditMovie(null);
    setShowForm(false);
  }

  function handleEdit(movie) {
    setEditMovie(movie);
    setForm({
      title: movie.title, slug: movie.slug, description: movie.description || '', genre: movie.genre || '', releaseYear: movie.releaseYear?.toString() || '', duration: movie.duration?.toString() || '', quality: movie.quality || '', language: movie.language || '', director: movie.director || '', cast: movie.cast?.join(', ') || '', price: movie.price, isFree: movie.isFree, isFeatured: movie.isFeatured, videoUrl: movie.movieUrl || '', posterUrl: movie.posterUrl || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      castMembers: form.cast ? form.cast.split(',').map((c) => c.trim()) : [],
      movieUrl: form.videoUrl,
    };
    delete payload.cast;
    delete payload.videoUrl;

    try {
      if (editMovie) {
        await client.put(`/movies/${editMovie.id}`, payload);
        toast('Movie updated', 'success');
      } else {
        await client.post('/movies', payload);
        toast('Movie created', 'success');
      }
      resetForm();
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setSaving(false);
  }

  const s = stats?.data;
  const totalMovies = s?.movies?.total || 0;
  const totalRevenue = s?.sales?.lifetime || 0;
  const totalPurchases = s?.customers?.total || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Movie Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your movie catalog</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Movie'}
        </button>
      </div>

      {stats?.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Movies', value: totalMovies, color: 'text-brand-primary' },
            { label: 'Revenue', value: formatCurrency(totalRevenue), color: 'text-green-400' },
            { label: 'Streams (Month)', value: s?.streamsThisMonth || 0, color: 'text-blue-400' },
            { label: 'Customers', value: totalPurchases, color: 'text-brand-accent' },
          ].map((stat) => (
            <div key={stat.label} className="bg-brand-card rounded-xl border border-brand-border p-5">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-brand-card rounded-xl border border-brand-border p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Slug *</label>
            <input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div>
            <label className="label">Genre</label>
            <input className="input-field" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. Action" />
          </div>
          <div>
            <label className="label">Release Year</label>
            <input type="number" className="input-field" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" className="input-field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div>
            <label className="label">Quality</label>
            <select className="input-field" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
              <option value="">Select</option>
              <option value="HD">HD</option>
              <option value="Full HD">Full HD</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="label">Language</label>
            <input className="input-field" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </div>
          <div>
            <label className="label">Director</label>
            <input className="input-field" value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
          </div>
          <div>
            <label className="label">Cast (comma-separated)</label>
            <input className="input-field" value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} placeholder="Actor 1, Actor 2" />
          </div>
          <div>
            <label className="label">Price (KES)</label>
            <input type="number" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })} className="w-4 h-4 rounded border-brand-border bg-white/5 text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm text-gray-300">Free</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-brand-border bg-white/5 text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm text-gray-300">Featured</span>
            </label>
          </div>
          <div>
            <label className="label">Video URL</label>
            <input className="input-field" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">Poster URL</label>
            <input className="input-field" value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editMovie ? 'Update Movie' : 'Create Movie'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Title</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden md:table-cell">Genre</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Price</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden sm:table-cell">Status</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden lg:table-cell">Views</th>
                    <th className="text-right py-3.5 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((movie) => (
                    <tr key={movie.id} className="border-b border-brand-border hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">{movie.title}</td>
                      <td className="py-3.5 px-4 text-gray-400 hidden md:table-cell">{movie.genre || '-'}</td>
                      <td className="py-3.5 px-4">{movie.isFree ? <span className="badge badge-success">Free</span> : <span className="text-brand-primary font-semibold">{formatCurrency(movie.price)}</span>}</td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        {movie.isFeatured && <span className="badge badge-warning">Featured</span>}
                        {!movie.isFeatured && <span className="text-gray-500 text-xs">Standard</span>}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 hidden lg:table-cell">{movie.totalViews?.toLocaleString() || 0}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => handleEdit(movie)} className="text-brand-primary hover:text-brand-hover text-sm font-medium transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6">
            <Pagination pagination={data?.pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
