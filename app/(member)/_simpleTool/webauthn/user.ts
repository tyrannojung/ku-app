import { AuthenticatorDevice } from "@simplewebauthn/typescript-types";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const sessionPrefix = "nextjs-webauthn-example-session-";


// The original types are "Buffer" which is not supported by KV
export type UserDevice = Omit<
  AuthenticatorDevice,
  "credentialPublicKey" | "credentialID"
> & {
  credentialID: string;
  credentialPublicKey: string;
};

type User = {
  email: string
  devices: UserDevice[]
  txCheck: boolean
};

export const findUser = async (email: string) => {
  const info = {
    info : `${email}`
} 
console.log(`user is ????======${process.env.MAIN_URL}`)
  const result = await fetch(`${process.env.MAIN_URL}api/authapi/check/` + JSON.stringify(info), {cache: 'no-store'});
  const user: User = await result.json();

  return user;
};

type SessionData = {
  currentChallenge?: string;
  email?: string;
};

export const getSession = async (id: string) => {
  const session = kv.get<SessionData>(`${sessionPrefix}${id}`);
  const get_session = await session;
  console.log("success set session ====> ")
  console.log(get_session)
  return get_session;
};

export const createSession = async (id: string, data: SessionData) => {
  const session = kv.set(`${sessionPrefix}${id}`, JSON.stringify(data));
  const get_session = await session;
  console.log("success set session ====> ")
  console.log(get_session)
  return get_session;
};

export const getCurrentSession = async (): Promise<{
  sessionId: string;
  data: SessionData;
}> => {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("session-id");

  if (sessionId?.value) {
    const session = await getSession(sessionId.value);

    if (session) {
      return { sessionId: sessionId.value, data: session };
    }
  }

  const newSessionId = Math.random().toString(36).slice(2);
  const newSession = { currentChallenge: undefined };
  cookieStore.set("session-id", newSessionId);

  await createSession(newSessionId, newSession);

  return { sessionId: newSessionId, data: newSession };
};

export const updateCurrentSession = async (
  data: SessionData
): Promise<void> => {
  const { sessionId, data: oldData } = await getCurrentSession();

  await createSession(sessionId, { ...oldData, ...data });
};
