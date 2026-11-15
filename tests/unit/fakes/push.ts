// Records every push send instead of contacting the browsers' push services.
export interface SentPush {
  to: string[];
  message: { title: string; body: string; url: string; tag: string };
}

export const sent: SentPush[] = [];

export async function sendPush(_admin: unknown, targets: Array<{ user_id: string }>, message: SentPush["message"]) {
  sent.push({ to: targets.map((t) => t.user_id), message });
  return { sent: targets.length, gone: 0, failed: 0 };
}

export async function vapidPublicKey() {
  return "test-vapid-key";
}
