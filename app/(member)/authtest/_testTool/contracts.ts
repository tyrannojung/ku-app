import { ethers, Contract } from 'ethers';
import entrypoint from '../abis/entrypoint.json'
import FIDOAccountFactory2 from '../abis/FIDOAccountFactory2.json'

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
export const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export const simpleFacotryAddress = "0x0229d2B3d30Ee474E276d1237FeEe3eF08c00405"


export const entrypointContract = new Contract(entryPointAddress, entrypoint.abi, provider);
export const factoryContract = new Contract(simpleFacotryAddress, FIDOAccountFactory2.abi, provider);