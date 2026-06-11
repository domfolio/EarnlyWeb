import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AddJob from "./pages/AddJob";
import Dashboard from "./pages/Dashboard";
import Entry from "./pages/Entry";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ManageJobs from "./pages/ManageJobs";
import ResetPassword from "./pages/ResetPassword";
import Setup from "./pages/Setup";
import SignUp from "./pages/SignUp";
import TopProgressBar from "./components/TopProgressBar";
import { useAuth } from "./context/AuthContext";
import { clearWeek, getWeek, upsertEntry } from "./services/earnlyApi";
import { createEmptyEntries } from "./utils/calculations";
import { addWeeksToKey, getDateForDay, getWeekKey } from "./utils/dateHelpers";

function LoadingScreen({ message = "Loading Earnly..." }) {
  return (
    <main className="auth-page">
      <section className="auth-card status-card">
        <span className="brand-mark">E</span>
        <h1>{message}</h1>
        <p className="auth-card__intro">Preparing your secure workspace.</p>
      </section>
    </main>
  );
}

function RequireAuth({ isAuthenticated, authLoading, children }) {
  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireSetup({ isAuthenticated, authLoading, profileLoading, hasCompletedSetup, children }) {
  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileLoading) return <LoadingScreen />;
  if (!hasCompletedSetup) return <Navigate to="/setup" replace />;
  return children;
}

function RootRedirect({ authLoading, isAuthenticated }) {
  if (authLoading) return <LoadingScreen />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function App() {
  const navigate = useNavigate();
  const {
    session,
    jobs,
    selectedJobId,
    hasCompletedSetup,
    loading: authLoading,
    profileLoading,
    error: authError,
    signIn,
    signUp,
    signOut,
    completeSetup,
    addJob: addJobRequest,
    editJob,
    removeJob,
    selectJob,
    sendPasswordReset,
    updatePassword,
  } = useAuth();
  const [selectedWeekKey, setSelectedWeekKey] = useState(getWeekKey());
  const [selectedWeekEntries, setSelectedWeekEntries] = useState(createEmptyEntries());
  const [weekLoading, setWeekLoading] = useState(false);
  const [appError, setAppError] = useState("");

  const isAuthenticated = Boolean(session);
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadWeek() {
      if (!isAuthenticated || !selectedJob?.id || !hasCompletedSetup) {
        setSelectedWeekEntries(createEmptyEntries(selectedJob?.defaultHourlyRate));
        return;
      }

      try {
        setWeekLoading(true);
        setAppError("");
        const payload = await getWeek(selectedJob.id, selectedWeekKey);
        if (!cancelled) {
          setSelectedWeekEntries(payload.entries ?? createEmptyEntries(selectedJob.defaultHourlyRate));
        }
      } catch (error) {
        if (!cancelled) setAppError(error.message || "Unable to load this week.");
      } finally {
        if (!cancelled) setWeekLoading(false);
      }
    }

    loadWeek();

    return () => {
      cancelled = true;
    };
  }, [hasCompletedSetup, isAuthenticated, selectedJob?.id, selectedJob?.defaultHourlyRate, selectedWeekKey]);

  async function handleLogin(credentials) {
    const payload = await signIn(credentials);
    navigate(payload.profile?.setupCompleted ? "/dashboard" : "/setup");
  }

  async function handleSignUp(credentials) {
    const data = await signUp(credentials);
    if (data.session) {
      navigate("/setup");
      return;
    }
    navigate("/login", { state: { message: "Check your email to confirm your account, then log in." } });
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  async function handleSetup({ workplaceName, defaultHourlyRate }) {
    await completeSetup({ workplaceName, defaultHourlyRate: Number(defaultHourlyRate) });
    setSelectedWeekKey(getWeekKey());
    navigate("/dashboard");
  }

  async function addJob({ workplaceName, defaultHourlyRate }) {
    await addJobRequest({ workplaceName, defaultHourlyRate: Number(defaultHourlyRate) });
    navigate("/dashboard");
  }

  function moveSelectedWeek(weekOffset) {
    setSelectedWeekKey((currentWeekKey) => addWeeksToKey(currentWeekKey, weekOffset));
  }

  async function updateJob(jobId, patch) {
    await editJob(jobId, {
      workplaceName: patch.workplaceName,
      defaultHourlyRate: patch.defaultHourlyRate !== undefined ? Number(patch.defaultHourlyRate) : undefined,
    });
  }

  async function deleteJob(jobId) {
    await removeJob(jobId);
  }

  async function updateEntry(dayKey, patch) {
    if (!selectedJob) return;

    const previousEntries = selectedWeekEntries;
    const currentEntry = previousEntries[dayKey] ?? {};
    const nextEntry = { ...currentEntry, ...patch };

    setSelectedWeekEntries((currentEntries) => ({
      ...currentEntries,
      [dayKey]: nextEntry,
    }));

    try {
      const workDate = formatDateKey(getDateForDay(dayKey, selectedWeekKey));
      const payload = await upsertEntry(selectedJob.id, workDate, patch);
      setSelectedWeekEntries((currentEntries) => ({
        ...currentEntries,
        [dayKey]: payload.entry,
      }));
      setAppError("");
    } catch (error) {
      setSelectedWeekEntries(previousEntries);
      setAppError(error.message || "Unable to save entry.");
    }
  }

  async function clearCurrentWeek() {
    if (!selectedJob) return;

    try {
      const payload = await clearWeek(selectedJob.id, selectedWeekKey);
      setSelectedWeekEntries(payload.entries ?? createEmptyEntries(selectedJob.defaultHourlyRate));
      setAppError("");
    } catch (error) {
      setAppError(error.message || "Unable to clear this week.");
    }
  }

  return (
    <>
      <TopProgressBar />
      <Routes>
      <Route path="/" element={<RootRedirect authLoading={authLoading} isAuthenticated={isAuthenticated} />} />
      <Route
        path="/login"
        element={
          authLoading || (isAuthenticated && profileLoading) ? (
            <LoadingScreen />
          ) : isAuthenticated ? (
            <Navigate to={hasCompletedSetup ? "/dashboard" : "/setup"} replace />
          ) : (
            <Login onLogin={handleLogin} authError={authError} />
          )
        }
      />
      <Route path="/signup" element={<SignUp onSignUp={handleSignUp} />} />
      <Route path="/forgot-password" element={<ForgotPassword onSendReset={sendPasswordReset} />} />
      <Route path="/reset-password" element={<ResetPassword onResetPassword={updatePassword} />} />
      <Route
        path="/setup"
        element={
          <RequireAuth isAuthenticated={isAuthenticated} authLoading={authLoading}>
            <Setup onSetup={handleSetup} />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireSetup isAuthenticated={isAuthenticated} authLoading={authLoading} profileLoading={profileLoading} hasCompletedSetup={hasCompletedSetup}>
            <Dashboard
              jobs={jobs}
              selectedJob={selectedJob}
              selectedJobId={selectedJobId}
              selectedWeekKey={selectedWeekKey}
              selectedWeekEntries={selectedWeekEntries}
              isLoading={weekLoading}
              error={appError}
              onSelectJob={selectJob}
              onMoveWeek={moveSelectedWeek}
              onEntryChange={updateEntry}
              onClearWeek={clearCurrentWeek}
              onLogout={handleLogout}
            />
          </RequireSetup>
        }
      />
      <Route
        path="/entry/:dayKey"
        element={
          <RequireSetup isAuthenticated={isAuthenticated} authLoading={authLoading} profileLoading={profileLoading} hasCompletedSetup={hasCompletedSetup}>
            <Entry
              selectedJob={selectedJob}
              selectedWeekKey={selectedWeekKey}
              selectedWeekEntries={selectedWeekEntries}
              onEntryChange={updateEntry}
              error={appError}
            />
          </RequireSetup>
        }
      />
      <Route
        path="/jobs/add"
        element={
          <RequireSetup isAuthenticated={isAuthenticated} authLoading={authLoading} profileLoading={profileLoading} hasCompletedSetup={hasCompletedSetup}>
            <AddJob onAddJob={addJob} />
          </RequireSetup>
        }
      />
      <Route
        path="/jobs/manage"
        element={
          <RequireSetup isAuthenticated={isAuthenticated} authLoading={authLoading} profileLoading={profileLoading} hasCompletedSetup={hasCompletedSetup}>
            <ManageJobs
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={selectJob}
              onUpdateJob={updateJob}
              onDeleteJob={deleteJob}
            />
          </RequireSetup>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
