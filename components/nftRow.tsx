function showfirstandlastfour (str: string) {
  if (str.length > 4) {
    return str.substr(0, 4) + '...' + str.substr(str.length - 4, 4)
  }
  return str
}

interface NftRowProps {
  image: string
  name: String
  select(): void
  unselect(): void
  selected: Boolean
  showHidden?: Boolean
  owner?: string
}

export const NftRow = (props: NftRowProps) => {
  let hideme = props.name == '' && !props.showHidden ? ' hidden ' : ''

  let amSelected = props.selected ? ' border border-secondary ' : ''
  return (
    <div
      className={'nftcard shadow stats hover:shadow-xl ' + hideme + amSelected}
      onClick={() => {
        if (props.selected) {
          props.unselect()
        } else {
          props.select()
        }
      }}
    >
      <div className='stat'>
        <div className='truncate stat-title'>{props.name}</div>
        {props.owner && (
          <div className='text-gray-400 stat-desc'>
            owner: {showfirstandlastfour(props.owner)}
          </div>
        )}
        <div className='stat-figure text-secondary'>
          <div className={'avatar '}>
            <div className='w-16 rounded-full'>
              <img src={props.image} alt={props.name.toString()}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
