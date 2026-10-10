import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContributionCalendar } from './ContributionCalendar';
import { SessionType } from '@/hooks/useSessionPersistence';
import { Timer, Target, Youtube, Calendar, Lock, Brain, Coffee, Zap, Briefcase } from 'lucide-react';

interface ClockoutTaskInputProps {
  onStartSession: (task: string, duration: number, youtubeUrl?: string, sessionType?: SessionType, pomodoroOptions?: any) => void;
}

const SESSION_TYPES = [
  {
    id: 'pomodoro' as SessionType,
    icon: Brain,
    label: 'Pomodoro',
    desc: '25 min focus + 5 min breaks',
    color: 'red',
    selected: 'bg-red-500/20 border-red-400/60 ring-1 ring-red-400/30 shadow-lg shadow-red-500/10',
    icon_color: 'text-red-400',
    hover: 'hover:bg-white/10 hover:border-white/20',
  },
  {
    id: 'deep-work' as SessionType,
    icon: Zap,
    label: 'Deep Work',
    desc: '90 min uninterrupted focus',
    color: 'blue',
    selected: 'bg-blue-500/20 border-blue-400/60 ring-1 ring-blue-400/30 shadow-lg shadow-blue-500/10',
    icon_color: 'text-blue-400',
    hover: 'hover:bg-white/10 hover:border-white/20',
  },
  {
    id: 'work-day' as SessionType,
    icon: Briefcase,
    label: 'Work Day',
    desc: '8 hr day with hourly breaks',
    color: 'green',
    selected: 'bg-green-500/20 border-green-400/60 ring-1 ring-green-400/30 shadow-lg shadow-green-500/10',
    icon_color: 'text-green-400',
    hover: 'hover:bg-white/10 hover:border-white/20',
  },
  {
    id: 'custom' as SessionType,
    icon: Timer,
    label: 'Custom',
    desc: 'Set your own duration',
    color: 'purple',
    selected: 'bg-purple-500/20 border-purple-400/60 ring-1 ring-purple-400/30 shadow-lg shadow-purple-500/10',
    icon_color: 'text-purple-400',
    hover: 'hover:bg-white/10 hover:border-white/20',
  },
];

export function ClockoutTaskInput({ onStartSession }: ClockoutTaskInputProps) {
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
  const [pomodoroRounds, setPomodoroRounds] = useState(4);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSessionTypeChange = (newType: SessionType) => {
    setSessionType(newType);
    if (newType === 'work-day') {
      setFocusDuration(50);
      setShortBreakDuration(10);
      setLongBreakDuration(60);
      setPomodoroRounds(8);
    } else if (newType === 'pomodoro') {
      setFocusDuration(25);
      setShortBreakDuration(5);
      setLongBreakDuration(15);
      setPomodoroRounds(4);
    }
  };

  const validateYouTubeUrl = (url: string) => {
    if (!url) return true;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || duration <= 0) return;

    const pomodoroOptions =
      sessionType === 'pomodoro'
        ? { rounds: pomodoroRounds, focusDuration, shortBreakDuration, longBreakDuration }
        : sessionType === 'work-day'
        ? { rounds: 8, focusDuration: 50, shortBreakDuration: 10, longBreakDuration: 60 }
        : undefined;

    onStartSession(task.trim(), duration, youtubeUrl || undefined, sessionType, pomodoroOptions);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        console.log('Imported data:', data);
      } catch (error) {
        console.error('Failed to parse imported file:', error);
      }
    };
    reader.readAsText(file);
  };

  const isValid = task.trim().length > 0 && duration > 0;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background blobs */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animation: 'float-blob 20s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animation: 'float-blob 25s ease-in-out infinite reverse' }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
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
            <span>0 days locked in</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalendar(true)}
            className="text-white/60 hover:text-white hover:bg-white/10 w-9 h-9 p-0 rounded-lg"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-start justify-center min-h-[calc(100vh-65px)] p-6 pt-12">
        <div className="w-full max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Lock in. Build anything.
            </h1>
            <p className="text-white/40 text-base">
              Deep focus sessions for ambitious work.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Input */}
            <div className="space-y-2">
              <Label htmlFor="task" className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                What will you focus on?
              </Label>
              <Textarea
                id="task"
                placeholder="Describe your main task or goal for this session..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="min-h-[90px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 resize-none rounded-xl"
                required
              />
            </div>

            {/* Session Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Timer className="h-3.5 w-3.5" />
                Session type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = sessionType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleSessionTypeChange(type.id)}
                      className={`relative rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? type.selected
                          : `bg-white/[0.03] border-white/10 ${type.hover}`
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-3 ${isSelected ? type.icon_color : 'text-white/50'}`} />
                      <p className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {type.label}
                      </p>
                      <p className={`text-xs leading-snug ${isSelected ? 'text-white/60' : 'text-white/35'}`}>
                        {type.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pomodoro Settings */}
            {sessionType === 'pomodoro' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-red-400" />
                  Pomodoro settings
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Rounds', value: pomodoroRounds, min: 1, max: 8, onChange: setPomodoroRounds },
                    { label: 'Focus (min)', value: focusDuration, min: 15, max: 60, onChange: setFocusDuration },
                    { label: 'Short break', value: shortBreakDuration, min: 3, max: 15, onChange: setShortBreakDuration },
                    { label: 'Long break', value: longBreakDuration, min: 10, max: 30, onChange: setLongBreakDuration },
                  ].map(({ label, value, min, max, onChange }) => (
                    <div key={label}>
                      <Label className="text-xs text-white/50 mb-1 block">{label}</Label>
                      <Input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value))}
                        className="bg-white/5 border-white/10 text-white text-sm h-9"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/40">
                  Total:{' '}
                  <span className="text-white/70 font-medium">
                    {pomodoroRounds * focusDuration + (pomodoroRounds - 1) * shortBreakDuration + longBreakDuration} min
                  </span>{' '}
                  &mdash; {pomodoroRounds} rounds of {focusDuration} min focus + breaks
                </p>
              </div>
            )}

            {/* Duration info for preset types */}
            {sessionType === 'deep-work' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-white font-medium">90 minutes</p>
                  <p className="text-white/50 text-sm">Optimal for deep work sessions</p>
                </div>
              </div>
            )}

            {sessionType === 'work-day' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">8 hours total</p>
                  <p className="text-white/50 text-sm">8 rounds of 50 min work + 10 min breaks + 1 hr lunch</p>
                </div>
              </div>
            )}

            {/* Custom duration */}
            {sessionType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5" />
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="text-base bg-white/5 border-white/10 text-white focus:border-white/30"
                  required
                />
                <div className="flex gap-2 mt-1">
                  {[15, 25, 45, 60, 90].map((preset) => (
                    <Badge
                      key={preset}
                      variant={duration === preset ? 'default' : 'secondary'}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-white/15"
                      onClick={() => setDuration(preset)}
                    >
                      {preset}m
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="youtube" className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Youtube className="h-3.5 w-3.5" />
                Background video (optional)
              </Label>
              <Input
                id="youtube"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="text-base bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/30"
              />
              {youtubeUrl && !validateYouTubeUrl(youtubeUrl) && (
                <p className="text-red-400 text-sm">Please enter a valid YouTube URL</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={!isValid || !!(youtubeUrl && !validateYouTubeUrl(youtubeUrl))}
              className="w-full h-12 text-base bg-white text-black hover:bg-white/90 font-semibold rounded-xl transition-all duration-200 disabled:opacity-40"
            >
              <Lock className="mr-2 h-4 w-4" />
              Start Focus Session
            </Button>
          </form>
        </div>
      </main>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      <ContributionCalendar isOpen={showCalendar} onClose={() => setShowCalendar(false)} />
    </div>
  );
}
