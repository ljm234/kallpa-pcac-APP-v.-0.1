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

    console.log('getAllPosts - raw data:', data);
    console.log('getAllPosts - error:', error);
    
    // Log first video to see structure
    if (data && data.length > 0) {
      console.log('First video in database:', JSON.stringify(data[0], null, 2));
    }

    if (error) {
      console.log('getAllPosts: Error fetching videos, using fallback:', error);
      // Return empty array instead of demo videos
      return [];
    }

    if (!data || data.length === 0) {
        console.log('getAllPosts: No videos in database, checking storage...');
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

        // Return empty array instead of demo videos
        return [];
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
    return [];
  }
}

// Latest posts for trending section
export async function getLatestPosts(limit = 7) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id,title,author,creator,video_url,thumbnail,created_at')
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
      videoUrl: row.video_url ?? null,
      thumbnailUrl: row.thumbnail ?? null,
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
      // If the table truly doesn't exist or is unreachable (404), return empty array
      if (error.status === 404) {
        console.log('searchPosts: videos table not found (404) – returning empty array.');
        return [];
      }
      // Other errors: return empty array
      return [];
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
          console.log('searchPosts: videos table not found on secondary author search – returning empty.');
        }
        return [];
      }

      if (!byAuthor || byAuthor.length === 0) {
        return [];
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
    return [];
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

export async function getUserPosts(userId) {
  if (!userId) {
    console.log('getUserPosts: no userId provided, returning empty array');
    return [];
  }

  try {
    // Try to fetch videos created by this user from the database
    const { data, error } = await supabase
      .from('videos')
      .select('id,title,author,creator,video_url,thumbnail,created_at')
      .eq('creator', userId) // Fixed: removed redundant fields and fixed query
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist (404) or other error, fall back to demo videos
      console.error('getUserPosts error:', error);
      if (error.code === 'PGRST116' || error.status === 404) {
        console.log('getUserPosts: videos table not found (404) – returning empty array.');
      }
      // Return empty array instead of demo videos
      return [];
    }

    if (!data || data.length === 0) {
      // No videos for this user; return empty array
      console.log('getUserPosts: No videos found for user, returning empty array');
      return [];
    }

    console.log('getUserPosts - raw data for user:', data);
    console.log('getUserPosts - first video:', JSON.stringify(data[0], null, 2));

    return data.map((row) => ({
      id: row.id,
      title: row.title ?? 'Untitled video',
      author: row.author ?? row.creator ?? 'Unknown',
      videoUrl: row.video_url ?? null,
      thumbnailUrl: row.thumbnail ?? null,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.log('getUserPosts unexpected error:', err);
    return [];
  }
}

const encodePath = (path = '') =>
  path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const buildPublicUrl = (bucket, path) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodePath(path)}`;

const KALLPA_BUCKET = 'kallpa-assets';

export async function uploadKallpaAsset({
  uri,
  fileName,
  contentType = 'application/octet-stream',
  directory = 'manual',
  sourceSessionId = null,
}) {
  if (!uri) {
    throw new Error('Attachment missing file URI.');
  }

  const safeName = (fileName || 'attachment').replace(/\s+/g, '-');
  const path = `${directory}/${Date.now()}-${safeName}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage.from(KALLPA_BUCKET).upload(path, blob, {
    contentType,
    upsert: false,
    cacheControl: '3600',
  });

  if (error) throw error;

  const kind = contentType?.startsWith('image/') ? 'image' : 'document';

  return {
    id: `${path}`,
    label: fileName || safeName,
    path: data?.path ?? path,
    bucket: KALLPA_BUCKET,
    url: buildPublicUrl(KALLPA_BUCKET, data?.path ?? path),
    type: kind,
    mimeType: contentType,
    sourceSessionId,
  };
}

export async function saveKallpaSession(sessionPayload = {}) {
  const payload = {
    ...sessionPayload,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('kallpa_sessions')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createManualKallpaCase(casePayload = {}) {
  // Map our format to the actual table columns
  const payload = {
    title: casePayload.title,
    clinic_type: casePayload.clinic_type,
    language: casePayload.language,
    clinical_history: casePayload.notes, // Map notes to clinical_history
    transcript: casePayload.metadata?.events || [], // Save events as transcript array
    attachments: casePayload.attachments || [],
    // Optional fields that might be in casePayload
    symptom_cluster: casePayload.symptom_cluster,
    labs: casePayload.labs,
    panel_base: casePayload.panel_base,
    panel_variants: casePayload.panel_variants,
    playbooks: casePayload.playbooks,
  };

  const { data, error } = await supabase
    .from('kallpa_cases')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentKallpaSessions(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('kallpa_sessions')
      .select(
        'id, scenario_id, duration_ms, risk_score, decision, metadata, created_at, language, events'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.status === 404) {
        console.log('getRecentKallpaSessions: table missing, returning empty list');
        return [];
      }
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id ?? `remote-session-${row.created_at}`,
      scenario_id: row.scenario_id,
      duration_ms: row.duration_ms ?? row.metadata?.duration_ms ?? null,
      risk_score: row.risk_score ?? row.metadata?.risk_score ?? null,
      decision: row.decision ?? row.metadata?.decision ?? null,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
      language: row.language ?? row.metadata?.language ?? 'en',
      events: row.events ?? [],
    }));
  } catch (err) {
    console.log('getRecentKallpaSessions unexpected error:', err);
    return [];
  }
}

export async function getRecentManualCases(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('kallpa_cases')
      .select(
        'id, title, clinical_history, attachments, inserted_at, updated_at, language, clinic_type, transcript'
      )
      .order('inserted_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.status === 404) {
        console.log('getRecentManualCases: table missing, returning empty list');
        return [];
      }
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      notes: row.clinical_history, // Map clinical_history back to notes
      clinic_type: row.clinic_type,
      language: row.language,
      created_at: row.inserted_at, // Map inserted_at to created_at for consistency
      attachments: Array.isArray(row.attachments) ? row.attachments : [],
      metadata: {
        events: Array.isArray(row.transcript) ? row.transcript : [], // Map transcript to events
      },
    }));
  } catch (err) {
    console.log('getRecentManualCases unexpected error:', err);
    return [];
  }
}

export async function deleteManualKallpaCase(caseId) {
  if (!caseId) {
    throw new Error('Case ID is required to delete a record.');
  }

  const { data, error } = await supabase
    .from('kallpa_cases')
    .delete()
    .eq('id', caseId)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  return data?.id ?? caseId;
}

export async function updateManualKallpaCase(caseId, updates = {}) {
  if (!caseId) {
    throw new Error('Case ID is required to update a record.');
  }

  const payload = {
    title: updates.title,
    clinical_history: updates.notes,
    clinic_type: updates.clinic_type,
    language: updates.language,
    attachments: updates.attachments,
    transcript: updates.transcript,
  };

  Object.keys(payload).forEach((key) => {
    if (typeof payload[key] === 'undefined') {
      delete payload[key];
    }
  });

  if (!Object.keys(payload).length) {
    throw new Error('Provide at least one field to update.');
  }

  const { data, error } = await supabase
    .from('kallpa_cases')
    .update(payload)
    .eq('id', caseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload a file (video or image) to Supabase Storage
 * 
 * SETUP REQUIRED: Before using this function, create two storage buckets in Supabase:
 * 1. Bucket name: "videos" (for video files) - Set to PUBLIC
 * 2. Bucket name: "images" (for thumbnail images) - Set to PUBLIC
 * 
 * To create buckets:
 * - Go to Supabase Dashboard → Storage → Create Bucket
 * - Make both buckets PUBLIC so uploaded files are accessible
 * 
 * @param {Object} file - File object with uri, name, and mimeType
 * @param {string} type - 'video' or 'image'
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadFile(file, type) {
  if (!file || !file.uri) {
    throw new Error('Invalid file object');
  }

  try {
    // Determine the bucket based on file type
    const bucket = type === 'video' ? 'Videos' : 'Images';
    
    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const fileExt = file.name?.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Fetch the file as a blob for upload
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: file.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`uploadFile (${type}) error:`, err);
    throw err;
  }
}

/**
 * Create a new video record in the database
 * @param {Object} videoData - Video metadata
 * @param {string} videoData.title - Video title
 * @param {string} videoData.videoUrl - Video file URL
 * @param {string} videoData.thumbnailUrl - Thumbnail image URL
 * @param {string} videoData.prompt - AI prompt used to create the video
 * @param {string} videoData.creator - User ID of the creator
 * @returns {Promise<Object>} - Created video record
 */
export async function createVideo(videoData) {
  const { title, videoUrl, thumbnailUrl, prompt, creator } = videoData;

  if (!title || !videoUrl || !creator) {
    throw new Error('Missing required fields: title, videoUrl, and creator are required');
  }

  try {
    // Get current user for author name
    const { data: userData } = await supabase.auth.getUser();
    const authorName = userData?.user?.user_metadata?.username || 
                       userData?.user?.email?.split('@')[0] || 
                       'Unknown';

    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          title,
          video_url: videoUrl,
          thumbnail: thumbnailUrl,
          prompt: prompt || null,
          creator,
          author: authorName,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create video error:', error);
      throw new Error(`Failed to create video: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail,
      created_at: data.created_at,
    };
  } catch (err) {
    console.error('createVideo error:', err);
    throw err;
  }
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
