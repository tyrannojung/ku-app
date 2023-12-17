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
  if (!user) {
    return {
      success: false,
      message: "User does not exist",
    };
  }
  // 유저의 요청을 생성합니다.
  const userOperation: UserOperation = await bundlerCall(user);
  // --> 여기에서 지갑 생성, user요청, paymaster가 담긴 operation을 압축해서 signature에 담아줍니다.

  // 해당 signature를 유저의 기기로 보낼 챌린지로 만듭니다.
  const valueBeforeSigning = userOperation.signature;
  
  //const challengeBuffer = Buffer.from(valueBeforeSigning.slice(2), 'hex');
  const challengEncode = base64url.encode(valueBeforeSigning);

  //유저의 기본 option을 만들어줍니다. 추후 해당 옵션을 이용해 operation-signatue를 담은 옵션을 만들어 줍니다.
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

  if(options.allowCredentials){
    // operation-signatue를 담은 옵션을 생성해 줍니다.
    const opts2 = {
      challenge: challengEncode,
      allowCredentials: [
        {
          id: options.allowCredentials[0].id,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
    };

    options = opts2
    await updateCurrentSession({ currentChallenge: options.challenge, email });

  }
  
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