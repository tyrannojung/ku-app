'use client'
import { Col, Button, Row, Container, Card, Form } from "react-bootstrap";
import TOKAMAK_ICON from '@/public/assets/tn_logo.svg'
import Image from 'next/image';

import { member } from "@/app/_types/member"
import { signIn } from 'next-auth/react'
import { UserOperation } from "permissionless";
import { bundlerSign } from "../_simpleTool/bundler/bundlerTool";
import Loader from "@/app/_components/Loading";
import { useState } from 'react';

import {
  startAuthentication,
} from "@simplewebauthn/browser";
import {
  generateWebAuthnLoginOptions,
  verifyWebAuthnLogin,
} from "../_simpleTool/webauthn/webauthn";

import * as formik from 'formik';
import * as yup from 'yup';

import { authResponseToSigVerificationInput } from '../_simpleTool/webauthn/_debugger/authResponseToSigVerificationInput';
import { ethers } from 'ethers';

import base64url from 'base64url';
import { decodeAuthenticationCredential } from "../_simpleTool/webauthn/_debugger/decodeAuthenticationCredential";
import { toHex } from "viem"

export default function Signin() {

  const { Formik } = formik;
  const [loading, setLoading] = useState(false);

  const validationSchema = yup.object().shape({
    email: yup.string()
      .email('Invalid email address')
      .required('Required')
  });

  return (
      <div>
        {loading ? ( // 로딩 중일 때
          <Loader content = {'Creating a smart contract wallet and messaging Vitalik!'} />
          ) : (
            <Formik
              validationSchema={validationSchema}
              initialValues={{
                email: '',
              }}
              onSubmit={async (values, {setErrors, setSubmitting }) => {
                setSubmitting(true); // 비동기통신
              
                // 로그인(기존 하드웨어 키 생성) 옵션을 만들어 줍니다.
                // 해당 response에서 bundler에게 보낼 operation을 challenge로 만들어 유저에게 서명을 요청합니다.
                const response = await generateWebAuthnLoginOptions(values.email);

                if (response.tx){
                  setErrors({
                    email: 'hi'
                  });
                  return
                }

                if (!response.success || !response.data || !response.user) {
                  setErrors({
                    email: ' That email is not registered on this site. ',
                  });
                  return;
                }

                // operation-signatue를 유저에게 서명 요청 합니다.
                const signatureResponse = await startAuthentication({
                  challenge: response.data.challenge,
                  allowCredentials: response.data.allowCredentials,
                });

                // /**여기수정함
                //  * 
                //  */
                // console.log("User ======= !!",response.user)


                // const authenticatorDataBytes = signatureResponse.response.authenticatorData;
                // // Base64URL을 디코딩하여 바이트 배열로 변환
                // const decodedBytes = base64url.toBuffer(authenticatorDataBytes);
                // // 바이트 배열을 16진수 문자열로 변환
                // const hexString = `0x${decodedBytes.toString('hex')}`;
                // console.log("!!authenticatorData ====", hexString);
                // console.log("base64url.decode====확인", base64url.toBuffer(response.data.challenge))
                // console.log("!!byte challenge hex값 ====", toHex(base64url.toBuffer(response.data.challenge)));
                
                // const { response: decodedResponse } = decodeAuthenticationCredential(signatureResponse)
                // const clientDataJSON_string = JSON.stringify(decodedResponse.clientDataJSON);
                // const challengeLocation = BigInt(clientDataJSON_string.indexOf('"challenge":'));
                // const responseTypeLocation = BigInt(clientDataJSON_string.indexOf('"type":'));
                // console.log("clientDataJSON !!", clientDataJSON_string)
                // console.log("challengeLocation !!" , challengeLocation)
                // console.log("responseTypeLocation !!" , responseTypeLocation)
                
                // const ecVerifyInputsTest = authResponseToSigVerificationInput({}, signatureResponse.response);
                // console.log("sig=======!!", ecVerifyInputsTest);

                // return
                //   /**
                //  * END
                //  */


                const verifyResponse = await verifyWebAuthnLogin(signatureResponse);
                
                // sig가 검증이 잘 되었는지 검사합니다.
                if (!verifyResponse.success) {
                    alert("Something went wrong!");
                    return;
                } else {
                  setLoading(true);
                }

                // 해당 signature에 대한 sig 쌍(sig1, sig2)를 구합니다.
                const ecVerifyInputs = authResponseToSigVerificationInput({}, signatureResponse.response);
                
                
                // sig 값과 sig 검증 hash를 ethereum에 보내기 위해 데이터타입에 맞춰 인코딩 합니다.
                const p256sig = ethers.utils.defaultAbiCoder.encode(
                  ["bytes32", "uint256[2]"],
                  [
                    ecVerifyInputs.messageHash,
                    ecVerifyInputs.signature
                  ],
                )
                
                //해당 sig를 useroperation에 추가합니다. (AA contract verify 검증)
                const userOperation: UserOperation = response.userOperation;
                userOperation.signature = p256sig as `0x${string}`
                
                // 모든 데이터들을 bundler sign을 받고, 처리합니다.
                const bundlerSignResult : boolean = await bundlerSign(userOperation, response.user);
                          
                if(bundlerSignResult){
                  const response_value : member = response.user;
                
                  // session 담기
                  const result = await signIn("credentials", {
                    id: response_value.id,
                    publicKey: response_value.publicKey,
                    redirect: false,
                  });
                  
                  // 성공 완료
                  if(result?.ok) {
                      alert("success")
                  } else {
                    // error 표시
                    setErrors({
                      email: ' ',
                    });
                  }
                }   
                
            }}
          >
            {({ handleSubmit, handleChange, values, touched, errors}) => (
              <Container>
                <Row className="vh-100 d-flex justify-content-center align-items-center">
                  <Col md={8} lg={6} xs={12}>
                    <div className="border border-3 border-primary"></div>
                    <Card className="shadow">
                      <Card.Body>
                        <div className="mb-3 mt-md-4">
                          <h2 className="fw-bold mb-2 text-center text-uppercase ">
                            <Image src={TOKAMAK_ICON} alt="" className="middle_logo" />
                          </h2>
                          <p className=" mb-5">Please enter your login and password!</p>
                          <div className="mb-3">
                            <Form noValidate onSubmit={e => {
                              e.preventDefault();
                              handleSubmit(e)
                            }} autoComplete="off">
                              <Form.Group className="mb-3" controlId="ID">
                                <Form.Label className="text-center">
                                  EMAIL
                                </Form.Label>
                              <Form.Control
                                type="text"
                                name="email"
                                placeholder="email"
                                value={values.email}
                                onChange={handleChange}
                                isValid={touched.email && !errors.email}
                                isInvalid={!!errors.email}
                              />
                              <Form.Control.Feedback>
                                Looks good!
                              </Form.Control.Feedback>
                              <Form.Control.Feedback type="invalid">
                                  {errors.email}
                              </Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group
                                className="mb-3"
                                controlId="formBasicCheckbox"
                              >
                                <p className="small">
                                  <a className="text-primary" href="#!">
                                    Forgot password?
                                  </a>
                                </p>
                              </Form.Group>
                              <div className="d-grid">
                                <Button variant="primary" type="submit">
                                  Login
                                </Button>
                              </div>
                              <div className="mt-3">
                                <p className="mb-0  text-center">
                                  Don't have an account?{" "}
                                  <a href="/signup" className="text-primary fw-bold">
                                    Sign Up
                                  </a>
                                </p>
                              </div>
                            </Form>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Container>
            )}
            </Formik>
          )};
    </div>
  )
}
  