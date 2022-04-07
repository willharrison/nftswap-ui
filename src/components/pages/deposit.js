import React from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Center,
  ButtonGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Td,
  Tr,
  Thead,
  Table,
  Th,
  Tbody,
  Heading,
  Link, AlertDescription, Alert, AlertIcon
} from '@chakra-ui/react'
import { CheckCircleIcon, InfoOutlineIcon, TimeIcon } from '@chakra-ui/icons'
import { minifyAddress } from '../../utils/formatters'
import { ConnectionContext } from '../../contexts'
import { ethers } from 'ethers'
import Config from '../../config'
import { handleError } from '../../utils/errors'
import { toast } from '../../app'
import { successToast } from '../../ui'

export default class Deposit extends React.Component {
  static contextType = ConnectionContext

  constructor (props) {
    super(props)

    this.state = {
      beingApproved: new Map(),
      beingDeposited: new Map(),
      beingWithdrawn: new Map(),
      theyCancelled: props.theyCancelled,
      ...this.buildInitialState()
    }
  }

  buildInitialState () {
    let allYou = [...this.props.yourDeposited, ...this.props.yourUndeposited]
    let allThem = [...this.props.theirDeposited, ...this.props.theirUndeposited]
    allYou = allYou.filter((a) => a.address !== ethers.constants.AddressZero)
    allThem = allThem.filter((a) => a.address !== ethers.constants.AddressZero)

    const yourDeposits = new Set(this.props.yourDeposited.map((a) => a.address + a.id))
    const theirDeposits = new Set(this.props.theirDeposited.map((a) => a.address + a.id))

    return {
      yourApprovals: new Set(), // this is built in componentDidMount
      yourDeposits: yourDeposits,
      theirDeposits: theirDeposits,
      assetsYou: allYou,
      assetsThem: allThem
    }
  }

  get yourContracts () {
    return Array.from(new Set(this.props.yourUndeposited.map(a => a.address)))
  }

  registerContractEvents () {
    // on Approval
    this.yourContracts.forEach((c) => {
      const contract = new ethers.Contract(c, Config.erc721Abi, this.context.signer)
      contract.on('Approval', (owner, approve, id) => {
        if (this.state.yourApprovals.has(c + id)) {
          return
        }

        this.setState((state) => {
          state.yourApprovals.add(c + id)
          state.beingApproved.delete(c + id)
          return {
            yourApprovals: state.yourApprovals,
            beingApproved: state.beingApproved
          }
        })

        toast({
          description: 'Approved for NFTSwap',
          ...successToast
        })
      })
    })

    this.context.nftSwap.on('Deposited', (by, address, id) => {
      console.log(by)
      console.log(address)
      console.log(id)
      const asset = {
        address,
        id
      }

      this.setState((state) => {
        state.yourDeposits.add(asset.address + asset.id)
        state.beingDeposited.delete(asset.address + asset.id)
        return {
          yourDeposits: state.yourDeposits,
          beingDeposited: state.beingWithdrawn
        }
      })

      toast({
        description: 'Deposited to NFTSwap',
        ...successToast
      })

      this.ifFullyDepositedProgressToWithdraw(asset)
    })

    this.context.nftSwap.on('Withdrawn', (by, address, id) => {
      this.setState((state) => {
        state.yourDeposits.delete(address + id)
        state.yourApprovals.delete(address + id)
        state.beingWithdrawn.delete(address + id)
        return {
          yourDeposits: state.yourDeposits,
          yourApprovals: state.yourApprovals,
          beingWithdrawn: state.beingWithdrawn
        }
      })

      toast({
        description: 'Withdrawn from NFTSwap',
        ...successToast
      })
    })
  }

  unregisterContractEvents () {
    this.yourContracts.forEach((c) => {
      const contract = new ethers.Contract(c, Config.erc721Abi, this.context.signer)
      contract.removeAllListeners()
    })
  }

  async componentDidMount () {
    this.ifFullyDepositedProgressToWithdraw()
    this.registerContractEvents()

    const assets = this.props.yourUndeposited
    for (let i = 0; i < assets.length; i++) {
      const contract =
        new ethers.Contract(assets[i].address, Config.erc721Abi, this.context.signer)
      const approved =
        (await contract.getApproved(assets[i].id)).toLowerCase() === Config.contractAddress
      if (approved) {
        this.setState({
          yourApprovals: this.state.yourApprovals.add(assets[i].address + assets[i].id)
        })
      }
    }
  }

  componentWillUnmount () {
    this.unregisterContractEvents()
  }

  ifFullyDepositedProgressToWithdraw (asset) {
    console.log(asset)
    console.log(this.state)
    const theyAreFullyDeposited =
      this.state.theirDeposits.size === this.state.assetsThem.length

    // if (asset !== undefined &&
    //   this.state.yourDeposits.has(asset.address + asset.id)) {
    //   return
    // }

    const youAreFullyDeposited =
      this.state.yourDeposits.size === this.state.assetsYou.length
    // const youAreDepositingFinalAsset =
    //   this.state.yourDeposits.size === this.state.assetsYou.length - 1 &&
    //   asset !== undefined
    // const youAreFullyDeposited =
    //   youAreAlreadyFullyDeposited || youAreDepositingFinalAsset

    console.log('before if')
    if (youAreFullyDeposited && theyAreFullyDeposited) {
      console.log('in if')
      this.props.proceedToWithdraw()
    }
  }

  async txCount () {
    return await this.context.signer.getTransactionCount()
  }

  async approve (asset) {
    this.setState((state) => {
      state.beingApproved.set(asset.address + asset.id, true)
      return {
        beingApproved: state.beingApproved
      }
    })

    try {
      console.log(`transactionCount: ${await this.txCount()}`)
      const assetContract =
        new ethers.Contract(asset.address, Config.erc721Abi, this.context.signer)
      await assetContract.approve(Config.contractAddress, asset.id)
    } catch (error) {
      handleError(error)
      this.setState((state) => {
        state.beingApproved.delete(asset.address + asset.id)
        return {
          beingApproved: state.beingApproved
        }
      })
    }
  }

  async deposit (asset) {
    this.setState((state) => {
      state.beingDeposited.set(asset.address + asset.id, true)
      return {
        beingDeposited: state.beingDeposited
      }
    })

    try {
      console.log(`transactionCount: ${await this.txCount()}`)
      await this.context.nftSwap.deposit(asset.address, asset.id)
    } catch (error) {
      handleError(error)
      this.setState((state) => {
        state.beingDeposited.delete(asset.address + asset.id)
        return {
          beingDeposited: state.beingDeposited
        }
      })
    }
  }

  async withdraw (asset) {
    this.setState((state) => {
      state.beingWithdrawn.set(asset.address + asset.id, true)
      return {
        beingWithdrawn: state.beingWithdrawn
      }
    })

    try {
      console.log(`transactionCount: ${await this.txCount()}`)
      await this.context.nftSwap.withdraw(asset.address, asset.id)
    } catch (error) {
      handleError(error)
      this.setState((state) => {
        state.beingWithdrawn.delete(asset.address + asset.id)
        return {
          beingWithdrawn: state.beingWithdrawn
        }
      })
    }
  }

  isApproved (asset) {
    return this.state.yourApprovals.has(asset.address + asset.id)
  }

  isDeposited (asset) {
    return this.state.yourDeposits.has(asset.address + asset.id)
  }

  theyDeposited (asset) {
    return this.state.theirDeposits.has(asset.address + asset.id)
  }

  optionsYou (asset) {
    const beingWithdrawn = this.state.beingWithdrawn.has(asset.address + asset.id)
    const beingDeposited = this.state.beingDeposited.has(asset.address + asset.id)
    const beingApproved = this.state.beingApproved.has(asset.address + asset.id)
    const isLoading = beingWithdrawn || beingDeposited || beingApproved

    const approve = <Button
      isLoading={beingApproved}
      isDisabled={this.state.theyCancelled}
      loadingText='Approve'
      onClick={() => this.approve(asset)}>Approve</Button>

    const deposit = <Button
      isLoading={beingDeposited}
      isDisabled={this.state.theyCancelled}
      loadingText='Deposit'
      onClick={() => this.deposit(asset)}>Deposit</Button>

    const withdraw = <Button
      isLoading={beingWithdrawn}
      loadingText='Withdraw'
      onClick={() => this.withdraw(asset)}>Withdraw</Button>

    // there is some race condition happening here when rapidly clicking
    // buttons. but it should be rare when using the app normally.
    // is fixed by refreshing
    //
    // approve works
    // deposit works
    // withdrawn causes deposit loading button and then goes to approve

    if (isLoading) {
      if (beingApproved) {
        return approve
      } else if (beingDeposited) {
        return deposit
      } else if (beingWithdrawn) {
        return withdraw
      }
    } else {
      if (!this.isApproved(asset) && !this.isDeposited(asset)) {
        return approve
      } else if (this.isApproved(asset) && !this.isDeposited(asset)) {
        return deposit
      } else if (this.isDeposited(asset)) {
        return withdraw
      }
    }

    return <Box>
      This is an error. Please reach out to @__willharrison on Twitter or file a ticket on Github.
    </Box>
  }

  optionsThem (asset) {
    let text = <TimeIcon color='yellow.500' />
    if (this.theyDeposited(asset)) {
      text = <CheckCircleIcon color='green' />
    }

    return <Box>{text}</Box>
  }

  assetDepositManager (assets, options) {
    const etherscanPrefix = 'https://etherscan.io/token/'

    const elements = []
    const boundOptions = options.bind(this)
    for (let i = 0; i < assets.length; i++) {
      elements.push(
        <Tr key={i}>
          <Td>
            <Link color='teal.500' href={etherscanPrefix + assets[i].address} isExternal>
              {minifyAddress(assets[i].address)}
            </Link>
          </Td>
          <Td>
            {assets[i].id}
          </Td>
          <Td textAlign='center'>
            {boundOptions(assets[i])}
          </Td>
        </Tr>
      )
    }

    return (
      <Box p='.5em' border='1px' borderRadius='md' borderColor='gray.200'>
        <Table size='md'>
          <Thead>
            <Tr>
              <Th>
                Contract Address
              </Th>
              <Th width='8em'>
                NFT ID
              </Th>
              <Th textAlign='center' width='20em'>
                Options
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {elements}
          </Tbody>
        </Table>
      </Box>
    )
  }

  async cancelSwap () {
    this.setState({
      cancelled: true
    })

    const err = await this.props.cancel()
    if (err) {
      this.setState({
        cancelled: false
      })
    }
  }

  render () {
    const cancelButton = (() => {
      if (this.state.yourDeposits.size > 0) {
        return (
          <ButtonGroup>
            <Button isDisabled>Cancel</Button>
            <Popover>
              <PopoverTrigger>
                <Button variant='outline' border='0'><InfoOutlineIcon /></Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight='bold'>Unable to Cancel</PopoverHeader>
                <PopoverBody>
                  If you have deposited an NFT, the ability to cancel is revoked.
                  Withdraw all NFTs first.
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
        )
      } else {
        return <Button
          isLoading={this.state.cancelled}
          loadingText='Cancelling'
          onClick={async () => await this.cancelSwap()}>Cancel</Button>
      }
    })()

    const theirAssetManager = () => {
      if (this.state.theyCancelled) {
        return (
          <Box border='1px' borderColor='gray.200' p='.5em' borderRadius='md'>
            <Alert status='error'>
              <AlertIcon />
              <AlertDescription>
                This swap has been cancelled on their side. Please withdraw
                any NFTs that you have deposited and click cancel.
              </AlertDescription>
            </Alert>
          </Box>
        )
      }

      return this.assetDepositManager(this.state.assetsThem, this.optionsThem)
    }

    return (
      <Box>
        <Box>
          <Heading mt='.5em' mb='.5em' size='md'>Your assets</Heading>
           {this.assetDepositManager(this.state.assetsYou, this.optionsYou)}
        </Box>
        <Box>
          <Heading mt='.5em' mb='.5em' size='md'>Their assets</Heading>
            {theirAssetManager()}
        </Box>
        <Center m='1em'>
          {cancelButton}
        </Center>
      </Box>
    )
  }
}

Deposit.propTypes = {
  yourUndeposited: PropTypes.array,
  yourDeposited: PropTypes.array,
  theirUndeposited: PropTypes.array,
  theirDeposited: PropTypes.array,
  proceedToWithdraw: PropTypes.func,
  cancel: PropTypes.func,
  theyCancelled: PropTypes.bool
}
