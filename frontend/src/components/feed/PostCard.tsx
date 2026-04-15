import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import {
  toggleLike, addComment, deleteComment, repostPost, votePoll, editPost,
  followUser, getFollowStatus,
  type Post, type Comment,
} from '../../services/feedService';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Lab',
  UNIVERSITY: 'University',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Consultant',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

interface PostCardProps {
  post: Post;
  userId?: string;
  onDelete: (id: string) => void;
  onLikeToggle: (postId: string, liked: boolean, count: number) => void;
  onCommentAdded: (postId: string, comment: Comment) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
  onRepost?: (post: Post) => void;
  onPostEdited?: (postId: string, updatedPost: Post) => void;
}

export function PostCard({ post, userId, onDelete, onLikeToggle, onCommentAdded, onCommentDeleted, onRepost, onPostEdited }: PostCardProps) {
  // Original post for reposts
  const displayPost = post.repostOf || post;

  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [localPollOptions, setLocalPollOptions] = useState(post.pollOptions || []);
  const [hasVoted, setHasVoted] = useState(post.pollOptions?.some(o => o.votedByMe) ?? false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const repostMenuRef = useRef<HTMLDivElement>(null);

  const isOwnPost = displayPost.authorId === userId;

  // Close repost menu on outside click
  useEffect(() => {
    if (!showRepostMenu) return;
    const handler = (e: MouseEvent) => {
      if (repostMenuRef.current && !repostMenuRef.current.contains(e.target as Node)) setShowRepostMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRepostMenu]);

  useEffect(() => {
    if (!isOwnPost && displayPost.authorId) {
      getFollowStatus({ userId: displayPost.authorId }).then(({ following }) => setIsFollowing(following)).catch(() => {});
    }
  }, [displayPost.authorId, isOwnPost]);

  const handleFollow = async () => {
    if (followLoading || isOwnPost) return;
    setFollowLoading(true);
    try {
      const { following } = await followUser(displayPost.authorId);
      setIsFollowing(following);
    } catch {
      toast.error('Failed to update follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { liked, likesCount } = await toggleLike(post.id);
      onLikeToggle(post.id, liked, likesCount);
    } catch {
      toast.error('Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleRepost = async (content?: string) => {
    if (reposting) return;
    setReposting(true);
    try {
      const newPost = await repostPost(post.repostOfId || post.id, content);
      toast.success(content ? 'Quote reposted!' : 'Reposted!');
      onRepost?.(newPost);
    } catch {
      toast.error('Failed to repost');
    } finally {
      setReposting(false);
      setShowQuoteModal(false);
      setQuoteText('');
    }
  };

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;
    try {
      await votePoll(optionId);
      setLocalPollOptions(prev =>
        prev.map(o => o.id === optionId ? { ...o, votesCount: o.votesCount + 1, votedByMe: true } : o)
      );
      setHasVoted(true);
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await addComment(post.id, commentText.trim());
      onCommentAdded(post.id, comment);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(post.id, commentId);
      onCommentDeleted(post.id, commentId);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await editPost(post.id, editText.trim());
      onPostEdited?.(post.id, updated);
      setEditing(false);
      toast.success('Post updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to edit post');
    } finally {
      setSavingEdit(false);
    }
  };

  // Can edit within 15 minutes
  const canEdit = post.authorId === userId && post.type === 'POST' && !post.repostOfId &&
    (Date.now() - new Date(post.createdAt).getTime()) < 15 * 60 * 1000;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
      {/* Repost indicator */}
      {post.repostOf && (
        <div className="px-5 pt-3 pb-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <Link to={`/profile/${post.author.id}`} className="font-medium hover:text-blue-500 transition-colors">
              {post.author.name}
            </Link>
            reposted
          </div>
          {post.content && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{post.content}</p>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Author Row */}
        <div className="flex items-start gap-3 mb-3">
          <Link to={`/profile/${displayPost.author.id}`} className="flex-shrink-0">
            <Avatar name={displayPost.author.name} size="md" src={displayPost.author.avatarUrl ?? undefined} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${displayPost.author.id}`}
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
              >
                {displayPost.author.name}
              </Link>
              <span className="text-xs text-gray-300 dark:text-gray-600">&middot;</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(displayPost.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {ROLE_LABELS[displayPost.author.role] ?? displayPost.author.role}
              </span>
              {displayPost.organization && (
                <>
                  <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                  <Link
                    to={`/orgs/${displayPost.organizationId}`}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
                  >
                    {displayPost.organization.name}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isOwnPost && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => { setEditing(!editing); setEditText(post.content); }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                title="Edit post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {post.authorId === userId && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Delete post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : post.content ? (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
            {post.editedAt && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">edited</span>
            )}
          </div>
        ) : null}

        {/* Event Card */}
        {(post.type === 'EVENT' || displayPost.type === 'EVENT') && displayPost.eventTitle && (
          <div className="mt-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayPost.eventTitle}</h4>
                {displayPost.eventDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(displayPost.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {displayPost.eventLocation && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {displayPost.eventLocation}
                  </p>
                )}
                {displayPost.eventLink && (
                  <a
                    href={displayPost.eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Event Link
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Poll */}
        {(post.type === 'POLL' || displayPost.type === 'POLL') && displayPost.pollQuestion && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{displayPost.pollQuestion}</p>
            <div className="space-y-2">
              {localPollOptions.map((option) => {
                const totalVotes = localPollOptions.reduce((s, o) => s + o.votesCount, 0);
                const pct = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={hasVoted}
                    className={`w-full text-left rounded-lg border transition-all relative overflow-hidden ${
                      option.votedByMe
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : hasVoted
                        ? 'border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50'
                        : 'border-gray-200 dark:border-neutral-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                    }`}
                  >
                    {hasVoted && (
                      <div
                        className={`absolute inset-y-0 left-0 ${option.votedByMe ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-neutral-600/40'}`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{option.text}</span>
                      {hasVoted && <span className="text-xs text-gray-500 dark:text-gray-400">{pct}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
              {localPollOptions.reduce((s, o) => s + o.votesCount, 0)} votes
              {displayPost.pollEndsAt && ` · Ends ${new Date(displayPost.pollEndsAt).toLocaleDateString()}`}
            </p>
          </div>
        )}

        {/* Media Gallery */}
        {displayPost.media && displayPost.media.length > 0 && (() => {
          const allMedia = displayPost.media;
          const showMedia = allMedia.slice(0, 4);
          const extraCount = allMedia.length - 4;
          const count = showMedia.length;
          return (
            <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${
              count === 1 ? 'grid-cols-1' :
              count === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {showMedia.map((m, i) => {
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                const src = m.url.startsWith('http') ? m.url : `${backendUrl}${m.url}`;
                const isFirstOfThree = count === 3 && i === 0;
                const isLastWithOverlay = i === 3 && extraCount > 0;

                return (
                  <div
                    key={m.id}
                    className={`relative bg-gray-100 dark:bg-neutral-700 ${isFirstOfThree ? 'row-span-2' : ''}`}
                  >
                    {m.type === 'video' ? (
                      <AutoplayVideo
                        src={src}
                        className={`w-full object-cover ${count === 1 ? 'max-h-[500px]' : isFirstOfThree ? 'h-full' : 'h-48'}`}
                      />
                    ) : (
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        crossOrigin="anonymous"
                        className={`w-full object-cover ${count === 1 ? 'max-h-[500px]' : isFirstOfThree ? 'h-full' : 'h-48'}`}
                      />
                    )}
                    {isLastWithOverlay && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{extraCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Stats Row */}
        {(post.likesCount > 0 || post.commentsCount > 0 || post.repostsCount > 0) && (
          <div className="flex items-center gap-4 mt-3 pt-2">
            {post.likesCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </span>
                {post.likesCount}
              </span>
            )}
            {post.commentsCount > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
              </button>
            )}
            {post.repostsCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {post.repostsCount} repost{post.repostsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-100 dark:border-neutral-700/80 px-2 py-1 flex">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            post.likedByMe
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700/50'
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Like
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 100);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
        <div ref={repostMenuRef} className="relative flex-1">
          <button
            onClick={() => setShowRepostMenu(!showRepostMenu)}
            disabled={reposting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reposting ? 'Reposting...' : 'Repost'}
          </button>
          {showRepostMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden z-50">
              <button
                onClick={() => { setShowRepostMenu(false); handleRepost(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Repost
              </button>
              <button
                onClick={() => { setShowRepostMenu(false); setShowQuoteModal(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors border-t border-gray-100 dark:border-neutral-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Quote Repost
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Repost Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => { setShowQuoteModal(false); setQuoteText(''); }}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quote Repost</h3>
              <button onClick={() => { setShowQuoteModal(false); setQuoteText(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={quoteText}
                onChange={e => setQuoteText(e.target.value)}
                placeholder="Add your thoughts..."
                rows={3}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none outline-none"
              />
              <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900/40">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar name={displayPost.author?.name} avatarUrl={displayPost.author?.avatarUrl} size={20} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{displayPost.author?.name}</span>
                </div>
                {displayPost.content && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{displayPost.content}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-neutral-700">
              <button onClick={() => { setShowQuoteModal(false); setQuoteText(''); }} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleRepost(quoteText.trim() || undefined)}
                disabled={reposting}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {reposting ? 'Posting...' : 'Repost'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-neutral-700/80 px-5 py-3 space-y-3 bg-gray-50/50 dark:bg-neutral-900/30">
          {post.comments.length > 3 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View all {post.comments.length} comments
            </button>
          )}
          <div className={post.comments.length > 3 && showAllComments ? 'max-h-64 overflow-y-auto space-y-3 pr-1' : 'space-y-3'}>
            {(showAllComments ? post.comments : post.comments.slice(-2)).map((c) => (
            <div key={c.id} className="flex gap-2.5 group">
              <Link to={`/profile/${c.user.id}`} className="flex-shrink-0 mt-0.5">
                <Avatar name={c.user.name} size="xs" src={c.user.avatarUrl ?? undefined} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-neutral-700/60 rounded-xl px-3 py-2 inline-block max-w-full">
                  <Link to={`/profile/${c.user.id}`} className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {c.user.name}
                  </Link>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
                  {c.userId === userId && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

          <form onSubmit={handleComment} className="flex gap-2.5">
            <Avatar name={undefined} size="xs" />
            <div className="flex-1 flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                disabled={submittingComment}
                className="flex-1 px-3 py-2 rounded-full border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Video Autoplay Component ───────────────────────────── */
function AutoplayVideo({ src, className }: { src: string; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        muted
        loop
        playsInline
        controls
        preload="metadata"
        className={className}
      />
    </div>
  );
}
