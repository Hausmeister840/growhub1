export async function logEvent(base44, user, type, data = {}) {
  if (!user || !user.email) return;
  
  try {
    await base44.entities.AppEvent.create({
      user_email: user.email,
      type,
      data,
      timestamp: new Date().toISOString(),
      session_id: `${user.id}-${Date.now()}`
    });
  } catch (error) {
    console.warn('Failed to log telemetry event:', error);
    // Don't throw - telemetry should not break the main function
  }
}