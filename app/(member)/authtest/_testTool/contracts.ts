import { ethers, Contract } from 'ethers';
import entrypoint from '../abis/entrypoint.json'
import FIDOAccountFactory2 from '../abis/FIDOAccountFactory2.json'

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
export const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export const simpleFacotryAddress = "0xFd877542A65fA9c1403E1e6F99BBf3629f657Cfa"


export const entrypointContract = new Contract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", entrypoint.abi, provider);
export const factoryContract = new Contract("0xFd877542A65fA9c1403E1e6F99BBf3629f657Cfa", FIDOAccountFactory2.abi, provider);