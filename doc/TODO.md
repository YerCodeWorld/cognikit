
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

// ================= PLANNING ================

--------------------------------------

Interactive Text Engine: Grammar Desings

1) Text Highlight - Static 

Uses the base pattern, square brackets to indicate targets.

```
You will [write] you text [here], and even set [sentences like this] so that they can be parsed.
```

2) Text Highlight - Sequential

```
I [am] not your brother;

She [is] someone I love;

We [are] not together;
```

3) Text highlight: Categorize - Static

Uses a "@ct" reference to indicate a category and assign a target

```
I @ct(future, will be) studying math next year, right now I (present, am) thinking how to do it.
Right, my mom @ct(present, thinks) I @ct(past, lost) track of my goals, but that's not true;
```

4) Text highlight: Categorize - Sequential

**Same as #3 but with chunks separated by semi-colons**

5) Fill in the blanks: Drag and Drop - Static

Uses same base pattern, with the addition of the distractors pattern.

```
= ["rock", "moon"]; // distractors
I [am] your sister! You cannot [do] anything without me!
I am tired of having to [wait] for you to stop [playing] videogames
to get inspired to do the [chores] in the house;

@img(...)

Look at this room, it's a total [mess]! How can you live in these [conditions]?
```

6) Fill in the blanks: DND - Sequential 

**Same as #6 but with chunks separated by semi-colons**

7) Fill in the blanks - Sequential

Author can decide to do it ONLY of a particular element (time|tx|nm|sl), or a mix of these
```
She @tx(is|'s) my sister, I can't @sl([leave]|drink|think) her behind;

Out of @nm(7) days of the @tx(week), in none of them did you dare to clean the bathroom!;
```

8) Fill in the Blanks - Static

**Same as #7 but with a single chunk**

9) Transformation - Static

Edit the highlighted words/sentences to 'correct/update' them based on the given constraint.
for example: edit from simple present to present continuous 
```
[I drink water] because it is good for my health, honestly [she thinks] I don't care but I do.
```

10) Transformation - Sequential

...

--------------------------------------

Each element referencer has its own parse function, and each has its own little grammar.

tx: option1 | option2 | ... | optionN;
nm: option1 | options2A..option2B | optionN; // a..b <- correct option range
sl: option1 | [correctOption1 | correctOption2] | option2;
dt: date1 | date2;

Check out @src/shared/dsl.ts to see these and related types/utilities.

--------------------------------------

Media referencers:

@as(name);

The whole string is passed to the final object. The renderer, in this case the engine, will then check each part of the 
data object and check if they match these patterns. If yes, it will use the "name" to get the asset from the asset object
passed to the class and render it with a media component.

--------------------------------------

No text decorations or more complicated features here. In some GUI of a blocks-based constructor that uses our components
more complex things can be achieved.

--------------------------------------

Another interaction that can be create with the DSL helpers and is unrelated to the interactive text engine is some sort of 
Cued Recall Question Cards, which can be responded to with any of the elemnts:
 
# @im(...)
question/hint = @tx(blue | red);

# @tt(...)
question/hint = @sl([7] | 4 | 2);

question/hint = @tx(...);
...

-----------------------------------------

For all the variations, data object types are found at:

[@src/types/Text.ts]

It is to be noticed that sequential interactions have a separate type for themselves, and even their own parser which is a bulk
caller to the corresponding parser.

-----------------------------------------

Input elements got their data types at:

[@src/types/Input.ts]

And their parsers at:

[@src/shared/dls.ts]

-----------------------------------------

Utilities at [@src/shared/utils.ts] 
Generalized types at [@src/types/Globla.ts]

The Global interaction data union has the data objects from the text engine
[@src/types/Data.ts]

----------------------------------------

As for the engine itself, parsers at 
[@src/engines/text/implementation/parsers.ts]

Sketch for element at
[@src/engines/text/scrip.ts]
