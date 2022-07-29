import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
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
    if (data.url.length === 0) {
      alert('Please enter a metadata URL')
      return
    }
    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )
      console.log(wallet.publicKey?.toBase58())
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

        <Button
          loading={loading}
          onClick={mintIt}
          className='btn btn-secondary'
        >
          mint
        </Button>
      </div>
    </>
  )
}

export default QuickMint
