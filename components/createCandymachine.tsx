import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js'
import {
  Metaplex,
  walletAdapterIdentity,
  CreateCandyMachineInput,
  sol,
  UsdCurrency
} from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import bn from 'bn.js'
import { JsonForms } from '@jsonforms/react'
import { BN } from '@project-serum/anchor'
import { NATIVE_MINT } from '@solana/spl-token'

const schema = {
  type: 'object',
  properties: {
    itemsAvailable: {
      type: 'integer'
    },
    sellerFeeBasisPoints: {
      type: 'integer'
    },
    price: {
      type: 'number'
    },
    tokenMint: {
      type: 'string'
    },
    symbol: {
      type: 'string'
    },
    retainAuthority: {
      type: 'boolean'
    },
    isMutable: {
      type: 'boolean'
    },
    hiddenSettings: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        uri: {
          type: 'string'
        }
      }
    },
    gatekeeper: {
      type: 'object',
      properties: {
        gatekeeperNetwork: {
          type: 'string'
        },
        expireOnUse: {
          type: 'boolean'
        }
      }
    },
    endsettings: {
      type: 'object',
      properties: {
        endSettingType: {
          type: 'string',
          enum: [
            "Date",
            "Amount"
          ],
          // need Amount or date object depending on emnum
        }
      }
    },
    whitelistMintSettings: {
      type: 'object',
      properties: {
        endSettingType: {
          type: 'string',
          enum: [
            "burnEveryTime",
            "neverBurn"
          ],
        },
        mint: {
          type: 'string'
        },
        presale: {
          type: 'boolean'
        },
        discountPrice: {
          type: 'number'
        }
      }
    }
  },
  required: ['uri']
}

const initData = {
  isMutable: true,
  retainAuthority: true,
  itemsAvailable: 100,
  price: 100,
  tokenMint: NATIVE_MINT.toBase58(),
  sellerFeeBasisPoints: 1000,
  symbol: "",
  gateKeeper: null,
}

export const CreateCandyMachine = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)

  const mintIt = async () => {
    setLoading(true)
    const metaplex = Metaplex.make(connection).use(
      walletAdapterIdentity(wallet)
    )
    console.log(wallet.publicKey?.toBase58())

    const input: CreateCandyMachineInput = {
      authority: wallet.publicKey!,
      //@ts-ignore
      itemsAvailable: new BN(0),
      price: sol(0.01),
      sellerFeeBasisPoints: 100,
      symbol: '',
      endSettings: null,
      gatekeeper: null,
      whitelistMintSettings: null,
      retainAuthority: false,
      isMutable: false,
      tokenMint: new PublicKey(''),
      wallet: new PublicKey(''),
      hiddenSettings: {
        name: '',
        uri: '',
        hash: new Array(32).fill(0)
      }
    }

    try {
      const cm = await metaplex
        .candyMachines()
        .create(input)
        .run()
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Create Candy Machine</h2>
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
          mint it
        </Button>
      </div>
    </>
  )
}

export default CreateCandyMachine
