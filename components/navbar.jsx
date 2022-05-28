import {
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui'

import Link from 'next/link'
import { useState } from 'react'

export const Navbar = props => {
  const [active, setActive] = useState(false)

  const handleClick = () => {
    setActive(!active)
  }

  return (
    <div className='navbar bg-base-100'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <label tabIndex='0' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </label>
          <ul
            tabIndex='0'
            className='p-2 mt-3 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52'
          >
            <li>
              <Link href='multisend'>
                <button className='font-bold tracking-wide uppercase'>
                  Multi Send
                </button>
              </Link>
            </li>
            {/* <li>
              <Link href='txbuilder'>
                <button className='font-bold tracking-wide uppercase'>
                  TX Builder
                </button>
              </Link>
            </li> */}
            <li>
              <Link href='gatedentry'>
                <button className='font-bold tracking-wide uppercase'>
                  Gated Entry
                </button>
              </Link>
            </li>
            <li>
              <Link href='minthash'>
                <button className='font-bold tracking-wide uppercase'>
                  Mint Hash Getter
                </button>
              </Link>
            </li>
            {props.sending && (
              <li>
                <div className='inline-block mr-4 border border-gray-400 rounded-lg indicator'>
                  {props.sending.length > 0 && (
                    <span className='indicator-item badge badge-secondary'>
                      {props.sending.length}
                    </span>
                  )}
                  <div className=''>
                    {' '}
                    <label
                      htmlFor='my-drawer'
                      className='bg-white rounded-lg btn-ghost w-14 btn'
                    >
                      <span>🛒</span>
                    </label>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
        <a className='text-xl normal-case btn btn-ghost'>🍌tools</a>
      </div>
      <div className='hidden navbar-center lg:flex'>
        <ul className='p-0 menu menu-horizontal'>
          <li>
            <Link href='multisend'>
              <button className='font-bold tracking-wide uppercase'>
                Multi Send
              </button>
            </Link>
          </li>
          {/* <li>
            <Link href='txbuilder'>
              <button className='font-bold tracking-wide uppercase'>
                TX Builder
              </button>
            </Link>
          </li> */}
          <li>
            <Link href='gatedentry'>
              <button className='font-bold tracking-wide uppercase'>
                Gated Entry
              </button>
            </Link>
          </li>
          <li>
            <Link href='minthash'>
              <button className='font-bold tracking-wide uppercase'>
                Mint Hash Getter
              </button>
            </Link>
          </li>
          {props.sending && (
            <li>
              <div className='inline-block mr-4 border border-gray-400 rounded-lg indicator'>
                {props.sending.length > 0 && (
                  <span className='indicator-item badge badge-secondary'>
                    {props.sending.length}
                  </span>
                )}
                <div className=''>
                  {' '}
                  <label
                    htmlFor='my-drawer'
                    className='bg-white rounded-lg w-14'
                  >
                    <span>🛒</span>
                  </label>
                </div>
              </div>
            </li>
          )}
          
        </ul>
      </div>
      <div className='navbar-end'>
        <span className="bg-purple-600"><WalletMultiButton /></span>
      </div>
    </div>
  )
}
