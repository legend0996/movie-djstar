import { useRef, useState, useCallback, useEffect } from 'react';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src, poster, onProgress, onEnded }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => setCurrentTime(el.currentTime);
    const onDur = () => setDuration(el.duration);
    const onEnd = () => onEnded?.();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('ended', onEnd);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [onEnded]);

  useEffect(() => {
    const interval = setInterval(() => {
      onProgress?.(Math.floor(videoRef.current?.currentTime || 0));
    }, 30000);
    return () => clearInterval(interval);
  }, [onProgress]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }, []);

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const el = videoRef.current;
    if (el) el.currentTime = pct * duration;
  }, [duration]);

  const handleVolume = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setVolume(pct);
    const el = videoRef.current;
    if (el) {
      el.volume = pct;
      if (pct === 0) setMuted(true);
      else setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      el.requestFullscreen();
      setFullscreen(true);
    }
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black group cursor-pointer"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={showControlsTemporarily}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full max-h-[80vh] mx-auto"
        autoPlay
        playsInline
        onClick={(e) => e.stopPropagation()}
      />

      {/* Gradient overlay */}
      <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Controls */}
      <div className={`absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
        {/* Progress bar - taller on touch devices */}
        <div className="w-full h-2.5 md:h-1.5 bg-gray-600/50 rounded-full cursor-pointer hover:h-2.5 transition-all" onClick={handleSeek}>
          <div className="h-full bg-indigo-500 rounded-full relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-100 md:opacity-0 md:group-hover/progress:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:text-indigo-400 transition-colors p-1">
              {playing ? (
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              ) : (
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <span className="text-xs tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 group/vol">
              <button onClick={toggleMute} className="hover:text-indigo-400 transition-colors p-1">
                {muted || volume === 0 ? (
                  <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <div className="w-0 group-hover/vol:w-20 md:w-0 md:group-hover/vol:w-20 overflow-hidden transition-all duration-200">
                <div className="w-20 h-1 bg-gray-600/50 rounded-full cursor-pointer" onClick={handleVolume}>
                  <div className="h-full bg-white rounded-full" style={{ width: `${muted ? 0 : volume * 100}%` }} />
                </div>
              </div>
            </div>
            <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition-colors p-1">
              {fullscreen ? (
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
