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
    txCheck? : boolean
    txhash? : string
}

type UserDevice = Omit<
  AuthenticatorDevice,
  "credentialPublicKey" | "credentialID"
> & {
  credentialID: string;
  credentialPublicKey: string;
};


export interface UserOperationType {
  sender?: string;
  nonce?: string;
  initCode?: string;
  callData?: string;
  callGasLimit?: string;
  verificationGasLimit?: string;
  preVerificationGas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  paymasterAndData?: string;
  signature?: string;
}