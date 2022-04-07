export default {
  dummyNFT: process.env.REACT_APP_DUMMY_NFT,
  contractAddress: process.env.REACT_APP_NFTSWAP,
  environmentLabel: process.env.REACT_APP_ENV_LABEL,
  contractAbi: require('./abis/nftswap.json'),
  erc721Abi: require('./abis/erc721.json')
}
