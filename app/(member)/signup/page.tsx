'use client'
import { Col, Button, Row, Container, Card, Form, InputGroup, Spinner  } from 'react-bootstrap';
import TOKAMAK_ICON from '@/public/assets/tn_logo.svg'
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { member } from "@/app/_types/member"
import * as formik from 'formik';
import * as yup from 'yup';

import {
  startRegistration,
} from "@simplewebauthn/browser";
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
} from "../_simpleTool/webauthn/webauthn";

import base64url from 'base64url';
import { decodeRegistrationCredential } from '../_simpleTool/webauthn/_debugger/decodeRegistrationCredential';

export default function Signup() {
  
  const { Formik } = formik;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const validationSchema = yup.object().shape({
    id: yup.string()
      .matches(
        /^(?=.*[a-z])[a-z0-9]{5,20}$/i,
        "ID must be 5 to 20 characters and can only contain letters and numbers."
      )
      .test(
        {
          message: 'ID is already taken.',
          test: async (id) => {
            if(id){
              const value : string = id;

              const member_info : member = {
                id : value,
              }
              const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(member_info)
              } 
              const resp = await fetch('/api/member/checkDuplicateId/', options);
              const data = await resp.json()
                if(data.result) {
                    return true;
                } else {
                    return false;
                }
            }
            return false
        }
      })
      .required('Required'),
    email: yup.string()
      .email('Invalid email address')
      .required('Required')
      .test(
        {
          message: 'EMAIL is already taken.',
          test: async (email) => {
            if(email){
              const value : string = email;
              
              const member_info : member = {
                email : value,
              }
              const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(member_info)
              } 
              console.log(options)
              const resp = await fetch('/api/member/checkDuplicateId/', options);
              const data = await resp.json()
                if(data.result) {
                    return true;
                } else {
                    return false;
                }
            }
            return false
        }
      }),
    name: yup.string()
      .min(2, 'Name must be at least 2 characters')
      .max(20, 'Name must be 20 characters or less')
      .matches(
        /^[A-Za-z가-힣\s]{2,20}$/,
        "Real name must be 2 to 20 characters and should only contain letters and spaces."
      )
      .required('Required'),
  });
  return (
    <div>
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          id: '',
          email: '',
          name: '',
        }}

        onSubmit={async (values, { setSubmitting, setErrors }) => {
          setSubmitting(true); // 비동기통신
          setIsSubmitting(true);
          try{
            // 유저의 email을 기준으로 계정생성(하드웨어에 키저장) 옵션을 만들어 줍니다.
            const response = await generateWebAuthnRegistrationOptions(values.email);
            

            if (!response.success || !response.data) {
              setIsSubmitting(false);
              setErrors({
                id: ' ',
                email: ' ',
                name: 'Something went wrong!',
              });
              return;
            }

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
            
            // 해당 검증이 정상적인지 검사합니다. 
            const verifyResponse = await verifyWebAuthnRegistration(passkey);
            
            //검증이 정상적이면,  회원가입을진행합니다.
            if (verifyResponse.value) {
              const member_info : member = {
                id : values.id,
                publicKey : verifyResponse.value.credentialPublicKey,
                pubk : credId,
                pubkCoordinates : pubKeyCoordinates,
                email : values.email,
                name : values.name,
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
              
              // 회원가입 완료 후 로그인 페이지로 이동한다.
              const data = await resp.json()
              if(data.result == "success") {
                router.push('/signin');
                router.refresh();
              }

            } else {
              setIsSubmitting(false);
              setErrors({
                id: ' ',
                email: ' ',
                name: 'Something went wrong!',
              });
              return
            }
          } catch(error) {
            console.log(error)
            setIsSubmitting(false);
            setErrors({
              id: ' ',
              email: ' ',
              name: 'Something went wrong!',
            });
            return
          }
          
        }}
      >
        {({ handleSubmit, handleChange, values, touched, errors}) => (
          <Container>
            <Row className="vh-100 d-flex justify-content-center align-items-center">
              <Col md={8} lg={6} xs={12}>
              <div className="border border-2 border-primary"></div>
                <Card className="shadow px-4">
                  <Card.Body>
                    <div className="mb-3 mt-md-4">
                      <h2 className="fw-bold mb-2 text-center text-uppercase ">
                        <Image src={TOKAMAK_ICON} alt="" className="middle_logo" />
                      </h2>
                      <div className="mb-3">
                      <Form noValidate onSubmit={e => {
                        e.preventDefault();
                        handleSubmit(e)
                      }} autoComplete="off">
                          <Form.Group className="mb-3" controlId="ID">
                            <Form.Label className="text-center">
                              ID
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="id"
                              placeholder="id"
                              value={values.id}
                              onChange={handleChange}
                              isValid={touched.id && !errors.id}
                              isInvalid={!!errors.id}
                            />
                            <Form.Control.Feedback>
                              Looks good!
                            </Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">
                                {errors.id}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label className="text-center">
                              Email address
                            </Form.Label>
                            <InputGroup hasValidation>
                              <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="email"
                                aria-describedby="inputGroupPrepend"
                                name="email"
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
                            </InputGroup>
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="formBasicName">
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                placeholder="name"
                                value={values.name}
                                onChange={handleChange}
                                isValid={touched.name && !errors.name}
                                isInvalid={!!errors.name}
                              />
                              <Form.Control.Feedback>
                                Looks good!
                              </Form.Control.Feedback>
                              <Form.Control.Feedback type="invalid">
                                  {errors.name}
                                </Form.Control.Feedback>
                          </Form.Group>

                          <div className="d-grid">
                            <Button variant="primary" type="submit">
                            {isSubmitting ? <><Spinner animation="border" variant="light" size="sm" /> Processing...</> : 'Create Account'}
                            </Button>
                          </div>

                        </Form>
                        <div className="mt-3">
                          <p className="mb-0  text-center">
                          Already have an account??{" "}
                            <a href="/signin" className="text-primary fw-bold">
                              Sign In
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}
      </Formik>
    </div>
  );
}
  