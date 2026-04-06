type ReminderProjectionInput = {
  title: string;
  startAt: string;
  endAt: string;
};

export function projectReminderToCalendarEvent(input: ReminderProjectionInput) {
  return {
    title: input.title,
    startsAt: input.startAt,
    endsAt: input.endAt,
  };
}
