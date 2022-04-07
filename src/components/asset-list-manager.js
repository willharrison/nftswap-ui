import React from 'react'
import PropTypes from 'prop-types'
import { CloseButton, Box, Flex, Button, Input } from '@chakra-ui/react'

export default function AssetListManager (props) {
  const elements = []
  let i = 0
  for (; i < props.assets.length; i++) {
    const tmp = i
    elements.push(
      <Flex direction="row" key={i} alignItems="center">
        <Input
          m=".2em"
          value={props.assets[i].address}
          placeholder={props.assets[i].address ? '' : '0x...'}
          onChange={(e) => props.update(tmp, e.target.value, props.assets[tmp].id)}/>
        <Input
          m=".2em"
          width="10em"
          value={props.assets[i].id}
          placeholder={props.assets[i].id ? '' : '1'}
          onChange={(e) => props.update(tmp, props.assets[tmp].address, e.target.value)}/>
        <CloseButton
          m=".2em"
          onClick={() => props.removeItem(tmp)}
          size="md"/>
      </Flex>
    )
  }

  return (
    <Box>
      {elements}
      <Flex justify="right" m=".2em">
        <Button onClick={() => props.addItem()}>Add Line</Button>
      </Flex>
    </Box>
  )
}

AssetListManager.propTypes = {
  addItem: PropTypes.func,
  assets: PropTypes.array,
  update: PropTypes.func,
  removeItem: PropTypes.func
}
