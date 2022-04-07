import React from 'react'
import Swap from './components/swap'
import {
  Badge,
  Box,
  Button, Center, createStandaloneToast,
  Flex,
  Heading,
  Link, ListItem,
  Spacer, Stack,
  Tag,
  TagLabel,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  ChakraProvider, Alert, AlertIcon, AlertDescription, DrawerFooter, OrderedList
} from '@chakra-ui/react'
import { BrowserRouter, Route, Switch, Link as RouterLink } from 'react-router-dom'
import '@fontsource/ubuntu'
import '@fontsource/fredoka-one'
import '@fontsource/caveat'
import { ethers } from 'ethers'
import { ConnectionContext } from './contexts'
import { errorToast, theme } from './ui'
import { minifyAddress } from './utils/formatters'
import { HamburgerIcon } from '@chakra-ui/icons'
import Config from './config'
import './logo.css'

export const toast = createStandaloneToast({ theme: theme })

function Home (props) {
  return (
      <Stack>
        <Alert colorScheme='red'>
          <AlertIcon />
          <AlertDescription>
            This is an unaudited project and takes no responsibility for any
            loss of funds. Please do your due diligence and review the code.
          </AlertDescription>
        </Alert>
        <Box>
          <Heading size='md' mb='.2em'>What is NftSwap?</Heading>
          NftSwap is a decentralized application for swapping ERC-721
          tokens with another user on the Ethereum blockchain. This UI is not required
          to interact with the NftSwap Protocol, but is provided as a convenience.

          <Box>
            Since it relies on no central entity, no user can ever be denied swapping.
          </Box>

        </Box>
        <Box>
          <Heading size='md' mb='.2em'>How does it work?</Heading>
          <OrderedList>
            <ListItem>
              <strong>Decide who to swap with.</strong> First you approve an address that you want to swap with. The
              swap cannot be created until both addresses have approved each other.
            </ListItem>
            <ListItem>
              <strong>Create the swap contract.</strong> After approval is complete, one of the users will create the
              swap contract, which will define what is being traded for what. This
              can be created by either user and which ever user clicks create first
              will be the one who creates the swap.
            </ListItem>
            <ListItem>
              <strong>Deposit your assets.</strong> Once the swap is created, each user can begin depositing assets to
              NftSwap. Assets can be withdrawn and the process can be cancelled,
              until all assets have been deposited on both sides.
            </ListItem>
            <ListItem>
              <strong>Withdraw your new assets.</strong> At this point the swap
              is complete and you can withdraw the assets that your swap target
              has deposited.
            </ListItem>
          </OrderedList>
        </Box>
        {/* <Box> */}
        {/*  <Heading size='md'>Relevant links</Heading> */}
        {/*  <UnorderedList> */}
        {/*    <ListItem>NftSwap Protocol Github</ListItem> */}
        {/*    <ListItem>NftSwap UI Github</ListItem> */}
        {/*    <ListItem>Deployed Contract</ListItem> */}
        {/*  </UnorderedList> */}
        {/* </Box> */}
      </Stack>
  )
}

export class App extends React.Component {
  static contextType = ConnectionContext

  constructor () {
    super()
    this.state = {
      networkName: Config.environmentLabel
    }
  }

  async connect () {
    this.setState({
      connecting: true
    })

    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    try {
      await provider.send('eth_requestAccounts', [])
      window.location.reload()
    } catch (error) {
      this.setState({
        connecting: false
      })
      toast({
        description: error.message,
        ...errorToast
      })
    }
  }

  closeDrawer () {
    this.setState({
      drawerIsOpen: false
    })
  }

  openDrawer () {
    this.setState({
      drawerIsOpen: true
    })
  }

  render () {
    const zapperAccountPrefix = 'https://zapper.fi/account/'
    const style = {
      usableWidth: ['100%', '29em', '48em', '55em']
    }

    return (
        <ChakraProvider theme={theme}>
          <BrowserRouter>
            <Flex direction="column"
                  backgroundColor={'white'}
                  width="100%"
                  align="center"
                  height="98vh">
              <Flex width="100%"
                    position={['fixed', 'revert']}
                    zIndex={2}
                    backgroundColor={'white'}
                    borderBottom="1px"
                    justifyContent="center"
                    p=".5em"
                    borderColor="gray.200">
                <Stack
                    alignItems="center"
                    width={style.usableWidth}
                    direction={'row'}>
                  <Box
                    height='120px'>
                    <RouterLink to='/'>
                        <h1 className="title">
                          <span className="metal raise">NFT</span>
                        </h1>
                        <h2 className="subtitle">swap</h2>
                    </RouterLink>
                  </Box>
                  <Spacer/>
                  <Stack direction='row' alignItems='center' display={['none', 'none', 'inherit']}>
                    <Box>
                      <Center>
                        <Badge colorScheme='teal'>
                          {this.state.networkName}
                        </Badge>
                      </Center>
                    </Box>
                    {this.context.signer
                      ? <Stack direction='row'>
                          <Tag colorScheme="white" size="lg" variant="outline">
                            <TagLabel fontWeight="bold">🔗&nbsp;&nbsp;
                              <Link isExternal href={zapperAccountPrefix + this.state.signerAddress}>
                                {minifyAddress(this.context.signerAddress)}
                              </Link>
                            </TagLabel>
                          </Tag>
                          <RouterLink to='/swap'>
                            <Button size='sm' variant='outline'>
                              Swap
                            </Button>
                          </RouterLink>
                        </Stack>
                      : <Button
                            size="sm"
                            isLoading={this.state.connecting}
                            // loadingText="Connecting"
                            onClick={() => this.connect()}>Connect</Button>
                    }
                  </Stack>
                  <Box>
                    <Button
                      variant='outline'
                      onClick={() => this.openDrawer()}
                      display={['inherit', 'inherit', 'none']}>
                      <HamburgerIcon />
                    </Button>
                    <Drawer
                      isOpen={this.state.drawerIsOpen}
                      placement="right"
                      onClose={() => this.closeDrawer()}
                    >
                      <DrawerOverlay />
                      <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader>
                          Menu
                        </DrawerHeader>
                        <DrawerBody>
                          {this.context.signer
                            ? <RouterLink to='/swap'>
                                <Button size='sm' variant='outline' width='100%' onClick={() => this.closeDrawer()}>
                                  Swap
                                </Button>
                              </RouterLink>
                            : <Button
                              width='100%'
                              size="sm"
                              isLoading={this.state.connecting}
                              loadingText="Connecting"
                              onClick={() => this.connect()}>Connect</Button>
                          }
                        </DrawerBody>

                        <DrawerFooter>
                          <Stack direction='column'>
                            <Box>
                              <Center>
                                <Badge colorScheme='teal'>
                                  {this.state.networkName}
                                </Badge>
                              </Center>
                            </Box>
                            <Link color='teal.400' isExternal href={zapperAccountPrefix + this.state.signerAddress}>
                              {this.context.signer
                                ? minifyAddress(this.context.signerAddress)
                                : ''
                              }
                            </Link>
                          </Stack>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </Box>
                </Stack>
              </Flex>
              <Box
                  mt={['8em', '.7em', '.2em']}
                  p={['1em', '.1em']}
                  flex="1 0 auto"
                  width={style.usableWidth}>
                <Switch>
                  <Route path="/swap">
                    <Swap />
                  </Route>
                  <Route path="/">
                    <Home />
                  </Route>
                </Switch>
              </Box>
              <Flex width="100%" mt=".5em" pt=".5em" justifyContent="center">
                <Stack direction='column'>
                  <Box textAlign='center'>
                    All support requests&nbsp;<Link color="teal.500" isExternal
                                                    href="https://twitter.com/__willharrison">@__willharrison</Link>.
                  </Box>
                  <Box textAlign='center'>
                    Logo styling by <Link color='teal.500' isExternal href='https://twitter.com/juhanakristian'>@juhanakristian</Link>.
                  </Box>
                  <Box>
                    &nbsp;
                  </Box>
                </Stack>
              </Flex>
            </Flex>
          </BrowserRouter>
        </ChakraProvider>
    )
  }
}
