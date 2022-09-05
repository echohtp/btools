import { Fanout, FanoutClient, MembershipModel } from '@glasseaters/hydra-sdk'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { useState } from 'react'
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { Navbar } from './navbar'

export const CreateFanout = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const { signAllTransactions, signTransaction, publicKey } = useWallet()
  const [walletName, setWalletName] = useState<undefined | string>(undefined)
  const [totalShares, setTotalShares] = useState<undefined | number>(100)
  const [success, setSuccess] = useState(false)
  const [splTokens, setSplTokens] = useState<string[]>([])
  const [hydraWalletMembers, setHydraWalletMembers] = useState<
    { memberKey?: string; shares?: number }[]
  >([{ memberKey: undefined, shares: undefined }])

  // const validateAndCreateWallet = async () => {
  //   if (!publicKey || !signAllTransactions || !signTransaction || !connection) {
  //     console.log("missing a critical")
  //     return
  //   }
  //   try {
  //     if (!walletName) {
  //       throw 'Specify a wallet name'
  //     }
  //     if (walletName.includes(' ')) {
  //       throw 'Wallet name cannot contain spaces'
  //     }
  //     if (!totalShares) {
  //       throw 'Please specify the total number of shares for distribution'
  //     }
  //     if (totalShares <= 0) {
  //       throw 'Please specify a positive number of shares'
  //     }
  //     let shareSum = 0
  //     for (const member of hydraWalletMembers) {
  //       if (!member.memberKey) {
  //         throw 'Please specify all member public keys'
  //       }
  //       if (!member.shares) {
  //         throw 'Please specify all member shares'
  //       }
  //       try {
  //         new PublicKey(member.memberKey)
  //       } catch (e) {
  //         throw `unable to cast to publickey`
  //       }

  //       if (member.shares <= 0) {
  //         throw 'Member shares cannot be negative or zero'
  //       }
  //       shareSum += member.shares
  //     }

  //     for (const token of splTokens) {
  //       if (token == '') {
  //         throw 'please specify a token publickey'
  //       }
  //       try {
  //         new PublicKey(token)
  //       } catch (e) {
  //         throw `unable to cast token to publickey`
  //       }
  //     }

  //     if (shareSum !== totalShares) {
  //       throw `Sum of all shares must equal ${totalShares}`
  //     }
  //     if (!hydraWalletMembers || hydraWalletMembers.length == 0) {
  //       throw 'Please specify at least one member'
  //     }
  //     if (!hydraWalletMembers || hydraWalletMembers.length > 20) {
  //       throw 'Too many members - submit a PR to https://github.com/cardinal-labs/hydra-ui to increase this minimum'
  //     }

  //     const fanoutId = (await FanoutClient.fanoutKey(walletName))[0]
  //     const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutId)
  //     const fanoutSdk = new FanoutClient(connection, {
  //       signAllTransactions,
  //       signTransaction,
  //       publicKey
  //     })
  //     try {
  //       let fanoutData = await fanoutSdk.fetch<Fanout>(fanoutId, Fanout)
  //       if (fanoutData) {
  //         throw `Wallet '${walletName}' already exists`
  //       }
  //     } catch (e) {}
  //     let instructions = []
  //     const transaction = new Transaction()
  //     instructions.push(
  //       ...(
  //         await fanoutSdk.initializeFanoutInstructions({
  //           totalShares,
  //           name: walletName,
  //           membershipModel: MembershipModel.Wallet
  //         })
  //       ).instructions
  //     )

  //     for (const member of hydraWalletMembers) {
  //       if (member.memberKey)
  //         instructions.push(
  //           ...(
  //             await fanoutSdk.addMemberWalletInstructions({
  //               fanout: fanoutId,
  //               fanoutNativeAccount: nativeAccountId,
  //               membershipKey: new PublicKey(member.memberKey),
  //               shares: member.shares!
  //             })
  //           ).instructions
  //         )
  //     }

  //     for (const token of splTokens) {
  //       instructions.push(
  //         ...(
  //           await fanoutSdk.initializeFanoutForMintInstructions({
  //             fanout: fanoutId,
  //             mint: new PublicKey(token)
  //           })
  //         ).instructions
  //       )
  //     }

  //     console.log("We have ", instructions.length, " instructions.")
  //     console.log("Breaking into ", Math.ceil(instructions.length/8), " transactions")
  //     for (var i = 0; i < instructions.length / 8; i++) {
  //       let tx = new Transaction()
  //       for (var j = 0; j < 8; j++) {
  //         const ix = instructions[i * 8 + j]
  //         if (ix) tx.add(ix)
  //       }

  //       tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //       tx.feePayer = publicKey

  //       let signed: Transaction | undefined = undefined

  //       try {
  //         signed = await signTransaction(tx)
  //       } catch (e) {}

  //       let signature: string | undefined = undefined

  //       try {
  //         if (!signed) return
  //         signature = await connection.sendRawTransaction(signed.serialize())
  //         await connection.confirmTransaction(signature, 'confirmed')
  //       } catch (e) {}
  //     }

  //     // await executeTransaction(connection, wallet as Wallet, transaction, {})
  //     console.log(instructions)
  //     setSuccess(true)
  //   } catch (e) {
  //     console.log(`Error creating hydra wallet`)
  //     console.log(`${e}`)
  //     // notify({
  //     //   message: `Error creating hydra wallet`,
  //     //   description: `${e}`,
  //     //   type: 'error'
  //     // })
  //   }
  // }

  return (
    <div className=''>
      <main className='h-[80%] py-16 flex flex-1 flex-col justify-center items-center'>
        {success && (
          <div className='w-full max-w-lg py-3 mb-10 text-center text-gray-700 bg-green-300'>
            <p className='font-bold tracking-wide uppercase'>
              Hydra Wallet Created
            </p>
            <p>
              {' '}
              Access the wallet at{' '}
              <a
                href={`/${walletName}${window.location.search ?? ''}`}
                className='text-blue-600 hover:text-blue-500'
              >
                {window.location.origin}/{walletName}
                {window.location.search ?? ''}
              </a>
            </p>
          </div>
        )}
        
      </main>
    </div>
  )
}

export default CreateFanout