import type { AdvertConfig } from '../../../features/advertising/types'
import { useState } from 'react'
import { NumberField, TextField, type EditAdvert } from './Fields'
export function ScheduleSettings({ draft, edit }: { draft: AdvertConfig; edit: EditAdvert }) {
  const s = draft.schedule
  const [intervalUnit, setIntervalUnit] = useState<'seconds' | 'minutes'>('minutes')
  return (
    <details>
      <summary>Generation frequency and quiet periods</summary>
      <fieldset>
        <legend>One shared generation and publication cycle</legend>
        <div className="advert-settings__grid">
          <label>
            Schedule
            <select
              value={s.mode}
              onChange={(e) =>
                edit((d) => {
                  d.schedule.mode = e.target.value as 'interval' | 'daily'
                })
              }
            >
              <option value="interval">Interval</option>
              <option value="daily">Daily local time</option>
            </select>
          </label>
          {s.mode === 'interval' ? (
            <>
              <label>
                Interval units
                <select
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value as 'seconds' | 'minutes')}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                </select>
              </label>
              <NumberField
                label={'Interval in ' + intervalUnit + ' (30 seconds–31 days)'}
                value={s.intervalSeconds / (intervalUnit === 'minutes' ? 60 : 1)}
                min={intervalUnit === 'minutes' ? 0.5 : 30}
                max={2678400 / (intervalUnit === 'minutes' ? 60 : 1)}
                step={intervalUnit === 'minutes' ? 1 / 60 : 1}
                onChange={(v) =>
                  edit((d) => {
                    d.schedule.intervalSeconds = Math.round(
                      v * (intervalUnit === 'minutes' ? 60 : 1),
                    )
                  })
                }
              />
            </>
          ) : (
            <TextField
              label="Daily publication time"
              type="time"
              value={s.dailyAt}
              onChange={(v) =>
                edit((d) => {
                  d.schedule.dailyAt = v
                })
              }
            />
          )}
          <TextField
            label="IANA timezone"
            value={s.timezone}
            maxLength={80}
            onChange={(v) =>
              edit((d) => {
                d.schedule.timezone = v
              })
            }
          />
          <TextField
            label="Publication window starts"
            type="time"
            value={s.windowStart}
            onChange={(v) =>
              edit((d) => {
                d.schedule.windowStart = v
              })
            }
          />
          <TextField
            label="Publication window ends"
            type="time"
            value={s.windowEnd}
            onChange={(v) =>
              edit((d) => {
                d.schedule.windowEnd = v
              })
            }
          />
          <NumberField
            label="Prepare this many seconds before publication"
            value={s.preparationLeadSeconds}
            max={86400}
            onChange={(v) =>
              edit((d) => {
                d.schedule.preparationLeadSeconds = v
              })
            }
          />
          <label>
            When the site is idle
            <select
              value={s.idlePolicy}
              onChange={(e) =>
                edit((d) => {
                  d.schedule.idlePolicy = e.target.value as 'keep' | 'pause'
                })
              }
            >
              <option value="keep">Keep the schedule running</option>
              <option value="pause">Pause new preparation until someone returns</option>
            </select>
          </label>
          {s.idlePolicy === 'pause' && (
            <NumberField
              label="Idle after seconds without a Home visit"
              value={s.idleSeconds}
              min={60}
              max={2678400}
              onChange={(v) =>
                edit((d) => {
                  d.schedule.idleSeconds = v
                })
              }
            />
          )}
        </div>
        <p className="note">
          This frequency controls the shared automatic generation/publication cycle. Turn off manual
          approval for automatic publication. Home follows completed publications without a reload;
          it never generates an advert. Intervals start at the actual promotion. Daily times follow
          the chosen timezone: a missing clock time moves forward and a repeated time publishes
          once. Windows may cross midnight. Missed runs do not create a catch-up queue. Valid
          current copy remains visible while idle.
        </p>
      </fieldset>
    </details>
  )
}
