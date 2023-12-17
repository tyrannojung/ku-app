import { ObjectId } from "mongodb"
import { AuthenticatorDevice } from "@simplewebauthn/typescript-types";

export interface member {
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
    tx? : boolean
    txhash? : string
}

type UserDevice = Omit<
  AuthenticatorDevice,
  "credentialPublicKey" | "credentialID"
> & {
  credentialID: string;
  credentialPublicKey: string;
};