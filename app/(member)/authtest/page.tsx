'use client'
import styles from './css/page.module.css'
import React, { useState } from 'react';
import { member } from "@/app/_types/member"
import { v4 as uuid } from 'uuid';
import {
  startRegistration,
  startAuthentication
} from "@simplewebauthn/browser";
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnLoginOptions,
  verifyWebAuthnLogin
} from "../_simpleTool/webauthn/webauthn";
import base64url from 'base64url';
import { decodeRegistrationCredential } from '../_simpleTool/webauthn/_debugger/decodeRegistrationCredential';

/** sign in import */
import { authResponseToSigVerificationInput } from '../_simpleTool/webauthn/_debugger/authResponseToSigVerificationInput';
import { ethers } from 'ethers';

export default function Test() {
    const [signUpMessage, setSignUpMessage] = useState<string[]>([]);
    const [signInMessage, setSignInMessage] = useState<string[]>([]);
    const [idValue, setIdValue] = useState('enk0206');
    const [emailValue, setEmailValue] = useState('enk0206@naver.com');
    const [nameValue, setNameValue] = useState('양은경');

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIdValue(e.target.value);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailValue(e.target.value);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNameValue(e.target.value);
    };

    /** ======================================================== */
    /** SignUp Test */
    const handleSignUpClick = async () => {
        const messages = [
            "Signed Up Start",
        ];
        
        try{
            let enteredEmail = emailValue;
            let enteredId = idValue;
            let enteredName = nameValue;

            // 유저의 email을 기준으로 계정생성(하드웨어에 키저장) 옵션을 만들어 줍니다.
            const response = await generateWebAuthnRegistrationOptions(enteredEmail);
            if (!response.success || !response.data) {
                messages.push("옵션 생성 애러")
                return;
            }

            console.log("======response=======")
            console.log(response)
            console.log(response.data.challenge)

            let test = response.data.challenge;
            // base64url 인코딩된 문자열을 표준 base64로 변환
            let standardBase64 = test.replace(/-/g, '+').replace(/_/g, '/');
            // 표준 base64 인코딩된 데이터를 바이너리 데이터로 디코딩
            let testBuffer = Buffer.from(standardBase64, 'base64');
            // 바이너리 데이터를 헥사데시멀 형태로 변환
            let testchallengeHex = testBuffer.toString('hex');
            console.log('Hexadecimal challenge', testchallengeHex);
            // 헥사데시멀 형태의 문자열 앞에 '0x' 추가
            let testchallenge = `0x${testchallengeHex}`;
            console.log(`testchallenge`, testchallenge);
            // 헥사데시멀 형태의 문자열을 다시 바이너리 데이터로 변환
            // let testBuffer2 = Buffer.from(testchallenge.slice(2), 'hex');
            // // 바이너리 데이터를 다시 base64url 인코딩
            // let testencodedChallenge = base64url.encode(testBuffer2);
            // console.log('base64url challenge', testencodedChallenge);

            // 계정생성 옵션을 통해 계정(하드웨어에 키저장)을 생성합니다.
            const passkey = await startRegistration(response.data);

            console.log("======startRegistration=======")
            console.log(passkey)


            /**New =====  */
            const userChallenge = testchallenge
            const challenge = Buffer.from(userChallenge.slice(2), 'hex');
            const encodedChallenge = base64url.encode(challenge);
            console.log('base6url challenge', base64url.encode(challenge));
            

            // const passkey = await startRegistration({
            //     rp: {
            //       name: 'WebAuthn.io (Dev)',
            //       id: 'localhost',
            //     },
            //     user: {
            //       id: enteredEmail,
            //       name: enteredName,
            //       displayName: enteredId,
            //     },
            //     challenge: base64url.encode(challenge),
            //     pubKeyCredParams: [
            //       {
            //         type: 'public-key',
            //         alg: -7,
            //       },
            //     ],
            //     timeout: 60000,
            //     authenticatorSelection: {
            //       // authenticatorAttachment: 'platform', // can prevent simulator from running the webauthn request
            //     },
            //     attestation: 'direct',
            //   });

            console.log("======startRegistration=======")
            console.log(passkey)

            // 유저의 고유 id
            const credId = `0x${base64url.toBuffer(passkey.id).toString('hex')}`;
            //유저의 pubk x, y 쌍을 구한다.
            const decodedPassKey = decodeRegistrationCredential(passkey);
            
            console.log("======decodedPassKey=======")
            console.log(decodedPassKey)
            
            // const supportsDirectAttestation = !!decodedPassKey.response.attestationObject.attStmt.sig;
            // console.log({ supportsDirectAttestation });

            const ecVerifyInputs = authResponseToSigVerificationInput(
                decodedPassKey.response.attestationObject.authData.parsedCredentialPublicKey,
                {
                  authenticatorData: decodedPassKey.response.authenticatorData!,
                  clientDataJSON: passkey.response.clientDataJSON,
                  signature: decodedPassKey.response.attestationObject.attStmt.sig!,
                },
              );
            console.log("======ecVerifyInputs=======")
            console.log(ecVerifyInputs);
            
            const supportsDirectAttestation = !!decodedPassKey.response.attestationObject.attStmt.sig;
            console.log({ supportsDirectAttestation });


            // 유저의 pubk x, y쌍
            const pubKeyCoordinates = [
                '0x' +
                base64url
                    .toBuffer(decodedPassKey.response.attestationObject.authData.parsedCredentialPublicKey?.x || '')
                    .toString('hex'),
                '0x' +
                base64url
                    .toBuffer(decodedPassKey.response.attestationObject.authData.parsedCredentialPublicKey?.y || '')
                    .toString('hex'),
            ];

            const challengeOffsetRegex = new RegExp(`(.*)${Buffer.from(encodedChallenge).toString('hex')}`);
            const challengePrefix = challengeOffsetRegex.exec(
              base64url.toBuffer(passkey.response.clientDataJSON).toString('hex'),
            )?.[1];
            console.log({ challengeOffsetRegex, challengePrefix });


            let new_push0 = decodedPassKey.response.attestationObject.authData.flagsMask;
            console.log({new_push0})
            let new_push1 = `0x${base64url.toBuffer(passkey.response.authenticatorData!).toString('hex')}`
            console.log({new_push1})
            let new_push2 = `0x${base64url.toBuffer(passkey.response.clientDataJSON).toString('hex')}`
            console.log({new_push2})
            let new_push3 = userChallenge
            console.log({new_push3})
            let new_push4 = Buffer.from(challengePrefix || '', 'hex').length
            console.log({new_push4})

            messages.push(`New Push authenticatorDataFlagMask ===${new_push0}`)
            messages.push(`New Push authenticatorData ===${new_push1}`)
            messages.push(`New Push clientData ===${new_push2}`)
            messages.push(`New Push clientChallenge ===${new_push3}`)
            messages.push(`New Push clientChallengeOffset ===${new_push4}`)
            messages.push(`New Push rs ===${ecVerifyInputs.signature[0]}, ${ecVerifyInputs.signature[1]}`)
            messages.push(`New Push Q ===${ecVerifyInputs.publicKeyCoordinates[0]}, ${ecVerifyInputs.publicKeyCoordinates[1]}`)
            

            // 해당 검증이 정상적인지 검사합니다. 
            const verifyResponse = await verifyWebAuthnRegistration(passkey);
 

            setSignUpMessage(messages);
        }
        catch(error){
            console.log(error)
            messages.push("Something went wrong!")
            setSignUpMessage(messages);
        }
        
    };

    const handleSignInClick = async () => {
        const messages = [
            "Signed In Start",
        ];
        
        try{
            let enteredEmail = emailValue;
            
            // 로그인(기존 하드웨어 키 생성) 옵션을 만들어 줍니다.
            // 해당 response에서 bundler에게 보낼 operation을 challenge로 만들어 유저에게 서명을 요청합니다.
            const response = await generateWebAuthnLoginOptions(enteredEmail);             
            
            if (!response.success || !response.user) {
                messages.push("옵션 생성 애러")
                return;
            }
            console.log("======response=======")
            console.log(response)
            
            // operation-signatue를 유저에게 서명 요청 합니다.
            const signatureResponse = await startAuthentication({
                challenge: response.data.challenge,
                allowCredentials: response.data.allowCredentials,
            });

            console.log("======signatureResponse=======")
            console.log(signatureResponse)

            // 해당 signature에 대한 sig 쌍(sig1, sig2)를 구합니다.
            const ecVerifyInputs = authResponseToSigVerificationInput({}, signatureResponse.response);

            console.log("======ecVerifyInputs=======")
            console.log(ecVerifyInputs)

            const verifyResponse = await verifyWebAuthnLogin(signatureResponse);
          
            console.log("======verifyResponse=======")
            console.log(verifyResponse)

            // sig가 검증이 잘 되었는지 검사합니다.
            if (!verifyResponse.success) {
                messages.push("검증 애러")
                return;
            } 
            setSignInMessage(messages);
        
        }catch(error){
            console.log(error)
            messages.push("Something went wrong!")
            setSignInMessage(messages);
        }
    };

    return (
        <div>
            <h1 style={{ textAlign: 'center', color: '#333', fontSize: '24px' }}>Welcome to the WebAuthn Test!</h1>
            <div className={styles.formStyle}>
                <input 
                    type="text" 
                    value={idValue} 
                    onChange={handleIdChange} 
                    className={styles.inputStyle}
                />
                <input 
                    type="email" 
                    value={emailValue} 
                    onChange={handleEmailChange} 
                    className={styles.inputStyle}
                />
                <input 
                    type="text" 
                    value={nameValue} 
                    onChange={handleNameChange} 
                    className={styles.inputStyle}
                />
                <div className={styles.buttonContainerStyle}>
                    <button className={styles.buttonStyle} onClick={handleSignUpClick}>sign up</button>
                    <button className={styles.buttonStyle} onClick={handleSignInClick}>sign in</button>
                </div>
            </div>
            <div id="signUpConsole" className={styles.consoleLogBoxStyle}>
                {signUpMessage.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <div id="signInConsole" className={styles.consoleLogBoxStyle}>
                {signInMessage.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
        </div>
    );
}