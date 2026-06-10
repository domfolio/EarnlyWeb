import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  completeSetup as completeSetupRequest,
  createJob as createJobRequest,
  deleteJob as deleteJobRequest,
  getMe,
  updateJob as updateJobRequest,
  updateProfile,
} from "../services/earnlyApi";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured yet. Add your Supabase URL and anon key to .env.local.");
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyMe = useCallback((payload) => {
    setUser(payload.user ?? null);
    setProfile(payload.profile ?? null);
    setJobs(payload.jobs ?? []);
    return payload;
  }, []);

  const clearAppState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setJobs([]);
  }, []);

  const refreshMe = useCallback(async () => {
    const payload = await getMe();
    return applyMe(payload);
  }, [applyMe]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!isMounted) return;

        setSession(data.session ?? null);

        if (data.session) {
          await refreshMe();
        } else {
          clearAppState();
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load your session.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession ?? null);
      if (!nextSession) {
        clearAppState();
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [clearAppState, refreshMe]);

  const signIn = useCallback(
    async ({ email, password }) => {
      requireSupabaseConfig();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setSession(data.session ?? null);
      return refreshMe();
    },
    [refreshMe]
  );

  const signUp = useCallback(
    async ({ name, email, password }) => {
      requireSupabaseConfig();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/setup`,
        },
      });
      if (signUpError) throw signUpError;

      setSession(data.session ?? null);
      if (data.session) {
        await refreshMe();
      }
      return data;
    },
    [refreshMe]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    clearAppState();
  }, [clearAppState]);

  const sendPasswordReset = useCallback(async (email) => {
    requireSupabaseConfig();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) throw resetError;
  }, []);

  const updatePassword = useCallback(async (password) => {
    requireSupabaseConfig();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
  }, []);

  const completeSetup = useCallback(async (payload) => {
    const data = await completeSetupRequest(payload);
    setProfile(data.profile);
    setJobs([data.job]);
    return data;
  }, []);

  const addJob = useCallback(async (payload) => {
    const data = await createJobRequest(payload);
    setJobs((currentJobs) => [...currentJobs, data.job]);
    setProfile((currentProfile) => ({
      ...(currentProfile ?? {}),
      setupCompleted: true,
      selectedJobId: data.job.id,
    }));
    return data.job;
  }, []);

  const editJob = useCallback(async (jobId, payload) => {
    const data = await updateJobRequest(jobId, payload);
    setJobs((currentJobs) => currentJobs.map((job) => (job.id === jobId ? data.job : job)));
    return data.job;
  }, []);

  const removeJob = useCallback(async (jobId) => {
    const data = await deleteJobRequest(jobId);
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
    setProfile((currentProfile) => ({
      ...(currentProfile ?? {}),
      selectedJobId: data.selectedJobId,
    }));
    return data.selectedJobId;
  }, []);

  const selectJob = useCallback(async (jobId) => {
    setProfile((currentProfile) => ({ ...(currentProfile ?? {}), selectedJobId: jobId }));
    const data = await updateProfile({ selectedJobId: jobId });
    setProfile(data.profile);
  }, []);

  const selectedJobId = profile?.selectedJobId ?? jobs[0]?.id ?? null;
  const hasCompletedSetup = Boolean(profile?.setupCompleted && jobs.length > 0);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      jobs,
      selectedJobId,
      hasCompletedSetup,
      loading,
      error,
      refreshMe,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      completeSetup,
      addJob,
      editJob,
      removeJob,
      selectJob,
    }),
    [
      session,
      user,
      profile,
      jobs,
      selectedJobId,
      hasCompletedSetup,
      loading,
      error,
      refreshMe,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      completeSetup,
      addJob,
      editJob,
      removeJob,
      selectJob,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
