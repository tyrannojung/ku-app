import { getBytes, AbiCoder, keccak256, Wallet } from "ethers";
import {
  ecsign,
  toRpcSig,
  keccak256 as keccak256_buffer,
} from "ethereumjs-util";
import { UserOperationType } from "@/app/_types/member";

// export const DefaultsForUserOp: UserOperationType = {
//   sender: "0x0000000000000000000000000000000000000000",
//   nonce: "0x",
//   initCode: "0x",
//   callData: "0x",
//   callGasLimit: "0",
//   verificationGasLimit: "150000",
//   preVerificationGas: "21000",
//   maxFeePerGas: "0",
//   maxPriorityFeePerGas: "1e9",
//   paymasterAndData: "0x",
//   signature: "0x",
// };

// export function fillUserOpDefaults(
//   op: Partial<UserOperationType>,
//   defaults = DefaultsForUserOp
// ): UserOperationType {
//   const partial: any = { ...op };
//   // we want "item:undefined" to be used from defaults, and not override defaults, so we must explicitly
//   // remove those so "merge" will succeed.
//   for (const key in partial) {
//     if (partial[key] == null) {
//       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//       delete partial[key];
//     }
//   }
//   const filled = { ...defaults, ...partial };
//   return filled;
// }

export function packUserOp(op: UserOperationType, forSignature = true): string {
  const abiCoder = new AbiCoder();
  if (forSignature) {
    return abiCoder.encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        op.sender,
        op.nonce,
        keccak256(op.initCode),
        keccak256(op.callData),
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData),
      ]
    );
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return abiCoder.encode(
      [
        "address",
        "uint256",
        "bytes",
        "bytes",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes",
        "bytes",
      ],
      [
        op.sender,
        op.nonce,
        op.initCode,
        op.callData,
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        op.paymasterAndData,
        op.signature,
      ]
    );
  }
}

export function signUserOp(
  op: UserOperationType,
  signer: Wallet,
  entryPoint: string,
  chainId: number
): UserOperationType {
  const message = getUserOpHash(op, entryPoint, chainId);
  const msg1 = Buffer.concat([
    Buffer.from("\x19Ethereum Signed Message:\n32", "ascii"),
    Buffer.from(getBytes(message)),
  ]);

  const sig = ecsign(
    keccak256_buffer(msg1),
    Buffer.from(getBytes(signer.privateKey))
  );
  // that's equivalent of:  await signer.signMessage(message);
  // (but without "async"
  const signedMessage1 = toRpcSig(sig.v, sig.r, sig.s);
  return {
    ...op,
    signature: signedMessage1,
  };
}

export function getUserOpHash(
  op: UserOperationType,
  entryPoint: string,
  chainId: number
): string {
  const userOpHash = keccak256(packUserOp(op, true));
  const abiCoder = new AbiCoder();
  const enc = abiCoder.encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, chainId]
  );
  return keccak256(enc);
}
