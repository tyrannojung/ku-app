import {
  entrypointContract,
  factoryContract,
  simpleFacotryAddress,
  entryPointAddress,
} from "./contracts";
import { member, UserOperationType } from "@/app/_types/member";
import { ethers } from "ethers";
import { concat, encodeFunctionData } from "viem";
import {
  estimateUserOperationGas,
  paymasterSponsorUserOperation,
  sendUserOperation,
} from "./testbundlerAPI";

export async function testBundlerCall(
  value: member
): Promise<UserOperationType> {
  const abiCoder = new ethers.AbiCoder();
  const encodePubkCoordinates = abiCoder.encode(
    ["uint256[2]"],
    [value.pubkCoordinates]
  );
  console.log("encodePubkCoordinates", encodePubkCoordinates);

  const initCode = concat([
    simpleFacotryAddress,
    encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "anPubkCoordinates", type: "bytes" },
            { name: "salt", type: "uint256" },
          ],
          name: "createAccount",
          outputs: [{ name: "ret", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      args: [encodePubkCoordinates as `0x${string}`, BigInt(0)],
    }),
  ]);

  // create2 결정론적인 주소 생성
  const senderAddress = await factoryContract["getAddress(bytes, uint256)"](
    encodePubkCoordinates,
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
  userOperation.nonce = "0x0";
  userOperation.initCode = initCode;
  // userOperation.initCode = "0x";
  userOperation.callData = callData;
  userOperation.callGasLimit = "0x560c";
  userOperation.verificationGasLimit = "0x98129";
  userOperation.preVerificationGas = "0xEA60";
  userOperation.maxFeePerGas = "0x656703D00";
  userOperation.maxPriorityFeePerGas = "0x13AB6680";
  userOperation.paymasterAndData = "0x";
  // dummy value
  userOperation.signature = "0x";

  //paymaster 등록을 먼저 한다.
  const paymaster_result_param = await paymasterSponsorUserOperation(
    userOperation
  );
  console.log("paymaster_result_param====", paymaster_result_param.result);
  userOperation.paymasterAndData = paymaster_result_param.result;

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
  // ////////////////////////

  const userOpHash = await entrypointContract.getUserOpHash(userOperation);
  console.log("userOpHash======", userOpHash);
  userOperation.signature = userOpHash;

  return userOperation;
}

export async function testBundlerSend(
  value: UserOperationType,
  member: member
): Promise<boolean> {
  const bundler_result_param = await sendUserOperation(value);
  console.log(bundler_result_param);

  return true;
}
