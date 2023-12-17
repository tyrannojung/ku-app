import { DefaultSession } from "next-auth";
import NextAuth from "next-auth/next";

declare module "next-auth" {
  interface Session {
    user: {
      _id? : ObjectId | string
      auth_id? : string
      id? : string
      publicKey? : string
      pubk? : string
      pubkCoordinates? : string[]
      email? : string
      name? : string
      updatedAt? : Date | null
      createAt? : Date
      devices? : UserDevice[]
      txCheck? : boolean
      txhash? : string
    } & DefaultSession["user"];
  }
}