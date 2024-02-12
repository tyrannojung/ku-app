'use client'
import styles from './css/page.module.css'
import React, { useState } from 'react';
import { member } from "@/app/_types/member"
import { ethers } from 'ethers';
import {
  startRegistration,
  startAuthentication
} from "@simplewebauthn/browser";
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  verifyWebAuthnLogin
} from "./webauthn/testwebauthn";

import {
    testGenerateWebAuthnLoginOptions
} from "./webauthn/testwebauthn"

import base64url from 'base64url';
import { decodeRegistrationCredential } from './webauthn/_debugger/decodeRegistrationCredential';
import { decodeAuthenticationCredential } from './webauthn/_debugger/decodeAuthenticationCredential';
import { authResponseToSigVerificationInput } from './webauthn/_debugger/authResponseToSigVerificationInput';

import { testBundlerSend } from './_testTool/testbundlerTool'

export default function Test() {
    const [signUpMessage, setSignUpMessage] = useState<string[]>([]);
    const [signInMessage, setSignInMessage] = useState<string[]>([]);
    const [idValue, setIdValue] = useState('enk02100');
    const [emailValue, setEmailValue] = useState('enk02100@naver.com');
    const [nameValue, setNameValue] = useState('다운');

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
        const messages = [];
        
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

            const challenge = response.data.challenge;
            let standardBase64 = challenge.replace(/-/g, '+').replace(/_/g, '/');
            let challengeBuffer = Buffer.from(standardBase64, 'base64');
            let challengeHex = challengeBuffer.toString('hex');
            let userChallenge = `0x${challengeHex}`;
            console.log(`userChallenge`, userChallenge);


            // 계정생성 옵션을 통해 계정(하드웨어에 키저장)을 생성합니다.
            const passkey = await startRegistration(response.data);

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

            const challengeOffsetRegex = new RegExp(`(.*)${Buffer.from(challenge).toString('hex')}`);
            const challengePrefix = challengeOffsetRegex.exec(
              base64url.toBuffer(passkey.response.clientDataJSON).toString('hex'),
            )?.[1];

            let new_push0 = decodedPassKey.response.attestationObject.authData.flagsMask;
            let new_push1 = `0x${base64url.toBuffer(passkey.response.authenticatorData!).toString('hex')}`
            let new_push2 = `0x${base64url.toBuffer(passkey.response.clientDataJSON).toString('hex')}`
            let new_push3 = userChallenge
            let new_push4 = Buffer.from(challengePrefix || '', 'hex').length

            messages.push(`const authenticatorDataFlagMask = "${new_push0}"`)
            messages.push(`const authenticatorData = "${new_push1}"`)
            messages.push(`const clientData = "${new_push2}"`)
            messages.push(`const clientChallenge = "${new_push3}"`)
            messages.push(`const clientChallengeOffset = "${new_push4}"`)
            messages.push(`const rs = ["${ecVerifyInputs.signature[0]}", "${ecVerifyInputs.signature[1]}"]`)
            messages.push(`const Q = ["${ecVerifyInputs.publicKeyCoordinates[0]}", "${ecVerifyInputs.publicKeyCoordinates[1]}"]`)
            

            // 해당 검증이 정상적인지 검사합니다. 
            const verifyResponse = await verifyWebAuthnRegistration(passkey);
            if (verifyResponse.value) {
                const member_info : member = {
                    id : enteredId,
                    publicKey : verifyResponse.value.credentialPublicKey,
                    pubk : credId,
                    pubkCoordinates : pubKeyCoordinates,
                    email : enteredEmail,
                    name : enteredName,
                    updatedAt : null,
                    createAt : new Date(),
                    devices : [verifyResponse.value]
                }
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(member_info)
                }
                
                const resp = await fetch('/api/member/signup/', options);
                const data = await resp.json()
                console.log(data)
            }    
        
            setSignUpMessage(messages);
        }
        catch(error){
            console.log(error)
            messages.push("Something went wrong!")
            setSignUpMessage(messages);
        }
        
    };

    const handleSignInClick = async () => {
        const messages = [];
        
        try{
            let enteredEmail = emailValue;
            
            // 로그인(기존 하드웨어 키 생성) 옵션을 만들어 줍니다.
            // 해당 response에서 bundler에게 보낼 operation을 challenge로 만들어 유저에게 서명을 요청합니다.
            const response = await testGenerateWebAuthnLoginOptions(enteredEmail);             
            const challenge = response.data.challenge
            console.log(`challenge`, challenge);
            let userChallenge = response.userOperation?.signature;
            console.log(`userChallenge`, userChallenge);


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

            const decodedPassKey = decodeAuthenticationCredential(signatureResponse);
            
            console.log("======decodedPassKey=======")
            console.log(decodedPassKey)

            // 해당 signature에 대한 sig 쌍(sig1, sig2)를 구합니다.
            const ecVerifyInputs = authResponseToSigVerificationInput({}, signatureResponse.response);

            console.log("======ecVerifyInputs=======")
            console.log(ecVerifyInputs)

            const challengeOffsetRegex = new RegExp(`(.*)${Buffer.from(challenge).toString('hex')}`);
            const challengePrefix = challengeOffsetRegex.exec(
              base64url.toBuffer(signatureResponse.response.clientDataJSON).toString('hex'),
            )?.[1];
            console.log("challengeOffsetRegex, challengePrefix", challengeOffsetRegex, challengePrefix)
            
            let new_push0 = decodedPassKey.response.authenticatorData.flagsMask;
            let new_push1 = `0x${base64url.toBuffer(signatureResponse.response.authenticatorData!).toString('hex')}`
            let new_push2 = `0x${base64url.toBuffer(signatureResponse.response.clientDataJSON).toString('hex')}`
            let new_push3 = userChallenge
            let new_push4 = Buffer.from(challengePrefix || '', 'hex').length

            messages.push(`const authenticatorDataFlagMask = "${new_push0}"`)
            messages.push(`const authenticatorData = "${new_push1}"`)
            messages.push(`const clientData = "${new_push2}"`)
            messages.push(`const clientChallenge = "${new_push3}"`)
            messages.push(`const clientChallengeOffset = "${new_push4}"`)
            messages.push(`const rs = ["${ecVerifyInputs.signature[0]}", "${ecVerifyInputs.signature[1]}"]`)
            messages.push(`const Q = ["${response.user.pubkCoordinates[0]}", "${response.user.pubkCoordinates[1]}"]`)
            
            // const fail_test : any = []
            // fail_test.push(ecVerifyInputs.signature[0])
            // fail_test.push("0x9b0a3397f24677f039e5c96a937f1c94a4e5e19acd814d2ac1eb386e3a926909")
            // console.log(fail_test)

            const abiCoder = new ethers.AbiCoder();
            const challengeUpdate = abiCoder.encode(
                ["bytes1", "bytes", "bytes", "bytes", "uint256", "uint256[2]"],
                [
                    new_push0,
                    new_push1,
                    new_push2,
                    new_push3,
                    new_push4,
                    ecVerifyInputs.signature
                ],
              )
            const userOperation: any = response.userOperation;
            userOperation.signature = challengeUpdate 
        
            console.log("userOperation====", userOperation)
            
            const bundlerSendResult : boolean = await testBundlerSend(userOperation, response.user);




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