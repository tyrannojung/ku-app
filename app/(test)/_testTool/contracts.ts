import { ethers, Contract } from 'ethers';
import entrypoint from '../abis/entrypoint.json'
import FIDOAccountFactory2 from '../abis/FIDOAccountFactory2.json'

//const provider = new ethers.JsonRpcProvider("https://goerli.infura.io/v3/4c79c22d05294f9f81fbe2501462ac2");


// const network = "arbitrum-sepolia"
// const infuraApiKey = "4c79c22d05294f9f81fbe2501462ac22"
// const alchemyApiKey = "zSKRdOEoMyh2kijomiLovtZVniyLodFd"

const SEPOLIA_CHAIN_ID = 421614;
const network = ethers.Network.from(SEPOLIA_CHAIN_ID);

const getProvider = (url: string) => {
    return new ethers.JsonRpcProvider(url, network, {
      staticNetwork: network,
    });
  };

const provider = getProvider("https://arbitrum-sepolia.infura.io/v3/4c79c22d05294f9f81fbe2501462ac22");
export const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export const simpleFacotryAddress = "0x44F4A357ef0B623ED90eb7A0896dCc0beD4E3e1e"


export const entrypointContract = new Contract(entryPointAddress, entrypoint.abi, provider);
export const factoryContract = new Contract(simpleFacotryAddress, FIDOAccountFactory2.abi, provider);