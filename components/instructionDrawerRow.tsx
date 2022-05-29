function showfirstandlastfour (str: string) {
  if (str.length > 4) {
    return str.substr(0, 4) + '...' + str.substr(str.length - 4, 4)
  }
  return str
}

interface InstructionDrawerRowProps {
  name: String
  to: string
  amount?: string
  unselect(): void
}

export const InstructionDrawerRow = (props: InstructionDrawerRowProps) => {
  return (
    <div
      className={'nftcard shadow stats hover:shadow-xl '}
      onClick={() => {
          props.unselect()
      }}
    >
      <div className='stat'>
        <div className='truncate stat-title'>{props.name}</div>
        {props.to && (
          <div className='text-gray-400 stat-desc'>
            to: {showfirstandlastfour(props.to)}
          </div>
        )}
      </div>
    </div>
  )
}
