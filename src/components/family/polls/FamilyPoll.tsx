import { useId } from 'react'
import { useFamilyData } from '../../../features/family/useFamilyData'
import type { PollChoice } from '../../../features/family/types'
import { Panel } from '../../ui/Panel'
import './FamilyPoll.css'

const options: PollChoice[] = ['Picnic', 'Games night']

export function FamilyPoll() {
  const { pollChoice, vote } = useFamilyData()
  const group = useId()
  return (
    <div id="family-poll" className="family-poll">
      <Panel title="Next time together?">
        <p className="family-poll__intro">Pick the plan you fancy.</p>
        <fieldset className="family-poll__choices">
          <legend className="sr-only">Choose a family activity</legend>
          {options.map((option) => (
            <label key={option} className={pollChoice === option ? 'is-selected' : ''}>
              <input
                type="radio"
                name={group}
                value={option}
                checked={pollChoice === option}
                onChange={() => vote(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        <p className="family-poll__feedback" role="status">
          {pollChoice ? 'You chose ' + pollChoice.toLowerCase() + '.' : 'Everyone gets a say.'}
        </p>
      </Panel>
    </div>
  )
}
