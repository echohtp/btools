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
    <div class='navbar bg-base-100'>
      <div class='navbar-start'>
        <div class='dropdown'>
          <label tabindex='0' class='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              class='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </label>
          <ul
            tabindex='0'
            class='menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52'
          >
            <li>
              <Link href='multisend'>
                <button className='font-bold tracking-wide uppercase'>
                  Multi Send
                </button>
              </Link>
            </li>
            <li>
              <Link href='txbuilder'>
                <button className='font-bold tracking-wide uppercase'>
                  TX Builder
                </button>
              </Link>
            </li>
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
        <a class='btn btn-ghost normal-case text-xl'>daisyUI</a>
      </div>
      <div class='navbar-center hidden lg:flex'>
        <ul class='menu menu-horizontal p-0'>
          <li>
            <Link href='multisend'>
              <button className='font-bold tracking-wide uppercase'>
                Multi Send
              </button>
            </Link>
          </li>
          <li>
            <Link href='txbuilder'>
              <button className='font-bold tracking-wide uppercase'>
                TX Builder
              </button>
            </Link>
          </li>
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
      <div class='navbar-end'>
        <WalletMultiButton />
      </div>
    </div>
  )
}
