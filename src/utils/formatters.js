import { ethers } from 'ethers'

export function minifyAddress (addr) {
  const front = addr.substring(0, 6)
  const back = addr.substr(addr.length - 4)
  return `${front}...${back}`
}

export function formatRpcAssetsForUI (assets) {
  const results = []
  for (let i = 0; i < assets[0].length; i++) {
    const address = assets[0][i]
    const id = parseInt(assets[1][i]._hex, 16)

    if (address === ethers.constants.AddressZero) {
      continue
    }

    results.push({
      address: address,
      id: id
    })
  }
  return results
}
