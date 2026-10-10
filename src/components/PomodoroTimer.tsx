import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FocusSession as SessionType, PomodoroPhase } from '@/hooks/useSessionPersistence';
import { 
  Play,
  Pause,
  RotateCcw,
  X,
  Coffee,
  Brain,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PomodoroTimerProps {
  session: SessionType;
  onUpdateSession: (updates: Partial<SessionType>) => void;
  onEndSession: () => void;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export function PomodoroTimer({ 
  session, 
  onUpdateSession, 
  onEndSession, 
  timeRemaining, 
  setTimeRemaining,
  isPaused,
  setIsPaused
}: PomodoroTimerProps) {
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const getNextPhase = (): { phase: PomodoroPhase; duration: number } => {
    const currentRound = session.pomodoroRound || 1;
    const totalRounds = session.totalPomodoroRounds || 4;
    const currentPhase = session.pomodoroPhase || 'focus';
    const isWorkDay = session.sessionType === 'work-day';

    if (currentPhase === 'focus') {
      // After focus, determine break type
      if (isWorkDay && currentRound === 4) {
        // Work day: lunch break after 4th round
        return { phase: 'lunch-break', duration: (session.longBreakDuration || 60) * 60 };
      } else if (currentRound >= totalRounds) {
        return { phase: 'long-break', duration: (session.longBreakDuration || 15) * 60 };
      } else {
        return { phase: 'short-break', duration: (session.shortBreakDuration || 5) * 60 };
      }
    } else {
      // After any break, go to focus
      const nextRound = (currentPhase === 'long-break' && !isWorkDay) ? 1 : currentRound + 1;
      return { phase: 'focus', duration: (session.focusDuration || 25) * 60 };
    }
  };

  const handlePhaseComplete = useCallback(() => {
    const currentPhase = session.pomodoroPhase || 'focus';
    const currentRound = session.pomodoroRound || 1;
    const totalRounds = session.totalPomodoroRounds || 4;

    playNotificationSound();

    if (currentPhase === 'focus') {
      // Focus session completed
      toast({
        title: "🎉 Focus Session Complete!",
        description: `Great work! Time for a ${currentRound >= totalRounds ? 'long' : 'short'} break.`,
        duration: 5000,
      });

      // Update calendar data for focus sessions only
      const today = new Date().toISOString().split('T')[0];
      const calendarData = JSON.parse(localStorage.getItem('focus-calendar') || '{}');
      const durationHours = (session.focusDuration || 25) / 60;
      calendarData[today] = (calendarData[today] || 0) + durationHours;
      localStorage.setItem('focus-calendar', JSON.stringify(calendarData));
    } else {
      // Break completed
      toast({
        title: "☕ Break Complete!",
        description: "Ready to focus again? Let's get back to work!",
        duration: 3000,
      });
    }

    const { phase: nextPhase, duration: nextDuration } = getNextPhase();
    const isWorkDay = session.sessionType === 'work-day';
    const nextRound = (currentPhase === 'long-break' && !isWorkDay) ? 1 : 
                     (currentPhase === 'short-break' || currentPhase === 'lunch-break') ? currentRound + 1 : currentRound;

    // Check if we've completed all rounds
    if ((currentPhase === 'long-break' && !isWorkDay) || (isWorkDay && currentRound >= totalRounds && currentPhase === 'short-break')) {
      const sessionName = isWorkDay ? 'Work Day' : 'Pomodoro';
      toast({
        title: `🏆 ${sessionName} Session Complete!`,
        description: `Amazing! You've completed ${totalRounds} focus rounds.`,
        duration: 5000,
      });
      onEndSession();
      return;
    }

    // Transition to next phase
    setTimeRemaining(nextDuration);
    onUpdateSession({
      pomodoroPhase: nextPhase,
      pomodoroRound: nextRound,
      timeRemaining: nextDuration,
      duration: Math.floor(nextDuration / 60),
    });

  }, [session, onUpdateSession, onEndSession, setTimeRemaining, toast]);

  // Handle timer reaching zero
  useEffect(() => {
    if (timeRemaining === 0) {
      handlePhaseComplete();
    }
  }, [timeRemaining, handlePhaseComplete]);

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    onUpdateSession({ isPaused: newPaused });
  };

  const resetCurrentPhase = () => {
    if (window.confirm('Reset current phase to full duration?')) {
      const currentPhase = session.pomodoroPhase || 'focus';
      let resetDuration: number;
      
      switch (currentPhase) {
        case 'focus':
          resetDuration = (session.focusDuration || 25) * 60;
          break;
        case 'short-break':
          resetDuration = (session.shortBreakDuration || 5) * 60;
          break;
        case 'long-break':
          resetDuration = (session.longBreakDuration || 15) * 60;
          break;
        case 'lunch-break':
          resetDuration = (session.longBreakDuration || 60) * 60;
          break;
      }
      
      setTimeRemaining(resetDuration);
      onUpdateSession({ timeRemaining: resetDuration });
    }
  };

  const skipPhase = () => {
    if (window.confirm('Skip to next phase?')) {
      handlePhaseComplete();
    }
  };

  const getPhaseInfo = () => {
    const phase = session.pomodoroPhase || 'focus';
    const round = session.pomodoroRound || 1;
    const totalRounds = session.totalPomodoroRounds || 4;

    switch (phase) {
      case 'focus':
        return {
          icon: <Brain className="h-5 w-5" />,
          title: 'Focus Time',
          subtitle: `Round ${round} of ${totalRounds}`,
          color: 'bg-red-500/20 border-red-500/30 text-red-400'
        };
      case 'short-break':
        return {
          icon: <Coffee className="h-5 w-5" />,
          title: 'Short Break',
          subtitle: `After Round ${round - 1}`,
          color: 'bg-green-500/20 border-green-500/30 text-green-400'
        };
      case 'long-break':
        return {
          icon: <Timer className="h-5 w-5" />,
          title: 'Long Break',
          subtitle: 'Well deserved rest!',
          color: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
        };
      case 'lunch-break':
        return {
          icon: <Coffee className="h-5 w-5" />,
          title: 'Lunch Break',
          subtitle: 'Time to refuel!',
          color: 'bg-orange-500/20 border-orange-500/30 text-orange-400'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="flex flex-col items-center mb-10">
      {/* Phase badge */}
      <Badge className={`mb-8 px-4 py-2 backdrop-blur-sm ${phaseInfo.color}`}>
        <div className="flex items-center gap-2">
          {phaseInfo.icon}
          <div>
            <div className="font-semibold text-sm">{phaseInfo.title}</div>
            <div className="text-xs opacity-70">{phaseInfo.subtitle}</div>
          </div>
        </div>
      </Badge>

      {/* Large timer */}
      <div className="timer-display mb-6">
        {formatTime(timeRemaining)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={onEndSession}
          size="sm"
          variant="ghost"
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-full w-10 h-10 p-0"
          title="End Session"
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
          onClick={resetCurrentPhase}
          size="sm"
          variant="ghost"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 rounded-full w-10 h-10 p-0"
          title="Reset Phase"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Round progress dots */}
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: session.totalPomodoroRounds || 4 }, (_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < (session.pomodoroRound || 1) - 1
                ? 'w-2.5 h-2.5 bg-green-500'
                : i === (session.pomodoroRound || 1) - 1
                ? 'w-3 h-3 bg-white'
                : 'w-2 h-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Skip */}
      <Button
        onClick={skipPhase}
        variant="ghost"
        size="sm"
        className="text-white/30 hover:text-white/60 text-xs"
      >
        Skip phase
      </Button>
    </div>
  );
}