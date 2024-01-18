import { entrypointContract, factoryContract, simpleFacotryAddress, entryPointAddress } from "./contracts"
import { member, UserOperationType } from "@/app/_types/member"
import { ethers } from 'ethers';
import { concat, encodeFunctionData } from "viem"
import { estimateUserOperationGas, paymasterSponsorUserOperation } from './testbundlerAPI'

export async function testBundlerCall(value : member) : Promise<UserOperationType>{
  console.log("value=====",   value)  
  const abiCoder = new ethers.AbiCoder();
    const encodePubkCoordinates = abiCoder.encode(
        ["uint256[2]"],
        [
            value.pubkCoordinates
        ],
      )
      console.log("encodePubkCoordinates", encodePubkCoordinates)

      const initCode = concat([
        simpleFacotryAddress,
        encodeFunctionData({
          abi: [{
            inputs: [
              { name: "anPubkCoordinates", type: "bytes" }, 
              { name: "salt", type: "uint256" }],
            name: "createAccount",
            outputs: [{ name: "ret", type: "address" }],
            stateMutability: "nonpayable",
            type: "function",
          }],
          args: [encodePubkCoordinates as `0x${string}`, BigInt(0)]
        })
      ]);

    // create2 결정론적인 주소 생성
    const senderAddress = await factoryContract["getAddress(bytes, uint256)"](encodePubkCoordinates,0)
    console.log("Calculated sender address:", senderAddress)

    // 결정론 적인 주소를 통해, 비탈릭에게 메시지 전송 트랜잭션 생성
    const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik
    const param = BigInt(0)
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes

    const callData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "dest", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "func", type: "bytes" }
                ],
                name: "execute",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        args: [to, param, data]
    })

    const userOperation: UserOperationType  = {
        sender: '',
        nonce: '',
        initCode: '',
        callData: '',
        callGasLimit: '',
        verificationGasLimit: '',
        preVerificationGas: '',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
        paymasterAndData: '',
        signature: ''
    };

    userOperation.sender = senderAddress;
    userOperation.nonce = "0x0";
    userOperation.initCode = initCode;
    userOperation.callData = callData;
    userOperation.callGasLimit = "0x560c";
    userOperation.verificationGasLimit = "0x98129";
    userOperation.preVerificationGas = "0xc034";
    userOperation.maxFeePerGas = "0x656703D00";
    userOperation.maxPriorityFeePerGas = "0x13AB6680";
    userOperation.paymasterAndData = "0x";
    // dummy value
    userOperation.signature = "0x89f201864b89cb77b9efc64247303031e655aaa977e13d525ad94a4a4cc233853fadf0a7dc2c2e55c1c3a4d93a36afe58941c714bc4f0a4d35d391292d6a8f7e1b";
    
    // paymaster 등록을 먼저 한다.
    const paymaster_result_param = await paymasterSponsorUserOperation(userOperation)
    console.log("paymaster_result_param===", paymaster_result_param)
    userOperation.paymasterAndData = paymaster_result_param.result
    console.log(userOperation)

    // bundler 가스 추정치를 업데이트 한다.
    const bunder_result_param = await estimateUserOperationGas(userOperation);
    console.log("bunder_result_param===", bunder_result_param)

    userOperation.callGasLimit = bunder_result_param.result.callGasLimit
    userOperation.verificationGasLimit = bunder_result_param.result.verificationGasLimit
    userOperation.preVerificationGas = bunder_result_param.result.preVerificationGas

    console.log(userOperation)
    const userOpHash = await entrypointContract.getUserOpHash(userOperation);
    console.log("userOpHash======", userOpHash)
    userOperation.signature = userOpHash;


    return userOperation;

}