import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import {
  Metaplex,
  walletAdapterIdentity,
  Nft,
  guestIdentity
} from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'
import { toast } from 'react-toastify'

const schema = {
  type: 'object',
  properties: {
    address: {
      type: 'string'
    }
  },
  required: ['address']
}

export const CandyMachineMints = () => {
  const initData = { address: '' }
  const connection = new Connection(
    'https://holaplex-main-9e4a.mainnet.rpcpool.com/a29b8b6c-bc0c-4c42-a440-705369384e1dx'
  )
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)
  const [foundMints, setFoundMints] = useState<any>()

  const mintIt = async () => {
    console.log(data)
    if (data.address == '') {
      alert('Please enter a candymachine address')
      return
    }

    setLoading(true)

    const metaplex = Metaplex.make(connection).use(guestIdentity())

    let nfts: any
    try {
      nfts = await metaplex
        .candyMachines()
        .findMintedNfts(new PublicKey(data.address))
        .run()
      setFoundMints(nfts)
      toast('Mints found')
    } catch (e) {
      toast('couldnt load nfts from CM')
      setLoading(false)
    }
    toast('Creating File')
    const element = document.createElement('a')

    let file

    file = new Blob(
      [JSON.stringify(nfts.map((n: any) => n.mintAddress.toBase58()))],
      {
        type: 'text/json'
      }
    )

    element.href = URL.createObjectURL(file)
    element.download = data.address.toBase58() + '_mints.json'
    document.body.appendChild(element)
    element.click()

    setLoading(false)
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Candy Machine Mints - supply candy machine address</h2>
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
          Get Mints
        </Button>
      </div>
    </>
  )
}

export default CandyMachineMints
