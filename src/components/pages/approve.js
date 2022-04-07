import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Box, Center, Button, Input, AlertIcon, Alert, AlertDescription, AlertTitle } from '@chakra-ui/react'
import { ConnectionContext } from '../../contexts'
import { ethers } from 'ethers'

export default class Approve extends React.Component {
  static contextType = ConnectionContext

  constructor (props) {
    super(props)
    this.state = {
      targetAddress: null,
      targetIsValid: false,
      approvalAttempted: false,
      approvalSuccess: false
    }
  }

  get loading () {
    return this.state.loading
  }

  set loading (status) {
    this.setState({
      loading: status
    })
  }

  async approve () {
    this.setState({ approvalAttempted: true })

    if (this.state.addressIsValid) {
      this.loading = true
      const err = await this.props.approve(this.state.address)
      if (err) {
        this.loading = false
      }
    }
  }

  checkValidAddress (e) {
    const addressIsValid = ethers.utils.isAddress(e.target.value) &&
      this.context.signerAddress !== e.target.value

    this.setState({
      address: e.target.value,
      addressIsValid: addressIsValid
    })
  }

  render () {
    let validationMessage = ''
    if (this.state.approvalAttempted) {
      if (!this.state.addressIsValid) {
        validationMessage = (
          <Alert status="error" mb=".5em" mt='.5em'>
            <AlertIcon/>
            <AlertTitle>Invalid Address</AlertTitle>
            <AlertDescription>
              Please check that the address is formatted correctly.
            </AlertDescription>
          </Alert>
        )
      }
    }

    return (
      <Center>
        <Flex direction="column" width="100%">
          <Box mt='.5em' mb='.5em'>
            Input the Ethereum address that you want to swap NFTs with. After
            approving an address to swap with, you will be able to flesh out the
            details of the swap, but until the other user also approves you,
            you will not be able to create the swap. <strong>Do not bother
            approving an address that you do not know, it will never be approved
            on the other end.</strong>
          </Box>
          <Box width="100%">
            <Input
              onChange={(e) => this.checkValidAddress(e)}
              disabled={this.state.loading}
              placeholder="0x..."/>
          </Box>
          {validationMessage}
          <Center>
            {React.createElement(
              Button,
              {
                onClick: () => this.approve(),
                colorScheme: 'blue',
                variant: 'outline',
                width: '10em',
                mt: '1em',
                loadingText: 'Approving',
                isLoading: this.state.loading
              },
              'Approve'
            )}
          </Center>
        </Flex>
      </Center>
    )
  }
}

Approve.propTypes = {
  approve: PropTypes.func
}
