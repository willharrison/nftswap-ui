import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Center,
  Link,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { minifyAddress } from '../../utils/formatters'
import { ConnectionContext } from '../../contexts'
import { handleError } from '../../utils/errors'

export default function Withdraw (props) {
  const { signer, nftSwap } = useContext(ConnectionContext)

  const [withdrawn, setWithdrawn] = useState(new Map())
  const [withdrawing, setWithdrawing] = useState(new Map())
  const withdraw = async (key) => {
    setWithdrawing(map => new Map(map.set(key.address + key.id, true)))
    try {
      const txCount = await signer.getTransactionCount()
      console.log(`transactionCount: ${txCount}`)
      await nftSwap.withdraw(key.address, key.id)
    } catch (error) {
      handleError(error)
      setWithdrawing(map => {
        map.delete(key.address + key.id)
        return new Map(map)
      })
    }
  }

  useEffect(() => {
    nftSwap.on('Withdrawn', (by, address, id) => {
      setWithdrawn(map => new Map(map.set(address + id)))
      setWithdrawing(map => {
        map.delete(address + id)
        return new Map(map)
      })

      if (props.assets.length === withdrawn.size) {
        props.withdrawComplete()
      }
    })
  }, [])

  const assetElements = props.assets.map((e, i) => {
    let options = <Button
      isLoading={withdrawing.has(e.address + e.id)}
      loadingText='Withdraw'
      onClick={() => withdraw(e)}>Withdraw</Button>
    if (withdrawn.has(e.address + e.id)) {
      options = <CheckCircleIcon color='green' />
    }

    const etherscanPrefix = 'https://etherscan.io/token/'
    return (
      <Tr key={i}>
        <Td>
          <Link color='teal.500' href={etherscanPrefix + e.address} isExternal>
            {minifyAddress(e.address)}
          </Link>
        </Td>
        <Td>
          {e.id}
        </Td>
        <Td width='15em' textAlign='center'>
          {options}
        </Td>
      </Tr>
    )
  })

  return (
    <Box>
      <Center height='5em'>
        Your NFTs are ready to be withdrawn. Thanks for using our service!
      </Center>
      <Box border='1px' borderColor='gray.200' p='.5em' borderRadius='md'>
      <Table size='md'>
        <Thead>
          <Tr>
            <Th>Contract Address</Th>
            <Th>NFT ID</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {assetElements}
        </Tbody>
      </Table>
      </Box>
    </Box>
  )
}

Withdraw.propTypes = {
  assets: PropTypes.array,
  withdrawComplete: PropTypes.func
}
