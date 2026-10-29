import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Film,
  Plus,
  Search,
  Filter,
  Play,
  Download,
  Trash2,
  Heart,
  Calendar,
  User,
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { ClassMediaItem, MediaType } from '../types';
import { AppUserProfile } from '../services/firebase';
import confetti from 'canvas-confetti';

interface ClassMediaTabProps {
  media: ClassMediaItem[];
  onAddMedia: (item: ClassMediaItem) => Promise<void>;
  onDeleteMedia: (id: string) => Promise<void>;
  onUpdateMedia: (item: ClassMediaItem) => Promise<void>;
  currentUser: AppUserProfile | null;
}

export const ClassMediaTab: React.FC<ClassMediaTabProps> = ({
  media,
  onAddMedia,
  onDeleteMedia,
  onUpdateMedia,
  currentUser,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeMediaItem, setActiveMediaItem] = useState<ClassMediaItem | null>(null);

  // New Media Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MediaType>('photo');
  const [newAlbum, setNewAlbum] = useState('Giờ Học Hạnh Phúc');
  const [customAlbumInput, setCustomAlbumInput] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newUrl, setNewUrl] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate distinct albums
  const existingAlbums = useMemo(() => {
    const set = new Set<string>();
    media.forEach((m) => {
      if (m.album) set.add(m.album);
    });
    return Array.from(set);
  }, [media]);

  const defaultAlbumOptions = [
    'Lễ Khai Giảng',
    'Giờ Học Hạnh Phúc',
    'Hội Thao & Ngoại Khóa',
    'Sinh Nhật Lớp',
    'Tri Ân Thầy Cô',
    'Tiết Sinh Hoạt Hạnh Phúc',
    'Dã Ngoại & Trải Nghiệm',
  ];

  const allAlbumChoices = Array.from(new Set([...defaultAlbumOptions, ...existingAlbums]));

  // Filtered Media
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (selectedAlbum !== 'all' && item.album !== selectedAlbum) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCaption = item.caption?.toLowerCase().includes(q);
        const matchAlbum = item.album.toLowerCase().includes(q);
        const matchUploader = item.uploaderName.toLowerCase().includes(q);
        return matchTitle || matchCaption || matchAlbum || matchUploader;
      }
      return true;
    });
  }, [media, filterType, selectedAlbum, searchQuery]);

  // Statistics
  const photoCount = media.filter((m) => m.type === 'photo').length;
  const videoCount = media.filter((m) => m.type === 'video').length;
  const totalLikes = media.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);

  // Handle File Upload from Local Device (Phone/PC)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setNewType(isVideo ? 'video' : 'photo');
    if (!newTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFilePreview(dataUrl);
      setNewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề kỷ niệm.');
      return;
    }

    const finalUrl = newUrl.trim() || filePreview;
    if (!finalUrl) {
      alert('Vui lòng tải lên tệp ảnh/video hoặc dán đường dẫn liên kết.');
      return;
    }

    const finalAlbum = newAlbum === '__custom__' ? customAlbumInput.trim() || 'Kỷ Niệm Lớp 6/13' : newAlbum;

    setIsSubmitting(true);
    try {
      const newItem: ClassMediaItem = {
        id: `media-${Date.now()}`,
        title: newTitle.trim(),
        type: newType,
        url: finalUrl,
        thumbnailUrl: newType === 'photo' ? finalUrl : undefined,
        album: finalAlbum,
        caption: newCaption.trim(),
        date: newDate,
        uploaderName: currentUser?.displayName || (currentUser?.role === 'teacher' ? 'Cô Đỗ Kim Anh' : 'Phụ huynh 6/13'),
        uploaderRole: currentUser?.role || 'teacher',
        duration: newType === 'video' ? newDuration || 'Clip' : undefined,
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };

      await onAddMedia(newItem);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });

      setNewTitle('');
      setNewUrl('');
      setFilePreview(null);
      setNewCaption('');
      setNewDuration('');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      alert('Không thể tải lên kỷ niệm: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (item: ClassMediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...item, likesCount: (item.likesCount || 0) + 1 };
    await onUpdateMedia(updated);
  };

  const handleDelete = async (item: ClassMediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa kỷ niệm "${item.title}" không?`)) {
      await onDeleteMedia(item.id);
      if (activeMediaItem?.id === item.id) {
        setActiveMediaItem(null);
      }
    }
  };

  const currentActiveIndex = activeMediaItem
    ? filteredMedia.findIndex((m) => m.id === activeMediaItem.id)
    : -1;

  const handlePrevMedia = () => {
    if (currentActiveIndex > 0) {
      setActiveMediaItem(filteredMedia[currentActiveIndex - 1]);
    } else {
      setActiveMediaItem(filteredMedia[filteredMedia.length - 1]);
    }
  };

  const handleNextMedia = () => {
    if (currentActiveIndex >= 0 && currentActiveIndex < filteredMedia.length - 1) {
      setActiveMediaItem(filteredMedia[currentActiveIndex + 1]);
    } else {
      setActiveMediaItem(filteredMedia[0]);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white p-6 sm:p-8 shadow-lg shadow-sky-500/10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Không Gian Lưu Trữ Kỷ Niệm Lớp 6/13</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Kho Ảnh & Video Clip Tuổi Thơ Đáng Nhớ
          </h2>

          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Nơi cô giáo chủ nhiệm Đỗ Kim Anh cùng Quý Phụ huynh lưu giữ từng nụ cười, giờ học hạnh phúc, khoảnh khắc thi đua và kỷ niệm gắn bó của các con dưới mái trường THCS Đàm Quang Trung.
          </p>

          {/* Quick Stats */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-200" />
              <span className="text-xs font-bold">
                <strong>{photoCount}</strong> Ảnh chụp
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <Film className="w-4 h-4 text-teal-200" />
              <span className="text-xs font-bold">
                <strong>{videoCount}</strong> Video clip
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-200" />
              <span className="text-xs font-bold">
                <strong>{existingAlbums.length || allAlbumChoices.length}</strong> Album sự kiện
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
              <span className="text-xs font-bold">
                <strong>{totalLikes}</strong> Yêu thích
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Add Media */}
        <div className="relative z-10 mt-6 sm:mt-0 sm:absolute sm:right-8 sm:top-8 flex flex-col items-end">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-teal-800 hover:bg-teal-50 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-teal-700" />
            <span>Tải Lên Ảnh / Video Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Media Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {media.length}
              </span>
            </button>

            <button
              onClick={() => setFilterType('photo')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'photo'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
              <span>Ảnh chụp</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px]">
                {photoCount}
              </span>
            </button>

            <button
              onClick={() => setFilterType('video')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'video'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-teal-500" />
              <span>Video clip</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                {videoCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, album, người đăng..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Album Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Album:</span>
          </span>

          <button
            onClick={() => setSelectedAlbum('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedAlbum === 'all'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả album
          </button>

          {allAlbumChoices.map((alb) => {
            const count = media.filter((m) => m.album === alb).length;
            const isSelected = selectedAlbum === alb;
            return (
              <button
                key={alb}
                onClick={() => setSelectedAlbum(alb)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{alb}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Chưa có kỷ niệm nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không tìm thấy ảnh hoặc video clip trong bộ lọc hiện tại. Hãy thử chọn album khác hoặc tải lên kỷ niệm mới!
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm kỷ niệm ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMediaItem(item)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-sky-300 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden">
                {item.type === 'video' ? (
                  <>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                        <Film className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-teal-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-teal-400 transition-transform">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-white font-mono text-[10px] font-bold">
                      {item.duration || 'Video'}
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="p-2 rounded-xl bg-black/60 text-white block backdrop-blur-xs">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>
                  </>
                )}

                {/* Album Pill on Top Left */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-slate-800 font-extrabold text-[10px] shadow-xs flex items-center gap-1">
                    {item.type === 'video' ? (
                      <Film className="w-3 h-3 text-teal-600" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-sky-600" />
                    )}
                    <span>{item.album}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleLike(item, e)}
                      className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition"
                      title="Thả tim yêu thích"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          (item.likesCount || 0) > 0 ? 'text-rose-500 fill-rose-500' : ''
                        }`}
                      />
                      <span>{item.likesCount || 0}</span>
                    </button>

                    {(currentUser?.role === 'teacher' ||
                      item.uploaderName === currentUser?.displayName) && (
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Xóa kỷ niệm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Video Player Modal */}
      {activeMediaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
            {/* Top Bar */}
            <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5 truncate pr-4">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
                  {activeMediaItem.album}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base truncate">
                  {activeMediaItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeMediaItem.url}
                  download={activeMediaItem.title}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1.5"
                  title="Mở hoặc tải về tệp gốc"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Tải về</span>
                </a>

                <button
                  onClick={() => setActiveMediaItem(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media Content Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
              {activeMediaItem.type === 'video' ? (
                isYouTubeUrl(activeMediaItem.url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeMediaItem.url)}
                    title={activeMediaItem.title}
                    className="w-full h-full min-h-[420px] border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeMediaItem.url}
                    controls
                    autoPlay
                    className="max-h-[65vh] w-auto max-w-full object-contain"
                  />
                )
              ) : (
                <img
                  src={activeMediaItem.url}
                  alt={activeMediaItem.title}
                  className="max-h-[65vh] w-auto max-w-full object-contain select-none"
                />
              )}

              {filteredMedia.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-xs"
                    title="Kỷ niệm trước"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={handleNextMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-xs"
                    title="Kỷ niệm sau"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Caption and Details */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                {activeMediaItem.caption && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeMediaItem.caption}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    <span>Đăng bởi: {activeMediaItem.uploaderName}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ngày: {activeMediaItem.date}</span>
                  </span>
                  {activeMediaItem.fileSizeStr && (
                    <>
                      <span>•</span>
                      <span>Dung lượng: {activeMediaItem.fileSizeStr}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={(e) => handleLike(activeMediaItem, e)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      (activeMediaItem.likesCount || 0) > 0
                        ? 'text-rose-500 fill-rose-500'
                        : ''
                    }`}
                  />
                  <span>{(activeMediaItem.likesCount || 0)} Yêu thích</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Media Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-slate-100 max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-teal-600 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Tải Lên Ảnh / Video Clip</h3>
                  <p className="text-xs text-sky-100">
                    Lưu giữ kỷ niệm học tập & hoạt động của Lớp 6/13
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Loại kỷ niệm</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewType('photo')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                      newType === 'photo'
                        ? 'bg-white text-sky-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Ảnh chụp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType('video')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                      newType === 'video'
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video clip</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Chọn tệp từ máy / điện thoại hoặc dán link <span className="text-rose-500">*</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl p-4 text-center cursor-pointer bg-sky-50/50 hover:bg-sky-50 transition space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={newType === 'photo' ? 'image/*' : 'video/*,image/*'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-white text-sky-600 flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sky-900">
                      Bấm để chọn {newType === 'photo' ? 'ảnh' : 'video clip'} từ thiết bị
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ JPG, PNG, WEBP, MP4, WEBM
                    </p>
                  </div>
                </div>

                {filePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-40 bg-slate-900">
                    {newType === 'video' ? (
                      <video src={filePreview} controls className="w-full h-36 object-cover" />
                    ) : (
                      <img src={filePreview} alt="Preview" className="w-full h-36 object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        setNewUrl('');
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white text-xs"
                      title="Bỏ chọn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => {
                      setNewUrl(e.target.value);
                      if (e.target.value) setFilePreview(null);
                    }}
                    placeholder="Hoặc dán URL liên kết ảnh / video (YouTube, Direct link...)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề kỷ niệm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Hội thi Kéo co Tổ 1 & Tổ 2, Giờ sinh hoạt 'Cây Biết Ơn'..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Album sự kiện</label>
                <select
                  value={newAlbum}
                  onChange={(e) => setNewAlbum(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {allAlbumChoices.map((alb) => (
                    <option key={alb} value={alb}>
                      {alb}
                    </option>
                  ))}
                  <option value="__custom__">+ Tạo tên Album mới...</option>
                </select>

                {newAlbum === '__custom__' && (
                  <input
                    type="text"
                    required
                    value={customAlbumInput}
                    onChange={(e) => setCustomAlbumInput(e.target.value)}
                    placeholder="Nhập tên album sự kiện mới..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày diễn ra</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {newType === 'video' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Thời lượng clip (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="VD: 02:45"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả / Cảm xúc chia sẻ (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Ghi lại cảm xúc hoặc lời nhắn gửi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang tải lên...' : 'Lưu vào Không gian Lớp'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
