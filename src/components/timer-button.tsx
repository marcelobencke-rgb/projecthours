'use client';

import { useState, useTransition } from 'react';
import { startTimer, stopTimer } from '@/app/actions/time-entries';
import { formatDuration, getElapsedSeconds } from '@/lib/utils';
import { useEffect } from 'react';

interface TimerButtonProps {
  taskId: string;
  activeEntryId?: string | null;
  activeStartTime?: string | null;
  totalSeconds: number;
  onTimerChange?: () => void;
}

export default function TimerButton({
  taskId,
  activeEntryId,
  activeStartTime,
  totalSeconds,
  onTimerChange,
}: TimerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState(!!activeEntryId);
  const [currentEntryId, setCurrentEntryId] = useState(activeEntryId || null);
  const [currentStartTime, setCurrentStartTime] = useState(activeStartTime || null);
  const [elapsed, setElapsed] = useState(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(totalSeconds);

  useEffect(() => {
    setIsRunning(!!activeEntryId);
    setCurrentEntryId(activeEntryId || null);
    setCurrentStartTime(activeStartTime || null);
    setAccumulatedSeconds(totalSeconds);
  }, [activeEntryId, activeStartTime, totalSeconds]);

  useEffect(() => {
    if (!isRunning || !currentStartTime) {
      setElapsed(0);
      return;
    }

    setElapsed(getElapsedSeconds(currentStartTime));

    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(currentStartTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentStartTime]);

  const displayTime = isRunning
    ? accumulatedSeconds + elapsed
    : accumulatedSeconds;

  function handleStart() {
    startTransition(async () => {
      const result = await startTimer(taskId);
      if (result?.success && result.entry) {
        setIsRunning(true);
        setCurrentEntryId(result.entry.id);
        setCurrentStartTime(result.entry.start_time);
        setElapsed(0);
        onTimerChange?.();
      }
    });
  }

  function handleStop() {
    if (!currentEntryId) return;
    startTransition(async () => {
      const result = await stopTimer(currentEntryId!);
      if (result?.success) {
        setAccumulatedSeconds((prev) => prev + (result.duration || 0));
        setIsRunning(false);
        setCurrentEntryId(null);
        setCurrentStartTime(null);
        setElapsed(0);
        onTimerChange?.();
      }
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <span className={`task-row-time ${isRunning ? 'active' : ''}`}>
        {formatDuration(displayTime)}
      </span>
      {isRunning ? (
        <button
          onClick={handleStop}
          className="timer-btn timer-btn-stop"
          disabled={isPending}
          title="Parar timer"
          id={`timer-stop-${taskId}`}
        >
          {isPending ? (
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          )}
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="timer-btn timer-btn-start"
          disabled={isPending}
          title="Iniciar timer"
          id={`timer-start-${taskId}`}
        >
          {isPending ? (
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
