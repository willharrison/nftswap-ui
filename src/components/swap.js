/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React from 'react'
import PropTypes from 'prop-types'
import Approve from './pages/approve'
import Create from './pages/create'
import Deposit from './pages/deposit'
import Withdraw from './pages/withdraw'
import {
  Box,
  Center,
  CircularProgress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack, Text
} from '@chakra-ui/react'
import { ConnectionContext } from '../contexts'
// eslint-disable-next-line no-unused-vars
import { ethers } from 'ethers'
import { toast } from '../app'
import { errorToast, successToast } from '../ui'
import { formatRpcAssetsForUI } from '../utils/formatters'
import { handleError } from '../utils/errors'
import Config from '../config'
import { CheckIcon } from '@chakra-ui/icons'

const pages = {
  error: 'error',
  loading: 'loading',
  connect: 'connect',
  approve: 'approve',
  create: 'create',
  deposit: 'deposit',
  withdraw: 'withdraw'
}

function Error (props) {
  return (
    <Center height='10em'>
      Connect your wallet to swap.
    </Center>
  )
}

function Loading (props) {
  return (
    <Center height='10em'>
      <CircularProgress isIndeterminate color="teal.400" />
    </Center>
  )
}

// alice: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// bob: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export default class Swap extends React.Component {
  static contextType = ConnectionContext

  constructor (props) {
    super(props)
    this.state = {
      page: pages.loading
    }
  }

  get page () {
    return this.state.page
  }

  set page (page) {
    this.setState({
      page: page
    })
  }

  toastAndContinue (message, nextPage) {
    toast({
      description: message,
      ...successToast
    })

    this.page = nextPage
  }

  registerContractEvents () {
    if (!this.context.nftSwap) {
      return
    }

    // used for testing so that I have their addresses on hand in the console
    // window.alice = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    // window.bob = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

    this.context.nftSwap.on('Approved', async (by, target) => {
      const targetAgreement = await this.context.nftSwap.agreement(target)
      toast({
        description: 'Approved',
        ...successToast
      })

      this.setState({
        page: pages.create,
        target: target,
        fullyApproved: targetAgreement !== ethers.constants.AddressZero
      })
    })

    this.context.nftSwap.on('Cancelled', (by) => {
      this.toastAndContinue('Cancelled', pages.approve)
    })

    this.context.nftSwap.on('Created', (by, target) => {
      // todo move this somewhere common, we also do it in create.js
      window.localStorage.removeItem('swapCreationYourAssets')
      window.localStorage.removeItem('swapCreationTheirAssets')

      toast({
        description: 'Created',
        ...successToast
      })

      this.setState({
        page: pages.deposit,
        target: target
      })
    })
  }

  async loadContractState () {
    const emptyDeposit = {
      you: [],
      them: []
    }

    const state = {
      page: pages.loading,
      deposited: {
        ...emptyDeposit
      },
      undeposited: {
        ...emptyDeposit
      }
    }

    if (!this.context.signer) {
      state.page = pages.error
      return
    }

    state.page = pages.approve

    try {
      const agreement =
        await this.context.nftSwap.agreement(this.context.signerAddress)
      const assetManagementIsSetUp =
        await this.context.nftSwap.assetManagementIsSetUp(this.context.signerAddress)
      const swapsCanBeWithdrawn =
        await this.context.nftSwap.swapsCanBeWithdrawn()

      // used for debugging
      if (!window.context) {
        window.context = this.context
      }

      if (swapsCanBeWithdrawn) {
        const ourManagedAssets =
          await this.context.nftSwap['listManagedAssets()']()

        state.page = pages.withdraw
        state.deposited = {
          them: formatRpcAssetsForUI(ourManagedAssets)
        }
      } else if (assetManagementIsSetUp) {
        const ourUnmanagedAssets =
          await this.context.nftSwap['listUnmanagedAssets()']()
        const theirUnmanagedAssets =
          await this.context.nftSwap['listUnmanagedAssets(address)'](agreement)
        const ourManagedAssets =
          await this.context.nftSwap['listManagedAssets()']()
        const theirManagedAssets =
          await this.context.nftSwap['listManagedAssets(address)'](agreement)
        const theirAssetManagementIsSetUp =
          await this.context.nftSwap.assetManagementIsSetUp(agreement)

        if (!theirAssetManagementIsSetUp) {
          state.theyCancelled = true
        }

        state.page = pages.deposit
        state.undeposited = {
          you: formatRpcAssetsForUI(ourUnmanagedAssets),
          them: formatRpcAssetsForUI(theirUnmanagedAssets)
        }
        state.deposited = {
          you: formatRpcAssetsForUI(ourManagedAssets),
          them: formatRpcAssetsForUI(theirManagedAssets)
        }
      } else {
        let agreement2 = ethers.constants.AddressZero
        if (agreement !== ethers.constants.AddressZero) {
          agreement2 = await this.context.nftSwap.agreement(agreement)
          state.page = pages.create
          state.target = agreement
        }

        if (agreement2 === this.context.signerAddress) {
          state.fullyApproved = true
        }
      }
    } catch (error) {
      handleError(error)
    }

    this.setState({
      ...state
    })
  }

  async componentDidMount () {
    this.registerContractEvents()
    await this.loadContractState()
  }

  async txCount () {
    return await this.context.signer.getTransactionCount()
  }

  async approve (target) {
    try {
      console.log(`transactionCount: ${await this.txCount()}`)
      await this.context.nftSwap.approve(target)
    } catch (error) {
      handleError(error)
      return error
    }
  }

  async cancel () {
    try {
      console.log(`transactionCount: ${await this.txCount()}`)
      await this.context.nftSwap.cancel()
    } catch (error) {
      handleError(error)
      return error
    }
  }

  async create (assetsYou, assetsThem) {
    try {
      const params = [
        assetsYou.map(a => a.address),
        assetsYou.map(a => a.id),
        assetsThem.map(a => a.address),
        assetsThem.map(a => a.id)
      ]

      console.log(`transactionCount: ${await this.txCount()}`)
      await this.context.nftSwap.create(...params)
      this.setState({
        undeposited: {
          you: assetsYou,
          them: assetsThem
        }
      })
    } catch (error) {
      handleError(error)
      return error
    }
  }

  proceedToWithdraw () {
    console.log('proceedToWithdraw')
    this.toastAndContinue('Fully deposited', pages.withdraw)
  }

  withdrawComplete () {
    toast({
      description: 'Thanks for using NftSwap!',
      ...successToast
    })

    this.setState({
      page: pages.approve,
      deposited: false,
      approved: false,
      created: false
    })
  }

  render () {
    const wrap = (element) => {
      const progressTextCss = {
        width: '100%',
        textAlign: 'center'
      }

      const boldTextByPage = (pageRequiredForBold) => {
        if (this.state.page === pageRequiredForBold) {
          return {
            fontWeight: 'bold'
          }
        } else {
          return {
            color: 'gray.400'
          }
        }
      }

      let sliderSpot = 0
      switch (this.state.page) {
        case pages.approve:
          sliderSpot = 0
          break
        case pages.create:
          sliderSpot = 25
          break
        case pages.deposit:
          sliderSpot = 50
          break
        case pages.withdraw:
          sliderSpot = 75
          break
      }

      return (
        <Box mt='.5em'>
          <Stack direction='row' width='100%' align='stretch' zIndex='10'>
            <Text {...progressTextCss} {...boldTextByPage(pages.approve)}>Approve Target</Text>
            <Text {...progressTextCss} {...boldTextByPage(pages.create)}>Create Swap</Text>
            <Text {...progressTextCss} {...boldTextByPage(pages.deposit)}>Deposit Assets</Text>
            <Text {...progressTextCss} {...boldTextByPage(pages.withdraw)}>Withdraw New Assets</Text>
          </Stack>
          <Slider
            isDisabled={true}
            aria-label="slider-ex-4"
            value={sliderSpot}>
            <SliderTrack bg="gray.100">
              <SliderFilledTrack bg="teal.400" />
            </SliderTrack>
          </Slider>
          {element}
        </Box>
      )
    }

    switch (this.state.page) {
      case pages.loading:
        return wrap(<Loading />)
      case pages.approve:
        return wrap(<Approve approve={(target) => this.approve(target)} />)
      case pages.create:
        return wrap(<Create target={this.state.target}
          fullyApproved={this.state.fullyApproved}
          create={(assetsYou, assetsThem) => this.create(assetsYou, assetsThem)}
          cancel={() => this.cancel()} />)
      case pages.deposit:
        return wrap(
          <Deposit yourUndeposited={this.state.undeposited.you}
                   theirUndeposited={this.state.undeposited.them}
                   yourDeposited={this.state.deposited.you}
                   theirDeposited={this.state.deposited.them}
                   cancel={() => this.cancel()}
                   proceedToWithdraw={() => this.proceedToWithdraw()}
                   theyCancelled={this.state.theyCancelled} />)
      case pages.withdraw:
        return wrap(
          <Withdraw assets={this.state.deposited.them}
            withdrawComplete={() => this.withdrawComplete()} />)
      default:
        return wrap(<Error />)
    }
  }
}
