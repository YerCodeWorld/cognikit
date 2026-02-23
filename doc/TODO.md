
CHIP

- Update chip.ts to support all remaining types of stimulus
- Allow chip to render image+text if both are available

SOUND

- Create TTS helper using the built-in API

--------

INTERACTIONS

1) Feedback

- Implement 'immediate feedback mode' for all available interactions

2) Data

- Implement 'IInteractionSpec' interfaces for all suitable interactions, which sets a configuration object for that particular interaction

## OddOnesOut

Module: Discrimitation

Very similar with @openClassification.ts | I was thinking I could create a wrap for it or simply
tweakign openClassification a bit so that it accepts both modes.
@src/engines/text/scrip.ts]
