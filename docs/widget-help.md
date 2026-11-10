# Widget help

Every currently usable Widget Store tool has a native, initially collapsed help
disclosure in its interactive workspace. Help is static copy: opening it does not
submit a form, install a widget, reveal current private content or save progress.
`components/ui/WidgetHelp` supplies only a title, children and scoped Nimbus text
spacing for the seven newer guides; the existing Nonograms and Sudoku guides keep
their own reviewed markup/styles.

| Tool           | Help location                                    | Main teaching and safeguards                                                                                                                                                    |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dinner Spinner | `components/widgets/DinnerSpinner.tsx`           | Private independent trials, owner meal settings, explicit meal/date publication, optional replies/default choice, replacements and retained replies, eaten correction and diary |
| Shopping List  | `pages/family/ListsPage.tsx`                     | Add/importance, checking without removal, search/filter/sort, shared edit/details/history, delayed removal                                                                      |
| Polls          | `pages/family/PollsPage.tsx`                     | Create with fixed choices/cutoff, immediate single vote/change/withdrawal, closed results, creator/admin management, non-anonymous admin activity                               |
| Household Jobs | `components/household-jobs/HouseholdJobs.tsx`    | Family versus private Mine, optional target date/repeats, claim/assignment permissions, shared ordering, completion/reopen/history                                              |
| Where Is It?   | `components/where-is-it/WhereIsItWorkspace.tsx`  | Collection access, required name/location, optional photo/note, search/location filter, edit/move, owner settings and delayed removal                                           |
| Daily Word     | `components/daily-word/DailyWordWorkspace.tsx`   | Five letters/six accepted guesses, mark symbols/repeated letters, explicit submission, immutable saved guesses, private history and optional result sharing                     |
| Focus Timer    | `components/focus-timer/FocusTimerWorkspace.tsx` | Setup versus accepted start, remembered durations, pause/resume, explicit next phase, early finish/reset/history, saved server time and quiet/sleep limits                      |
| Nonograms      | `components/nonograms/NonogramWorkspace.tsx`     | Existing expanded numbered beginner guide and examples                                                                                                                          |
| Sudoku         | `components/sudoku/SudokuBoard.tsx`              | Existing expanded numbered beginner guide and worked deduction                                                                                                                  |

Daily Word results also has a brief disclosure explaining opt-in finishes, private
guesses, the seven-day window and withdrawal. Home summary/preview components are
unchanged; Shopping and Polls help belongs in the interactive pages, including
their empty/loading states. Jobs, collections and games also retain help when they
have no records, guesses or history. Proposed Countdowns, Family Adventure Jar,
Family Recommendations, Walking Together and Family Quiz have no invented controls
or guides. Calendar, Notes and Memories are outside the Widget Store help scope.

Daily Word and Focus Timer's former help-only buttons/modal state were replaced
with the native disclosures. Focus finish/reset confirmations and all removal,
draft, stale-record and uncertain-save flows remain in place. No dependency,
server, database or gameplay change is needed. Existing domain documents remain
the full persistence/permissions references; instructional copy must be checked
against the actual controls when those behaviours change.
