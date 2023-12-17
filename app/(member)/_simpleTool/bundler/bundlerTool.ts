import { member } from "@/app/_types/member"
import { ethers } from 'ethers';
import { concat, createClient, createPublicClient, encodeFunctionData, http, Hex } from "viem"
import { UserOperation, bundlerActions, getSenderAddress, getUserOperationHash, GetUserOperationReceiptReturnType } from "permissionless"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { lineaTestnet } from "viem/chains"
import { kv } from "@vercel/kv";

const publicClient = createPublicClient({
  transport: http("https://linea-goerli.infura.io/v3/4c79c22d05294f9f81fbe2501462ac22"),
  chain: lineaTestnet
})
 
const chain = "linea-testnet" // find the list of chain names on the Pimlico verifying paymaster reference page
const apiKey = "a76e8d51-4ce4-4df3-88f7-ada0402502b2" // REPLACE THIS
 
const bundlerClient = createClient({
  transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`),
  chain: lineaTestnet
}).extend(bundlerActions).extend(pimlicoBundlerActions)
 
const paymasterClient = createClient({
  // ⚠️ using v2 of the API ⚠️ 
  transport: http(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`),
  chain: lineaTestnet
}).extend(pimlicoPaymasterActions)

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

export async function bundlerCall(value : member): Promise<UserOperation> {
   
      const encodePubkCoordinates = ethers.utils.defaultAbiCoder.encode(
          ["uint256[2]"],
          [
            value.pubkCoordinates
          ],
        )
        console.log(encodePubkCoordinates)

      const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0xa419b3a372c999a76e0bcfccd2fa4f5c142b2416"    
      const initCode = concat([
          SIMPLE_ACCOUNT_FACTORY_ADDRESS,
          encodeFunctionData({
            abi: [{
              inputs: [
                { name: "owner", type: "bytes" }, 
                { name: "salt", type: "uint256" },
                { name: "anPubkCoordinates", type: "bytes" }],
              name: "createAccount",
              outputs: [{ name: "ret", type: "address" }],
              stateMutability: "nonpayable",
              type: "function",
            }],
            args: [value.pubk as `0x${string}`, BigInt(0), encodePubkCoordinates as `0x${string}`]
          })
        ]);
  
    const senderAddress = await getSenderAddress(publicClient, {
      initCode,
      entryPoint: ENTRY_POINT_ADDRESS
    })
    
    const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik
    const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes
    
    const callData = encodeFunctionData({
    abi: [{
            inputs: [
        { name: "dest", type: "address" },
        { name: "value", type: "uint256" },
        { name: "func", type: "bytes" },
            ],
            name: "execute",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        }],
    args: [to, BigInt(0), data]
    })
    
    /*-----------------------------------------------------------------------------------------*/

const gasPrice = await bundlerClient.getUserOperationGasPrice()
 
const userOperation = {
    sender: senderAddress,
    nonce: BigInt(0),
    initCode,
    callData,
    maxFeePerGas: gasPrice.fast.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
    // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
    signature: "0xa15569dd8f8324dbeabf8073fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c" as Hex
}

/*-----------------------------------------------------------------------------------------*/

// REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
    userOperation,
    entryPoint: ENTRY_POINT_ADDRESS
  })
   
  const sponsoredUserOperation: UserOperation = {
    ...userOperation,
    preVerificationGas: sponsorUserOperationResult.preVerificationGas,
    verificationGasLimit: sponsorUserOperationResult.verificationGasLimit,
    callGasLimit: sponsorUserOperationResult.callGasLimit,
    paymasterAndData: sponsorUserOperationResult.paymasterAndData
  }

  const signature = getUserOperationHash(
    {
      userOperation: sponsoredUserOperation, 
      chainId: lineaTestnet.id, 
      entryPoint: ENTRY_POINT_ADDRESS 
    });
   
  sponsoredUserOperation.signature = signature
    
  return sponsoredUserOperation
}





export async function bundlerSign(value : UserOperation, member : member): Promise<boolean> {
    
    const userOperationHash = await bundlerClient.sendUserOperation({
      userOperation: value,
      entryPoint: ENTRY_POINT_ADDRESS
    })
     
    console.log("Received User Operation hash:", userOperationHash)
     
    // let's also wait for the userOperation to be included, by continually querying for the receipts
    console.log("Querying for receipts...")

    let receipt: GetUserOperationReceiptReturnType = null 
    while (receipt === null) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        receipt = await bundlerClient.getUserOperationReceipt({ hash: userOperationHash });
        console.log(receipt === null ? "Still waiting..." : `Receipt received: ${receipt.success ? "success" : "failure"}`)
    }
    // 아래 코드를 뷰로 보여준다.
    const txHash = receipt.receipt.transactionHash
    
    const options = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id: member._id,
      }),
    }

    const resp = await fetch('/api/member/txupdate/', options);



    console.log(`UserOperation included: https://goerli.lineascan.build/tx/${txHash}`)

    return true
}