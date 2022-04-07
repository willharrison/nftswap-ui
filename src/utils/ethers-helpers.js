import { ethers } from 'ethers'
import Config from '../config'

export async function getConnectionToEthereum () {
  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  const accounts = await provider.listAccounts()
  if (accounts.length === 0) {
    return {
      provider: provider
    }
  }

  const signer = await provider.getSigner()
  const signerAddress = await signer.getAddress()
  const nftSwap = new ethers.Contract(Config.contractAddress, Config.contractAbi, signer)

  window.ethereum.on('accountsChanged', () => {
    window.location.reload()
  })

  return {
    provider: provider,
    signer: signer,
    signerAddress: signerAddress,
    nftSwap: nftSwap
  }
}
