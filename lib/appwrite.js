// lib/appwrite.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: AsyncStorage,
    autoRefreshToken: true,
  },
});

// ---------- Fallback demo videos ----------

export const FALLBACK_VIDEOS = [
  {
    id: 'demo-1',
    title: 'ER stress pathways in Naegleria fowleri',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Intro to JM Labs: organizing experiments and notes',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Clinical AI: from prototype to practice',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Molecular mechanisms in parasitology research',
    author: 'Jordan Montenegro',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Laboratory techniques and best practices',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Scientific communication and data visualization',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    title: 'Advanced microscopy techniques in cell biology',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    title: 'Protein folding and structural analysis',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-9',
    title: 'Gene editing workflows with CRISPR',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-10',
    title: 'Metabolic pathway analysis and visualization',
    author: 'Jordan Montenegro',
    videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_1MB.mp4',
    thumbnailUrl: null,
    isFallback: true,
    created_at: new Date().toISOString(),
  },
];

// ---------- Auth helpers ----------

export async function createUser({ email, password, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---------- Video helpers ----------

export async function getAllPosts() {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Silently fall back to demo videos
      return FALLBACK_VIDEOS;
    }

    if (!data || data.length === 0) {
        // No rows in the table → try listing files from the public
        try {
          const files = await listVideos();
          if (files && files.length > 0) {
            const mapped = files.map((f, idx) => ({
              id: `storage-${f.name}-${idx}`,
              title: f.name.replace(/[-_]/g, ' '),
              author: 'Uploaded',
              videoUrl: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(f.bucket)}/${encodeURIComponent(f.name)}`,
              // Mark storage-mapped items as fallback so the UI can autoplay/mute
              // them in the Trending row (makes them visible immediately).
              isFallback: true,
              thumbnailUrl: null,
              created_at: f.created_at || new Date().toISOString(),
            }));

            // Prefer only MP4 files from storage for web compatibility. If the
            // user uploaded only .mov files, ignore them and fall back to the
            // bundled MP4 demo videos (so Trending shows playable content).
            const mappedMp4 = mapped.filter((m) => /\.mp4$/i.test(m.videoUrl));
            if (mappedMp4.length > 0) {
              console.log('Using MP4 files from storage:', mappedMp4.map((m) => m.videoUrl));
              return mappedMp4;
            }

            console.log('No MP4 files found in storage; falling back to bundled demos. Mapped files:', mapped.map((m) => m.videoUrl));
          }
        } catch (e) {
          console.log('listVideos fallback error:', e?.message || e);
        }

        return FALLBACK_VIDEOS;
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title ?? 'Untitled video',
      author: row.author ?? row.creator ?? 'Unknown',
      videoUrl: row.video_url ?? row.video ?? null,
      thumbnailUrl: row.thumbnail ?? row.thumbnail_url ?? null,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.log('getAllPosts unexpected error:', err);
    return FALLBACK_VIDEOS;
  }
}

// Latest posts for trending section
export async function getLatestPosts(limit = 7) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id,title,author,creator,video_url,video,thumbnail,thumbnail_url,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Fall back to whatever getAllPosts gives
      const all = await getAllPosts();
      return all.slice(0, limit);
    }

    if (!data || data.length === 0) {
      const all = await getAllPosts();
      return all.slice(0, limit);
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title ?? 'Untitled video',
      author: row.author ?? row.creator ?? 'Unknown',
      videoUrl: row.video_url ?? row.video ?? null,
      thumbnailUrl: row.thumbnail ?? row.thumbnail_url ?? null,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.log('getLatestPosts unexpected error:', err);
    const all = await getAllPosts();
    return all.slice(0, limit);
  }
}

// Search videos by title (and author as secondary). Falls back to filtering
export async function searchPosts(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  try {
    // Try to find by title first; also select minimal columns used by UI
    const { data, error } = await supabase
      .from('videos')
      .select('id,title,author,creator,video_url,video,thumbnail,thumbnail_url,created_at')
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false });

    if (error) {
      // If the table truly doesn't exist or is unreachable (404), skip secondary query.
      if (error.status === 404) {
        console.log('searchPosts: videos table not found (404) – returning fallback demos.');
        return FALLBACK_VIDEOS.filter((v) =>
          (v.title || '').toLowerCase().includes(q.toLowerCase()) ||
          (v.author || '').toLowerCase().includes(q.toLowerCase())
        );
      }
      // Other errors: fall back immediately as well
      const fallback = FALLBACK_VIDEOS.filter((v) =>
        (v.title || '').toLowerCase().includes(q.toLowerCase()) ||
        (v.author || '').toLowerCase().includes(q.toLowerCase())
      );
      return fallback;
    }

    if (!data || data.length === 0) {
      // If none by title, try author/creator as a secondary match
      const { data: byAuthor, error: authorError } = await supabase
        .from('videos')
        .select('id,title,author,creator,video_url,video,thumbnail,thumbnail_url,created_at')
        .or(`author.ilike.%${q}%,creator.ilike.%${q}%`)
        .order('created_at', { ascending: false });

      if (authorError) {
        if (authorError.status === 404) {
          console.log('searchPosts: videos table not found on secondary author search – fallback demos.');
        }
        const fallback = FALLBACK_VIDEOS.filter((v) =>
          (v.title || '').toLowerCase().includes(q.toLowerCase()) ||
          (v.author || '').toLowerCase().includes(q.toLowerCase())
        );
        return fallback;
      }

      if (!byAuthor || byAuthor.length === 0) {
        const fallback = FALLBACK_VIDEOS.filter((v) =>
          (v.title || '').toLowerCase().includes(q.toLowerCase()) ||
          (v.author || '').toLowerCase().includes(q.toLowerCase())
        );
        return fallback;
      }

      return byAuthor.map((row) => ({
        id: row.id,
        title: row.title ?? 'Untitled video',
        author: row.author ?? row.creator ?? 'Unknown',
        videoUrl: row.video_url ?? row.video ?? null,
        thumbnailUrl: row.thumbnail ?? row.thumbnail_url ?? null,
        created_at: row.created_at,
      }));
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title ?? 'Untitled video',
      author: row.author ?? row.creator ?? 'Unknown',
      videoUrl: row.video_url ?? row.video ?? null,
      thumbnailUrl: row.thumbnail ?? row.thumbnail_url ?? null,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.log('searchPosts unexpected error:', err);
    const fallback = FALLBACK_VIDEOS.filter((v) =>
      (v.title || '').toLowerCase().includes(q.toLowerCase()) ||
      (v.author || '').toLowerCase().includes(q.toLowerCase())
    );
    return fallback;
  }
}

export async function uploadVideo({ fileUri, userId }) {
  const path = `${userId}/${Date.now()}.mp4`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, blob, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function listVideos() {
  // Try common bucket name variants so user uploads are discovered even if
  const bucketsToTry = ['Videos', 'videos'];

  for (const bucket of bucketsToTry) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        // try next bucket
        continue;
      }

      if (data && data.length > 0) {
        // attach the bucket name so callers can construct the correct public URL
        return data.map((f) => ({ ...f, bucket }));
      }
    } catch (e) {
      // ignore and try next
      continue;
    }
  }

  // nothing found
  return [];
}
