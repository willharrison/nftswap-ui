import React from 'react'
import PropTypes from 'prop-types'
import {
  Center,
  Text,
  Box,
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Table,
  Thead,
  Tr,
  Th,
  AlertIcon,
  AlertDescription,
  Alert,
  Heading, Tbody, Td, Link, AlertTitle, Tag, Flex, Tooltip
} from '@chakra-ui/react'
import AssetListManager from '../asset-list-manager'
import { ConnectionContext } from '../../contexts'
import { minifyAddress } from '../../utils/formatters'

const emptyLine = {
  address: '',
  id: undefined
}

export default class Create extends React.Component {
  static contextType = ConnectionContext

  constructor (props) {
    super(props)

    // this.updateItemYou = this.updateItemYou.bind(this)
    // this.updateItemThem = this.updateItemThem.bind(this)
    // this.addItemYou = this.addItemYou.bind(this)
    // this.addItemThem = this.addItemThem.bind(this)
    // this.removeItemYou = this.removeItemYou.bind(this)
    // this.removeItemThem = this.removeItemThem.bind(this)

    this.state = {
      assetsYou: [],
      assetsThem: []
    }
  }

  componentDidMount () {
    const savedYourAssets = window.localStorage.getItem('swapCreationYourAssets')
    const savedTheirAssets = window.localStorage.getItem('swapCreationTheirAssets')
    if (savedYourAssets && savedTheirAssets) {
      this.setState({
        assetsYou: JSON.parse(savedYourAssets),
        assetsThem: JSON.parse(savedTheirAssets)
      })
    }
  }

  clearLocalAssetState () {
    window.localStorage.removeItem('swapCreationYourAssets')
    window.localStorage.removeItem('swapCreationTheirAssets')
  }

  setAndPersistAssetStateLocally (state) {
    this.setState(state)
    window.localStorage.setItem('swapCreationYourAssets',
      JSON.stringify(this.state.assetsYou))
    window.localStorage.setItem('swapCreationTheirAssets',
      JSON.stringify(this.state.assetsThem))
  }

  updateItemYou (index, address, id) {
    const assets = this.state.assetsYou
    assets[index].address = address
    assets[index].id = id

    this.setAndPersistAssetStateLocally({
      assetsYou: assets
    })
  }

  updateItemThem (index, address, id) {
    const assets = this.state.assetsThem
    assets[index].address = address
    assets[index].id = id

    this.setAndPersistAssetStateLocally({
      assetsThem: assets
    })
  }

  addItemYou () {
    this.setAndPersistAssetStateLocally({
      assetsYou: this.state.assetsYou.concat({
        ...emptyLine
      })
    })
  }

  addItemThem () {
    this.setAndPersistAssetStateLocally({
      assetsThem: this.state.assetsThem.concat({
        ...emptyLine
      })
    })
  }

  removeItemYou (index) {
    const assets = this.state.assetsYou
    assets.splice(index, 1)
    this.setAndPersistAssetStateLocally({
      assetsYou: assets
    })
  }

  removeItemThem (index) {
    const assets = this.state.assetsThem
    assets.splice(index, 1)
    this.setAndPersistAssetStateLocally({
      assetsThem: assets
    })
  }

  requestCreation () {
    const filterAssetsYou = this.state.assetsYou.filter((e) => e.address && e.id)
    const filterAssetsThem = this.state.assetsThem.filter((e) => e.address && e.id)

    this.setState({
      createRequested: true,
      createConfirmed: false,
      assetsYou: filterAssetsYou,
      assetsThem: filterAssetsThem
    })
  }

  async confirmCreation () {
    this.setState({
      createConfirmed: true
    })

    const err = await this.props.create(
      this.state.assetsYou,
      this.state.assetsThem
    )

    if (err) {
      this.setState({
        createConfirmed: false
      })
    }
  }

  async cancelSwap () {
    this.setState({
      loadingCancel: true
    })

    const err = await this.props.cancel()
    if (err) {
      this.setState({
        loadingCancel: false
      })
    } else {
      this.clearLocalAssetState()
    }
  }

  render () {
    const etherscanPrefix = 'https://etherscan.io/token/'

    const modalAssetTable = (assets) => {
      const rows = assets.map((e, i) => {
        return (
          <Tr key={i}>
            <Td>
              <Link color='teal.500' isExternal href={etherscanPrefix + e.address}>
                {minifyAddress(e.address)}
              </Link>
            </Td>
            <Td>{e.id}</Td>
          </Tr>
        )
      })

      return (
        <Box border='1px' borderColor='gray.200' borderRadius='md' p='.5em'>
          <Table size='sm'>
            <Thead>
              <Tr>
                <Th>Contract Address</Th>
                <Th>NFT ID</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows}
            </Tbody>
          </Table>
        </Box>
      )
    }

    return (
      <Box>
        <Modal isOpen={this.state.createRequested}
               onClose={() => {
                 this.setState({
                   createRequested: false
                 })
               }}>
          <ModalOverlay/>
          <ModalContent>
            <ModalHeader>Verify This Swap</ModalHeader>
            <ModalCloseButton/>
            <ModalBody>
              <Alert status='info'>
                <AlertIcon/>
                <AlertDescription>
                  Make sure these assets look OK before creating the swap.
                </AlertDescription>
              </Alert>
              <Box marginTop='.5em'>
                <Heading size='md' marginBottom='.5em'>Your assets</Heading>
                {modalAssetTable(this.state.assetsYou)}
                <Heading size='md' marginBottom='.5em' marginTop='.5em'>Their assets</Heading>
                {modalAssetTable(this.state.assetsThem)}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={() => this.confirmCreation()}
                isLoading={this.state.createConfirmed}
                loadingText='Creating'
                colorScheme='blue'
                variant='outline'>Confirm</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Box mt='.5em' mb='.5em'>
          Input the contract addresses with corresponding IDs that you want to trade
          and what you want to trade for. After the swap is created, it cannot be edited.
          If you want to edit the swap you will need to cancel and create a new one,
          which requires gaining approval again.
          <p>
            Click &quot;Add Line&quot; to start adding NFTs to your swap.
          </p>
        </Box>
        <Text fontSize="lg" fontWeight="bold">You</Text>
        <AssetListManager
          assets={this.state.assetsYou}
          update={(i, addr, id) => this.updateItemYou(i, addr, id)}
          addItem={() => this.addItemYou()}
          removeItem={(i) => this.removeItemYou(i)}/>
        <Flex alignItems='flex-end'>
          <Link href={'https://etherscan.io/address/' + this.props.target} fontSize="lg" fontWeight="bold">{minifyAddress(this.props.target)}</Link>
          <Box>
            <Tooltip label='Both parties must approve of each other before creating a swap. Refresh to update.'>
              {
                this.props.fullyApproved
                  ? <Tag colorScheme='green' size='sm' ml='.5em'>Approved</Tag>
                  : <Tag colorScheme='red' size='sm' ml='.5em'>Has not approved yet</Tag>
              }
            </Tooltip>
          </Box>
        </Flex>
        <AssetListManager
          assets={this.state.assetsThem}
          update={(i, addr, id) => this.updateItemThem(i, addr, id)}
          addItem={() => this.addItemThem()}
          removeItem={(i) => this.removeItemThem(i)}/>
        <Alert status="info" mb='.5em' mt='.5em' colorScheme='blue'>
          <AlertIcon />
          <AlertTitle mr={2}>Gas Is Expensive!</AlertTitle>
          <AlertDescription>
            The more NFTs that are being traded the more costly the transaction.
          </AlertDescription>
        </Alert>
        <Center>
          <ButtonGroup>
            <Button
              onClick={() => this.requestCreation()}
              colorScheme="blue"
              isDisabled={this.state.loadingCancel || !this.props.fullyApproved}
              variant='outline'>Create</Button>
            <Button
              onClick={async () => await this.cancelSwap()}
              isLoading={this.state.loadingCancel}
              loadingText='Cancelling'
              variant='outline'>Cancel</Button>
          </ButtonGroup>
        </Center>
      </Box>
    )
  }
}

Create.propTypes = {
  create: PropTypes.func,
  cancel: PropTypes.func,
  target: PropTypes.string,
  fullyApproved: PropTypes.bool
}
