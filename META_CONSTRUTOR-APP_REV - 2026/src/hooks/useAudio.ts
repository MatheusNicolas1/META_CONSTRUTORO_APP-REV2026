import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Tipos locais (o client Supabase não é tipado com Database gerado; tipos refletem o schema
// real consumido por AdminAudioPage em runtime — nota: diverge das migrations antigas, ver PRD_AUDIO_ELEVENLABS).
type AudioSummaryTopic = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  cron_schedule: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
};

type AudioSummaryTopicInsert = {
  org_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  cron_schedule?: string;
};

type AudioVoiceProfile = {
  id: string;
  org_id: string;
  label: string;
  elevenlabs_voice_id: string;
  language: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type AudioVoiceProfileInsert = {
  org_id: string;
  label: string;
  elevenlabs_voice_id: string;
  language?: string | null;
  is_default?: boolean;
};

type AudioDeliverySubscription = {
  id: string;
  org_id: string;
  topic_id: string;
  voice_profile_id: string | null;
  channel: string;
  recipient_phone: string;
  cron_schedule: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AudioDeliverySubscriptionInsert = {
  org_id: string;
  topic_id: string;
  voice_profile_id?: string | null;
  channel?: string;
  recipient_phone?: string;
  cron_schedule?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  is_active?: boolean;
};

type AudioSummaryJob = {
  id: string;
  org_id: string;
  topic_id: string | null;
  status: string;
  tts_chars_consumed: number;
  created_at: string;
};

const ORG_SELECT = `(select org_id from user_organization_roles where user_id = auth.uid() limit 1)`;

// ===== Audio Summary Topics =====
export function useAudioTopics(orgId?: string) {
  return useQuery({
    queryKey: ['audio-topics', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_summary_topics')
        .select('*')
        .eq('org_id', orgId!)
        .order('name');
      if (error) throw error;
      return data as AudioSummaryTopic[];
    },
    enabled: !!orgId,
  });
}

export function useCreateAudioTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (topic: AudioSummaryTopicInsert) => {
      const { data, error } = await supabase
        .from('audio_summary_topics')
        .insert(topic)
        .select()
        .single();
      if (error) throw error;
      return data as AudioSummaryTopic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-topics'] });
    },
  });
}

export function useUpdateAudioTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AudioSummaryTopic> & { id: string }) => {
      const { data, error } = await supabase
        .from('audio_summary_topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AudioSummaryTopic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-topics'] });
    },
  });
}

export function useDeleteAudioTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_summary_topics')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-topics'] });
    },
  });
}

// ===== Audio Voice Profiles =====
export function useVoiceProfiles(orgId?: string) {
  return useQuery({
    queryKey: ['voice-profiles', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_voice_profiles')
        .select('*')
        .eq('org_id', orgId!)
        .order('label');
      if (error) throw error;
      return data as AudioVoiceProfile[];
    },
    enabled: !!orgId,
  });
}

export function useCreateVoiceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: AudioVoiceProfileInsert) => {
      const { data, error } = await supabase
        .from('audio_voice_profiles')
        .insert(profile)
        .select()
        .single();
      if (error) throw error;
      return data as AudioVoiceProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });
}

export function useUpdateVoiceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AudioVoiceProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('audio_voice_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AudioVoiceProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });
}

export function useDeleteVoiceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_voice_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });
}

// ===== Audio Delivery Subscriptions =====
export function useAudioSubscriptions(orgId?: string) {
  return useQuery({
    queryKey: ['audio-subscriptions', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_delivery_subscriptions')
        .select('*, topic:topic_id(name), voice_profile:voice_profile_id(label)')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCreateAudioSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: AudioDeliverySubscriptionInsert) => {
      const { data, error } = await supabase
        .from('audio_delivery_subscriptions')
        .insert(sub)
        .select()
        .single();
      if (error) throw error;
      return data as AudioDeliverySubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-subscriptions'] });
    },
  });
}

export function useUpdateAudioSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AudioDeliverySubscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('audio_delivery_subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AudioDeliverySubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-subscriptions'] });
    },
  });
}

export function useDeleteAudioSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_delivery_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-subscriptions'] });
    },
  });
}

// ===== Audio Summary Jobs =====
export function useAudioJobs(orgId?: string, limit = 20) {
  return useQuery({
    queryKey: ['audio-jobs', orgId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_summary_jobs')
        .select('*, topic:topic_id(name), voice_profile:voice_profile_id(label)')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AudioSummaryJob[];
    },
    enabled: !!orgId,
  });
}

// ===== Audio Costs =====
export function useAudioCosts(orgId?: string, days = 30) {
  return useQuery({
    queryKey: ['audio-costs', orgId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from('audio_costs')
        .select('*')
        .eq('org_id', orgId!)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
