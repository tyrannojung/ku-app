import { ethers, Contract } from 'ethers';
import entrypoint from '../abis/entrypoint.json'
import FIDOAccountFactory2 from '../abis/FIDOAccountFactory2.json'

const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0xFd877542A65fA9c1403E1e6F99BBf3629f657Cfa"
const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");

export const entrypointContract = new Contract(entryPointAddress, entrypoint.abi, provider);
export const factoryContract = new Contract(SIMPLE_ACCOUNT_FACTORY_ADDRESS, FIDOAccountFactory2.abi, provider);