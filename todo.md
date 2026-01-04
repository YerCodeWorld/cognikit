
- Define all data structures [in process]
- Create validators for all data structures

[x] Create answerKey and Grader functions for all data structures

-------

CHIP


- Update chip.ts to support all remaining types of stimulus
- Allow chip to render image+text if both are available
[x] Update chip.ts to support success/missed/disabled/failure states 

-------

[x] add in-line feedback when an interaction is completed [
[x] Update BaseInteraction to include abstract methods properties like interaction mechanic 
[x] Create an animations library 

-------

SOUND

- Create sound player utility AGAIN
- Create TTS helper using the built-in API
- Set a list of .mp3 utility files in the assets folder

-------

ENGINES

- Finalize the dsl-to-html engine

--------

[x] Increment responsiveness support 
- Check out how to implement presentation modes

--------

INTERACTIONS

1) Feedback

- Implement 'immediate feedback mode' for all available interactions

2) Data

- In BaseInteraction, validate the data with a validator passed by the interaction
- Render a "oops, invalid data" component instead if data is not valid
- Implement 'IInteractionSpec' interfaces for all suitable interactions, which sets a configuration object for that particular interaction

--------

SHELL

1) Update Progress Bar

Take inspiration from @H5P implementation of a progress bar and let it:

- Accept an icon to be at the end of it; default to a 'start' saved in the assets folder
- This icon will color based on states: completition, correct completion & wrong completion
- Add a counter, not just the visual indicator 
- When an interactions is 'checked', also show a 'eye' icon to enter 'reveal answers mode'
- Also add a 'retry' icon

- Update shell to read properties from interaction like stimulus & data to render proper content
- Check out for the actual navigation communitaction shell-interaction

--------

Specifics

- Set new: 'container' component in the MCQ interaction



