'use client'
import styles from './css/page.module.css'
import React, { useState } from 'react';
import { member } from "@/app/_types/member"
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
            
            console.log(response)

            // 계정생성 옵션을 통해 계정(하드웨어에 키저장)을 생성합니다.
            const passkey = await startRegistration(response.data);
            // 유저의 고유 id
            const credId = `0x${base64url.toBuffer(passkey.id).toString('hex')}`;
            //유저의 pubk x, y 쌍을 구한다.
            const decodedPassKey = decodeRegistrationCredential(passkey);
            
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

            messages.push(`Value of authenticator_id: ${credId}`)
            messages.push(`Value of pubKeyCoordinates:: ${pubKeyCoordinates}`)
            
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
            
        
        }catch(error){
            console.log(error)
            messages.push("Something went wrong!")
            setSignUpMessage(messages);
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