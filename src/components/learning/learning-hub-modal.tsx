// src/components/learning/learning-hub-modal.tsx
'use client';

import { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  BEHAVIORAL_LESSONS,
  type BehavioralLesson,
} from '@/modules/psychology/behavioral-curriculum';
import { usePsychologyStorage } from '@/hooks/use-psychology-storage';

interface LearningHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'standard' | 'variance' | 'cashflow' | 'pivot' | 'perspective') => void;
  onNavigatePanel?: (panel: string) => void;
}

export function LearningHubModal({
  isOpen,
  onClose,
  onNavigateTab,
  onNavigatePanel,
}: LearningHubModalProps) {
  const { lessons, toggleLesson } = usePsychologyStorage();
  const [selectedLessonId, setSelectedLessonId] = useState<string>(BEHAVIORAL_LESSONS[0].id);

  const activeLesson =
    BEHAVIORAL_LESSONS.find((l) => l.id === selectedLessonId) ?? BEHAVIORAL_LESSONS[0];

  const completedCount = lessons.completedLessonIds.length;
  const totalCount = BEHAVIORAL_LESSONS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleAction = (lesson: BehavioralLesson) => {
    if (lesson.actionTrigger.targetTab && onNavigateTab) {
      onNavigateTab(lesson.actionTrigger.targetTab);
    }
    if (lesson.actionTrigger.targetPanel && onNavigatePanel) {
      onNavigatePanel(lesson.actionTrigger.targetPanel);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Psychology & Masterclasses"
      description="Behavioral insights to understand your money psychology and master the bigger picture."
      size="xl"
    >
      <div className="space-y-6 text-left" data-testid="learning-hub-modal">
        {/* Header Progress Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/20 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Boss Academy
                </span>
                <span className="text-[10px] text-white/50">• {completedCount}/{totalCount} Completed</span>
              </div>
              <p className="text-xs text-white/80">
                Action-oriented micro-lessons grounded in behavioral economics.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full sm:w-36">
            <div className="flex justify-between text-[10px] text-white/60 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Course Sidebar & Reader */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Lesson List */}
          <div className="md:col-span-5 space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {BEHAVIORAL_LESSONS.map((lesson) => {
              const isCompleted = lessons.completedLessonIds.includes(lesson.id);
              const isSelected = lesson.id === activeLesson.id;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full rounded-2xl p-3.5 text-left transition-all border ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/5'
                      : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {lesson.badgeLabel}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {lesson.readingMinutes} min
                    </span>
                  </div>

                  <h4 className="mt-1 text-xs font-bold text-white leading-snug">
                    {lesson.title}
                  </h4>

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-white/50 text-[10px] truncate max-w-[150px]">
                      {lesson.psychologicalPrinciple}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40">Read lesson →</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lesson Reader Card */}
          <div className="md:col-span-7 flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/90 p-5">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {activeLesson.psychologicalPrinciple}
                </span>
                <h3 className="mt-1 text-base font-black text-white">
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-white/60 italic mt-0.5">
                  &ldquo;{activeLesson.tagline}&rdquo;
                </p>
              </div>

              {/* Core Paragraphs */}
              <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
                {activeLesson.conceptSummary.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Cognitive Trap & Behavioral Solution */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    The Cognitive Trap:
                  </span>
                  <p className="mt-0.5 text-white/80 leading-relaxed">
                    {activeLesson.cognitiveTrap}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Behavioral Antidote:
                  </span>
                  <p className="mt-0.5 text-white/80 leading-relaxed">
                    {activeLesson.behavioralSolution}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleLesson(activeLesson.id)}
                className="text-xs"
              >
                {lessons.completedLessonIds.includes(activeLesson.id) ? (
                  <>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                    Mark Unread
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                    Mark Complete
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction(activeLesson)}
                className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20"
              >
                <span>{activeLesson.actionTrigger.label}</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
