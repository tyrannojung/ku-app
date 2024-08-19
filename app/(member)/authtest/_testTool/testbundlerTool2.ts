import {
  factoryk1Contract,
  simpleFacotryk1Address,
  entrypointContract,
  entryPointAddress,
  provider,
  CHAIN_ID,
} from "./contracts";
import { concat, encodeFunctionData } from "viem";
import { UserOperationType } from "@/app/_types/member";
import {
  estimateUserOperationGas,
  paymasterSponsorUserOperation,
  sendUserOperation,
} from "./testbundlerAPI";
import { ethers } from "ethers";
import { signUserOp } from "./userOp";

export async function testBundlerCall2() {
  const publicKey = "0x46897603e2A82755E9c416eF828Bd1515536b3D5";
  const initCode = concat([
    simpleFacotryk1Address,
    encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "salt", type: "uint256" },
          ],
          name: "createAccount",
          outputs: [{ name: "ret", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      args: [publicKey, BigInt(0)],
    }),
  ]);

  const senderAddress = await factoryk1Contract["getAddress(address, uint256)"](
    publicKey,
    0
  );
  console.log("Calculated sender address:", senderAddress);

  // 결정론 적인 주소를 통해, 잔고 전송 트랜잭션 생성
  const to = "0x84207aCCB87EC578Bef5f836aeC875979C1ABA85"; // 내 개인 메타마스크 주소
  const param = BigInt(1e8); // 0.0000000001 ether를 wei로 변환
  const data = "0x"; // 빈 데이터

  const callData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "dest", type: "address" },
          { name: "value", type: "uint256" },
          { name: "func", type: "bytes" },
        ],
        name: "execute",
        outputs: [],
        stateMutability: "payable", // 변경된 부분
        type: "function",
      },
    ],
    args: [to, param, data],
  });

  const userOperation: UserOperationType = {
    sender: "",
    nonce: "",
    initCode: "",
    callData: "",
    callGasLimit: "",
    verificationGasLimit: "",
    preVerificationGas: "",
    maxFeePerGas: "",
    maxPriorityFeePerGas: "",
    paymasterAndData: "",
    signature: "",
  };

  userOperation.sender = senderAddress;
  userOperation.nonce = "0x14";
  // userOperation.initCode = initCode;
  userOperation.initCode = "0x";
  userOperation.callData = callData;
  userOperation.callGasLimit = "0x560c";
  userOperation.verificationGasLimit = "0x98129";
  userOperation.preVerificationGas = "0xEA60";
  userOperation.maxFeePerGas = "0x656703D00";
  userOperation.maxPriorityFeePerGas = "0x13AB6680";
  userOperation.paymasterAndData = "0x";
  // dummy signature
  userOperation.signature =
    "0xa15569dd8f8324dbeabf8073fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c";

  //paymaster 등록을 먼저 한다.
  // const paymaster_result_param = await paymasterSponsorUserOperation(
  //   userOperation
  // );
  // console.log("paymaster_result_param====", paymaster_result_param.result);
  // userOperation.paymasterAndData = paymaster_result_param.result;

  // bundler 가스 추정치를 업데이트 한다.
  const bunder_result_param = await estimateUserOperationGas(userOperation);
  console.log("bunder_result_param====", bunder_result_param);
  userOperation.callGasLimit = bunder_result_param.result.callGasLimit;
  userOperation.verificationGasLimit =
    bunder_result_param.result.verificationGasLimit;
  userOperation.preVerificationGas =
    bunder_result_param.result.preVerificationGas;

  // hex 값 업데이트
  console.log("preVerificationGas======", userOperation.preVerificationGas);
  let decimalValue = parseInt(userOperation.preVerificationGas, 16);
  // 10000을 더함
  let newDecimalValue = decimalValue + 10000;
  // 결과를 다시 16진수로 변환
  let newHexValue = "0x" + newDecimalValue.toString(16);
  console.log("newHexValue=====", newHexValue);
  userOperation.preVerificationGas = newHexValue;

  const userOpHash = await entrypointContract.getUserOpHash(userOperation);
  console.log("userOpHash======", userOpHash);

  const privateKey =
    "0x14e0f7e29e2e964f0c82a25c385bed42309e202d3ea80f24233c028f2b357d0a";

  // 공급자와 지갑 설정
  const wallet = new ethers.Wallet(privateKey, provider);
  const operationResult = signUserOp(
    userOperation,
    wallet,
    entryPointAddress,
    CHAIN_ID
  );
  // const signature = await wallet.signMessage(userOpHash);
  //userOperation.signature = signature;

  console.log(userOperation);
  const bundler_result_param = await sendUserOperation(operationResult);
  console.log(bundler_result_param);
}
