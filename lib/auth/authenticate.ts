import { mockUsers, type MockUser } from "./mock-users";

export async function authenticate(
  identifier: string,
  password: string,
): Promise<{ user: MockUser } | { error: string }> {
  // TODO: replace this function body with a POST to /api/auth/login once the backend is live
  await new Promise((resolve) => setTimeout(resolve, 600));

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = mockUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedIdentifier &&
      candidate.password === password,
  );

  if (!user) {
    return { error: "Invalid email or password. Please try again." };
  }

  return { user };
}
