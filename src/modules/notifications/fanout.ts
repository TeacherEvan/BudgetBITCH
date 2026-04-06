type NotificationPreferences = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export function buildNotificationFanout(preferences: NotificationPreferences) {
  const channels: Array<"in_app" | "email" | "push"> = [];

  if (preferences.inApp) channels.push("in_app");
  if (preferences.email) channels.push("email");
  if (preferences.push) channels.push("push");

  return channels;
}
