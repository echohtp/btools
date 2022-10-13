import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity, toMetaplexFileFromBrowser } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'

const schema = {
  type: 'object',
  properties: {
    url: {
      type: 'string'
    }
  },
  required: ['uri']
}

export const QuickMint = () => {
  const initData = { url: '' }
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)

  const mintIt = async () => {
    console.log(data)
    //@ts-ignore
    const selectedFile = document.getElementById('jsonFile').files[0]
    console.log(selectedFile)
    if (data.url == undefined && selectedFile == undefined) {
      alert('Please enter a metadata source')
      return
    }

    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )
      console.log(wallet.publicKey?.toBase58())
      if (selectedFile) {
        console.log('gonna try and mint this file')
        console.log(selectedFile)
        const file = await toMetaplexFileFromBrowser(selectedFile)
        const json = JSON.parse(file.buffer.toString())
        const { uri, metadata } = await metaplex
        .nfts()
        .uploadMetadata(json)
        .run()
        console.log(json)
        try {
          const nft = await metaplex
            .nfts()
            .create({
              name: json.name,
              uri: uri,
              sellerFeeBasisPoints: json.seller_fee_basis_points,
              symbol: json.symbol
            })
            .run()
          console.log('minted!')
          console.log(nft)
        } catch (e) {
          console.log(e)
        }
        setLoading(false)
        
        
      } else {
        console.log('gonna try and mint this!')
        console.log(data.url)
        axios.get(data.url).then(async d => {
          try {
            const nft = await metaplex
              .nfts()
              .create({
                name: d.data.name,
                uri: data.url,
                sellerFeeBasisPoints: d.data.seller_fee_basis_points
              })
              .run()
            console.log('minted!')
            console.log(nft)
          } catch (e) {
            console.log(e)
          }
          setLoading(false)
        })
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Quick Mint - Supply URL to metaplex json to mint NFT</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />
        <input type='file' id='jsonFile' />
        <br/>
        <Button
          loading={loading}
          onClick={mintIt}
          className='btn btn-secondary'
        >
          mint it
        </Button>
        <br/>
        <small>Sample JSON Files: [<a href='imageNftMetadata.sample.json' target="_blank">Image</a>] [<a href='videoNftMetadata.sample.json' target="_blank">Video</a>]
        </small>
      </div>
    </>
  )
}

export default QuickMint
