import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './app'
import { getConnectionToEthereum } from './utils/ethers-helpers'
import { ConnectionContext } from './contexts'
import { theme } from './ui'
import { Alert, AlertIcon, ChakraProvider } from '@chakra-ui/react'

getConnectionToEthereum().then((c) => {
  ReactDOM.render(
    <ConnectionContext.Provider value={c}>
      <App/>
    </ConnectionContext.Provider>,
    document.getElementById('root')
  )
}).catch(() => {
  ReactDOM.render(
    <ChakraProvider theme={theme}>
      <Alert status='error'>
        <AlertIcon></AlertIcon>
        You must use a Metamask enabled browser to access this site.
      </Alert>
    </ChakraProvider>,
    document.getElementById('root')
  )
})
