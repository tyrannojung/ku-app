'use client'
import { Col, Button, Row, Container, Card, Form } from "react-bootstrap";
import TOKAMAK_ICON from '@/public/assets/tn_logo.svg'
import Image from 'next/image';

import { member } from "@/app/_types/member"
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'

import * as formik from 'formik';
import * as yup from 'yup';

export default function Signin() {
  
  const { Formik } = formik;
  const router = useRouter();

  const validationSchema = yup.object().shape({
    id: yup.string()
      .matches(
        /^(?=.*[a-z])[a-z0-9]{5,20}$/i,
        "Please enter a valid ID following the specified format."
      )    
      .required('Required'),
    publicKey: yup.string()
      .matches(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid public key following the specified format.')
      .required('Required')
  });

  return (
      <div>
        <Formik
          validationSchema={validationSchema}
          initialValues={{
            id: 'tyrannojung',
            publicKey: '0x84207aCCB87EC578Bef5f836aeC875979C1ABA85',
          }}
          onSubmit={async (values, {setErrors, setSubmitting }) => {
            console.log('hi')
            setSubmitting(true); // 비동기통신
            
            const member_info : member = {
              id : values.id,
              publicKey : values.publicKey,
            }

            const result = await signIn("credentials", {
              id: member_info.id,
              publicKey: member_info.publicKey,
              redirect: false,
            });

            if(result?.ok) {
               router.push('/');
               router.refresh();
            } else {
              // error 표시
              setErrors({
                id: ' ',
                publicKey: 'Invalid ID or password'
              });
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
                                ID
                              </Form.Label>
                            <Form.Control
                              type="text"
                              name="id"
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

                            <Form.Group
                              className="mb-3"
                              controlId="formBasicPublicKey"
                            >
                              <Form.Label>Public Key</Form.Label>
                            <Form.Control
                              type="text"
                              name="publicKey"
                              value={values.publicKey}
                              onChange={handleChange}
                              isValid={touched.publicKey && !errors.publicKey}
                              isInvalid={!!errors.publicKey}
                            />
                            <Form.Control.Feedback>
                              Looks good!
                            </Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">
                                {errors.publicKey}
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
      </div>
  )
}
  