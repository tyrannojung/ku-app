"use server";

import {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import {
  UserDevice,
  findUser,
  getCurrentSession,
  updateCurrentSession,
} from "./user";
import { origin, rpId } from "./constants";
import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { bundlerCall } from "../bundler/bundlerTool";
import { UserOperation } from "permissionless";
import base64url from 'base64url';

// 계정 생성 옵션
export const generateWebAuthnRegistrationOptions = async (email: string) => {
  const user = await findUser(email);
  console.log(user)

  if (user) {
    return {
      success: false,
      message: "User already exists",
    };
  }

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: "SimpleWebAuthn Example",
    rpID: rpId,
    userID: email,
    userName: email,
    timeout: 60000,
    attestationType: "direct",
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "discouraged",
    },
    /**
     * Support the two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  const options = await generateRegistrationOptions(opts);

  await updateCurrentSession({ currentChallenge: options.challenge, email });

  return {
    success: true,
    data: options,
  };
};



// 계정 생성 검증
export const verifyWebAuthnRegistration = async (
  data: RegistrationResponseJSON
) => {
  const {
    data: { email, currentChallenge },
  } = await getCurrentSession();

  if (!email || !currentChallenge) {
    return {
      success: false,
      message: "Session expired",
    };
  }

  const expectedChallenge = currentChallenge;

  const opts: VerifyRegistrationResponseOpts = {
    response: data,
    expectedChallenge: `${expectedChallenge}`,
    expectedOrigin: origin,
    expectedRPID: rpId,
    requireUserVerification: false,
  };

  const verification = await verifyRegistrationResponse(opts);

  const { verified, registrationInfo } = verification;

  if (!verified || !registrationInfo) {
    return {
      success: false,
      message: "Registration failed",
    };
  }

  const { credentialPublicKey, credentialID, counter } = registrationInfo;

  /**
   * Add the returned device to the user's list of devices
   */
  const newDevice: UserDevice = {
    credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
    credentialID: isoBase64URL.fromBuffer(credentialID),
    counter,
    transports: data.response.transports,
  };

  await updateCurrentSession({});
  console.log("create 타제??")

  return {
    success: true,
    value : newDevice
  };
};

export const generateWebAuthnLoginOptions = async (email: string) => {
  const user = await findUser(email);
  console.log(user)
  if (!user) {
    return {
      success: false,
      message: "User does not exist",
    };
  }
  const userOperation: UserOperation = await bundlerCall(user);
  const valueBeforeSigning = userOperation.signature;
  
  console.log(valueBeforeSigning)
  const challenge2 = Buffer.from(valueBeforeSigning.slice(2), 'hex');
  console.log(challenge2)
  const challeng3 = base64url.encode(challenge2);
  console.log(challeng3)


  
  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials: user.devices.map((dev) => ({
      id: isoBase64URL.toBuffer(dev.credentialID),
      type: "public-key",
      transports: dev.transports,
    })),
    userVerification: "required",
    rpID: rpId,
  };

  let options: any = await generateAuthenticationOptions(opts);

  await updateCurrentSession({ currentChallenge: options.challenge, email });
  if(options.allowCredentials){
    const opts2 = {
      challenge: challeng3,
      allowCredentials: [
        {
          id: options.allowCredentials[0].id,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
    };

    options = opts2
  }
  
  console.log(options)
  
  
  return {
    success: true,
    data: options,
    user: user,
    userOperation : userOperation
  };
};

export const verifyWebAuthnLogin = async (data: AuthenticationResponseJSON) => {
  const {
    data: { email, currentChallenge },
  } = await getCurrentSession();

  if (!email || !currentChallenge) {
    return {
      success: false,
      message: "Session expired",
    };
  }

  const user = await findUser(email);

  if (!user) {
    return {
      success: false,
      message: "User does not exist",
    };
  }

  const dbAuthenticator = user.devices.find(
    (dev) => dev.credentialID === data.rawId
  );

  if (!dbAuthenticator) {
    return {
      success: false,
      message: "Authenticator is not registered with this site",
    };
  }

  const opts: VerifyAuthenticationResponseOpts = {
    response: data,
    expectedChallenge: `${currentChallenge}`,
    expectedOrigin: origin,
    expectedRPID: rpId,
    authenticator: {
      ...dbAuthenticator,
      credentialID: isoBase64URL.toBuffer(dbAuthenticator.credentialID),
      credentialPublicKey: isoBase64URL.toBuffer(
        dbAuthenticator.credentialPublicKey
      ),
    },
    requireUserVerification: true,
  };
  const verification = await verifyAuthenticationResponse(opts);

  await updateCurrentSession({});

  return {
    success: verification.verified,
  };
};