import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FocusSession as SessionType } from '@/hooks/useSessionPersistence';
import { ContributionCalendar } from './ContributionCalendar';
import { TaskSidebar } from './TaskSidebar';
import { PomodoroTimer } from './PomodoroTimer';
import {
  Lock,
  Trophy,
  Calendar,
  Menu,
  Play,
  Pause,
  RotateCcw,
  X,
  Target,
  Code2,
  BookOpen,
  Palette,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClockoutFocusSessionProps {
  session: SessionType;
  onUpdateSession: (updates: Partial<SessionType>) => void;
  onEndSession: () => void;
}

const CATEGORIES = [
  { id: 'Code', icon: Code2, active: 'bg-blue-500/50 border-blue-400 text-white shadow-lg shadow-blue-500/20', idle: 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' },
  { id: 'Study', icon: BookOpen, active: 'bg-green-500/50 border-green-400 text-white shadow-lg shadow-green-500/20', idle: 'bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20' },
  { id: 'Design', icon: Palette, active: 'bg-purple-500/50 border-purple-400 text-white shadow-lg shadow-purple-500/20', idle: 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20' },
];

export function ClockoutFocusSession({ session, onUpdateSession, onEndSession }: ClockoutFocusSessionProps) {
  const [timeRemaining, setTimeRemaining] = useState(session.timeRemaining);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTaskSidebar, setShowTaskSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(session.isPaused);
  const [daysLockedIn, setDaysLockedIn] = useState(0);
  const { toast } = useToast();

  const calculateDaysLockedIn = () => {
    const calendarData = JSON.parse(localStorage.getItem('focus-calendar') || '{}');
    const today = new Date();
    let consecutiveDays = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (calendarData[dateStr] && calendarData[dateStr] > 0) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    return consecutiveDays;
  };

  useEffect(() => {
    setDaysLockedIn(calculateDaysLockedIn());
  }, []);

  useEffect(() => {
    if (isCompleted) setDaysLockedIn(calculateDaysLockedIn());
  }, [isCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerComplete = useCallback(() => {
    if (session.sessionType === 'pomodoro') return;

    setIsCompleted(true);
    onUpdateSession({ isActive: false, timeRemaining: 0 });

    const today = new Date().toISOString().split('T')[0];
    const calendarData = JSON.parse(localStorage.getItem('focus-calendar') || '{}');
    calendarData[today] = (calendarData[today] || 0) + session.duration / 60;
    localStorage.setItem('focus-calendar', JSON.stringify(calendarData));

    toast({
      title: "Session Complete!",
      description: `You've completed your ${session.duration}-minute focus session.`,
      duration: 5000,
    });
  }, [onUpdateSession, session.duration, session.sessionType, toast]);

  useEffect(() => {
    if (!session.isActive || isPaused || isCompleted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        onUpdateSession({ timeRemaining: newTime });
        if (newTime <= 0) {
          if (session.sessionType !== 'pomodoro') handleTimerComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isActive, isPaused, isCompleted, onUpdateSession, handleTimerComplete, session.sessionType]);

  const handleEndSession = () => {
    if (window.confirm('End this focus session early?')) {
      onEndSession();
    }
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    onUpdateSession({ isPaused: newPaused });
  };

  const resetTimer = () => {
    if (window.confirm('Reset timer to original duration?')) {
      const resetTime = session.duration * 60;
      setTimeRemaining(resetTime);
      onUpdateSession({ timeRemaining: resetTime });
    }
  };

  const handleTaskCategorySelect = (category: string) => {
    setSelectedCategory(category);
    localStorage.setItem(`session-${session.id}-category`, category);
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = session.youtubeUrl ? getVideoId(session.youtubeUrl) : null;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}`
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background video */}
      {embedUrl && (
        <iframe
          src={embedUrl}
          className="video-background"
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 z-10" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 text-white">
          <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">clockout</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm text-white/70">
            <Lock className="h-3.5 w-3.5 text-white/50" />
            <span>{daysLockedIn} days locked in</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalendar(true)}
            className="text-white/60 hover:text-white hover:bg-white/10 w-9 h-9 p-0 rounded-lg"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTaskSidebar(true)}
            className="text-white/60 hover:text-white hover:bg-white/10 w-9 h-9 p-0 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4">
        {!isCompleted && (
          <>
            {/* Task label */}
            <div className="text-center mb-10 max-w-lg">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Focusing on</p>
              <p className="text-white/85 text-xl font-medium leading-snug line-clamp-2">
                {session.task}
              </p>
            </div>

            {/* Pomodoro or regular timer */}
            {session.sessionType === 'pomodoro' ? (
              <PomodoroTimer
                session={session}
                onUpdateSession={onUpdateSession}
                onEndSession={onEndSession}
                timeRemaining={timeRemaining}
                setTimeRemaining={setTimeRemaining}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
              />
            ) : (
              <div className="flex flex-col items-center gap-6 mb-10">
                {/* Large timer */}
                <div className="timer-display">
                  {formatTime(timeRemaining)}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleEndSession}
                    size="sm"
                    variant="ghost"
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-full w-10 h-10 p-0"
                    title="End session"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={togglePause}
                    size="sm"
                    variant="ghost"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full w-10 h-10 p-0"
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={resetTimer}
                    size="sm"
                    variant="ghost"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 rounded-full w-10 h-10 p-0"
                    title="Reset"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Category tags */}
            <div className="flex gap-3 mt-2">
              {CATEGORIES.map(({ id, icon: Icon, active, idle }) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTaskCategorySelect(id)}
                  className={`backdrop-blur-sm transition-all duration-200 border ${
                    selectedCategory === id ? active : idle
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {id}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Completion overlay */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center bg-black/70 backdrop-blur-md border border-white/15 p-10 rounded-2xl max-w-sm mx-4">
            <Trophy className="h-14 w-14 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
            <p className="text-white/60 text-base mb-8">
              You completed a {session.duration}-minute deep work session. Great work.
            </p>
            <Button
              onClick={onEndSession}
              size="lg"
              className="w-full bg-white text-black hover:bg-white/90 font-semibold rounded-xl"
            >
              Start New Session
            </Button>
          </div>
        </div>
      )}

      <TaskSidebar isOpen={showTaskSidebar} onClose={() => setShowTaskSidebar(false)} />
      <ContributionCalendar isOpen={showCalendar} onClose={() => setShowCalendar(false)} />
    </div>
  );
}
