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
import { toast } from 'react-toastify'

import {JsonViewer} from '@textea/json-viewer'


const schema = {
  type: 'object',
  properties: {
    wallet: {
      type: 'string'
    },
    goLiveDate: {
      type: "string",
      format: "date-time",
    },
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
    creators: {
      type: 'array',
      maxItems: 4,
      items: {
        types: 'object',
        properties: {
          address: {
            type: 'string'
          },
          share: {
            type: 'integer'
          }
        }
      }
    },
    hiddenSettings: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        uri: {
          type: 'string'
        },
        hash: {
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
    endSettings: {
      type: 'object',
      properties: {
        endSettingType: {
          type: 'string',
          enum: ['Date', 'Amount']
          // need Amount or date object depending on emnum
        },
        date: {
          type: 'string'
        },
        number: {
          type: 'integer'
        }
      }
    },
    whitelistMintSettings: {
      type: 'object',
      properties: {
        endSettingType: {
          type: 'string',
          enum: ['burnEveryTime', 'neverBurn']
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

const gateKeeperUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/gatekeeper/properties/gatekeeperNetwork',
      label: 'Gatekeeper Network'
    },
    {
      type: 'Control',
      scope: '#/properties/gatekeeper/properties/expireOnUse',
      label: 'Expire on use?'
    }
  ]
}

const whitelistMintUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/whitelistMintSettings/properties/endSettingType',
      label: 'End settings type'
    },
    {
      type: 'Control',
      scope: '#/properties/whitelistMintSettings/properties/mint',
      label: 'Mint Address'
    },
    {
      type: 'Control',
      scope: '#/properties/whitelistMintSettings/properties/presale',
      label: 'Presale?'
    },
    {
      type: 'Control',
      scope: '#/properties/whitelistMintSettings/properties/discountPrice',
      label: 'Discount Price?'
    }
  ]
}

const splTokenSettingsUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/tokenMint', // token mint
      label: 'SPL Token Address'
    },
    {
      type: 'Control',
      scope: '#/properties/wallet', // wallet ata
      label: 'Wallet Token Account'
    }//,
    // {
    //   type: 'Control',
    //   scope: '#/properties/hash', // wallet ata
    //   label: 'Hash (dont edit this unless you know what you\'re doing)'
    // }
  ]
}

const hiddenSettingsUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/hiddenSettings/properties/name',
      label: 'Name'
    },
    {
      type: 'Control',
      scope: '#/properties/hiddenSettings/properties/uri',
      label: 'Metadata URI'
    }
  ]
}

const endSettingsUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/endSettings/properties/endSettingType',
      label: 'End settings type'
    }
  ]
}

const endSettingsDateUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/endSettings/properties/endSettingType',
      label: 'End settings type'
    },
    {
      type: 'Control',
      scope: '#/properties/endSettings/properties/date',
      label: 'End when?'
    }
  ]
}

const endSettingsNumberUISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/endSettings/properties/endSettingType',
      label: 'End settings type'
    },
    {
      type: 'Control',
      scope: '#/properties/endSettings/properties/number',
      label: 'Stop a mint after how many mints?'
    }
  ]
}

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/price',
      label: 'price'
    },
    {
      type: 'Control',
      scope: '#/properties/itemsAvailable',
      label: 'How many?'
    },
    {
      type: 'Control',
      scope: '#/properties/symbol',
      label: 'symbol'
    },
    {
      type: 'Control',
      scope: '#/properties/sellerFeeBasisPoints',
      label: 'royalty percentage?'
    },
    {
      type: 'Control',
      scope: '#/properties/goLiveDate',
      label: 'start time?'
    },
    {
      type: 'Control',
      scope: '#/properties/creators',
      label: 'royalty split (max 4, share must add up to 100)'
    },
    {
      type: 'Control',
      scope: '#/properties/retainAuthority',
      label: 'retain auth (yes)?'
    },
    {
      type: 'Control',
      scope: '#/properties/isMutable',
      label: 'do you want to be able to update these nfts in future?'
    }
  ]
}

export const CreateCandyMachine = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()

  const initData = {
    wallet: wallet.publicKey?.toBase58(),
    isMutable: true,
    retainAuthority: true,
    itemsAvailable: 100,
    price: 100,
    tokenMint: NATIVE_MINT.toBase58(),
    sellerFeeBasisPoints: 1000,
    symbol: '',
    gateKeeper: null,
    goLiveDate: null,
    endSettings: null,
    creators: [
      { address: wallet.publicKey?.toBase58(), share: 100, verified: false }
    ]
  }

  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)
  const [step, setStep] = useState<number>(0)
  const [showSplTokenMint, setShowSplTokenMint] = useState<boolean>(false)
  const [showGateKeeper, setShowGateKeeper] = useState<boolean>(false)
  const [showHiddenSettings, setShowHiddenSettings] = useState<boolean>(false)
  const [showWhitelistMint, setShowWhitelistMint] = useState<boolean>(false)
  const [showEndSettings, setShowEndSettings] = useState<boolean>(false)
  const metaplex = Metaplex.make(connection).use(
    walletAdapterIdentity(wallet)
  )
  

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Create Candy Machine</h2>
        {step == 0 && (
          <>
            <JsonForms
              schema={schema}
              data={data}
              uischema={uiSchema}
              renderers={materialRenderers}
              cells={materialCells}
              onChange={({ errors, data }) => setData(data)}
            />
            <button
              className='btn btn-primary'
              onClick={() => {
                console.log(data)
                console.log(data.creators);
                
                let totalShares = 0 
                for(var i =0; i < data.creators.length; i ++){
                  totalShares += data.creators[i]['share']
                }
                console.log("total shares: ", totalShares)
                if (totalShares != 100){
                  toast("total shares need to equal 100")
                  return
                }

                if (data.price == null || data.price < 0) {
                  toast("set a price")
                  return
                }

                if(data.itemsAvailable == null || data.itemsAvailable < 0){
                  toast("set items")
                  return
                }

                if(data.goLiveDate == null){
                  toast("set time")
                  return
                }

                

                setStep(step + 1)
                let tmpD = data 
                tmpD.goLiveDate = new Date(data.goLiveDate).getTime()
                setData(tmpD)
              }}
            >
              Next
            </button>
          </>
        )}
        {step == 1 && (
          <>
            <div className='container'>
              <h2>Extras?</h2>
              <div className='grid grid-flow-row'>
                <div>
                  <input
                    type='checkbox'
                    id='splTokenMint'
                    name='splTokenMint'
                    value='true'
                    onChange={() => {
                      setShowSplTokenMint(!showSplTokenMint)
                      let tData = data
                      tData.wallet = wallet.publicKey?.toBase58()
                      tData.tokenMint = NATIVE_MINT.toBase58()
                      setData(tData)
                    }}
                  />
                  <label htmlFor='splTokenMint'>SPL Token Mint</label>
                  {showSplTokenMint && (
                    <div>
                      <JsonForms
                        schema={schema}
                        data={data}
                        uischema={splTokenSettingsUISchema}
                        renderers={materialRenderers}
                        cells={materialCells}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type='checkbox'
                    id='gateKeeper'
                    name='gateKeeper'
                    value='true'
                    onChange={() => {
                      setShowGateKeeper(!showGateKeeper)
                      let tData = data
                      tData.gateKeeper = null
                      setData(tData)
                    }}
                  />
                  <label htmlFor='gateKeeper'>Use Gatekeeper</label>
                  {showGateKeeper && (
                    <div>
                      <JsonForms
                        schema={schema}
                        data={data}
                        uischema={gateKeeperUISchema}
                        renderers={materialRenderers}
                        cells={materialCells}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type='checkbox'
                    id='whitelistMint'
                    name='whitelistMint'
                    value='true'
                    onChange={() => {
                      setShowWhitelistMint(!showWhitelistMint)
                      let tData = data
                      tData.whitelistMintSettings = null
                      setData(tData)
                    }}
                  />
                  <label htmlFor='whitelistMint'>Whitelist Mint</label>
                  {showWhitelistMint && (
                    <div>
                      <JsonForms
                        schema={schema}
                        data={data}
                        uischema={whitelistMintUISchema}
                        renderers={materialRenderers}
                        cells={materialCells}
                        onChange={({ errors, data }) => setData(data)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type='checkbox'
                    id='endSettings'
                    name='endSettings'
                    value='true'
                    onChange={() => {
                      console.log(data)
                      setShowEndSettings(!showEndSettings)
                      let tData = data
                      tData.endSettings = null
                      setData(tData)
                    }}
                  />

                  <label htmlFor='endSettings'>End Settings</label>
                  {showEndSettings && (
                    <div>
                      {!data.endSettings && (
                        <JsonForms
                          schema={schema}
                          data={data}
                          uischema={endSettingsUISchema}
                          renderers={materialRenderers}
                          cells={materialCells}
                          onChange={({ errors, data }) => setData(data)}
                        />
                      )}

                      {data.endSettings != 'null' &&
                        data.endSettings?.endSettingType == '' && (
                          <JsonForms
                            schema={schema}
                            data={data}
                            uischema={endSettingsUISchema}
                            renderers={materialRenderers}
                            cells={materialCells}
                            onChange={({ errors, data }) => {
                              setData(data)
                              console.log(data)
                            }}
                          />
                        )}
                      {data.endSettings != 'null' &&
                        data.endSettings?.endSettingType == 'Date' && (
                          <JsonForms
                            schema={schema}
                            data={data}
                            uischema={endSettingsDateUISchema}
                            renderers={materialRenderers}
                            cells={materialCells}
                            onChange={({ errors, data }) => setData(data)}
                          />
                        )}
                      {data.endSettings != 'null' &&
                        data.endSettings?.endSettingType == 'Amount' && (
                          <JsonForms
                            schema={schema}
                            data={data}
                            uischema={endSettingsDateUISchema}
                            renderers={materialRenderers}
                            cells={materialCells}
                            onChange={({ errors, data }) => setData(data)}
                          />
                        )}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type='checkbox'
                    id='hiddenSettings'
                    name='hiddenSettings'
                    value='true'
                    onChange={() => {
                      setShowHiddenSettings(!showHiddenSettings)
                      if(!showHiddenSettings){
                        let tData = data
                        tData.hiddenSettings = null
                        setData(tData)
                      }
                    }}
                  />
                  <label htmlFor='hiddenSettings'>Hidden Settings</label>
                  {showHiddenSettings && (
                    <div>
                      {' '}
                      <JsonForms
                        schema={schema}
                        data={data}
                        uischema={hiddenSettingsUISchema}
                        renderers={materialRenderers}
                        cells={materialCells}
                        onChange={({ errors, data }) => setData(data)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              className='bg-white btn btn-primary text-primary hover:text-white'
              onClick={() => {
                setStep(step - 1)
              }}
            >
              Back
            </button>
            <button
              className='btn btn-primary'
              onClick={() => {
                // fix data before moving forward
                let tData = data

                if(showHiddenSettings){
                  tData.hiddenSettings.hash=new Array(32).fill(0)
                  setData(tData)
                }

                // move forward
                setStep(step + 1)

              }}
            >
              fwd
            </button>
          </>
        )}

        {step == 2 && (
        <>
          <h1>next step</h1>
          <JsonViewer value={data}/>
          <button className='btn btn-info' onClick={()=>setStep(step-1)}>back</button>
          <button className='btn btn-primary' onClick={async ()=>{

            let tData = data
            tData.wallet = new PublicKey(data.wallet)
            tData.creators.map((c:any,i:number)=>{
              tData.creators[i]['address'] = new PublicKey(c['address'])
            })
            tData.tokenMint = new PublicKey(tData.tokenMint)
            toast("ship it")
            const cm = await metaplex.candyMachines().create(data).run()
            toast("done? lol")
            console.log(cm)
          }}>Mint it</button>
        </>
        )}
      </div>
    </>
  )
}

export default CreateCandyMachine
