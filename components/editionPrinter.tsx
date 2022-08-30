import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import { gql } from '@apollo/client'
import client from '../client'
import { JsonForms } from '@jsonforms/react'
import { Nft } from '../types'
import * as ga from '../lib/ga'

export const EditionPrinter = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const initData = { destinationAddress: wallet.publicKey?.toBase58() }
  const [data, setData] = useState<any>(initData)
  const [nfts, setNfts] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [schema, setSchema] = useState<object>({})

  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, limit: $limit, offset: $offset) {
        address
        mintAddress
        name
        description
        image
        owner {
          address
          associatedTokenAccountAddress
        }
      }
    }
  `

  useMemo(() => {
    if (wallet.publicKey?.toBase58()) {
      client
        .query({
          query: GET_NFTS,
          variables: {
            owners: [wallet.publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => {
          var mapResult = res.data.nfts.map((n: Nft) => {
            return { const: n.mintAddress, title: n.name }
          }, {})
          setNfts(mapResult)
          setSchema({
            type: 'object',
            properties: {
              destinationAddress: {
                type: 'string'
              },
              nfts: {
                type: 'string',
                title: 'Nft',
                oneOf: mapResult
              },
              mintHash: {
                type: 'string'
              }
            },
            required: ['uri']
          })
          console.log(mapResult)
        })
    } else {
      setNfts([])
      setSchema({
        type: 'object',
        properties: {
          destinationAddress: {
            type: 'string'
          },
          nfts: {
            type: 'string',
            title: 'Nft',
            enum: []
          }
        },
        required: ['uri']
      })
    }
  }, [wallet, GET_NFTS])

  const printIt = async () => {
    console.log(data)
    if (data.mintHash == '' && data.nfts == '') {
      alert('mint hash needed')
      return
    }

    if (data.destinationAddress == ''){
      alert('destination address needed')
      return
    }

    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )

      const nftPk =
        (data.mintHash !== null && data.mintHash !== "")
          ? new PublicKey(data.nfts)
          : new PublicKey(data.mintHash)
      
      console.log("nft: ", nftPk.toBase58())
      const nft = await metaplex
        .nfts()
        .findByMint(nftPk)
        .run()
      console.log("logline")
      
      const owners = data.destinationAddress.split(',') ? data.destinationAddress.split(',') : data.destinationAddress
      console.log(owners)
      for (var i =0 ; i < owners.length; i++){
        const newOwner = new PublicKey(owners[i])
        await metaplex
        .nfts()
        .printNewEdition(nft, { newOwner })
        .run()
      }
        
      

      alert('done!')
      ga.event({action: 'edition_print',
      params: { mint: nftPk.toBase58() }})
    } catch (e: any) {
      alert('error')
      console.error(e.message)
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Edition Printer - Make prints from your Master Edition NFTs</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />

        <Button
          loading={loading}
          onClick={printIt}
          className='btn btn-secondary'
        >
          Print It
        </Button>
      </div>
    </>
  )
}

export default EditionPrinter
