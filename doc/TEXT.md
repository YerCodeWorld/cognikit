--------------------------------------

# Interactive Text Engine: Grammar Desings

The interactive text engine will work as a central point to a series of interactions that follow the same structure to some degree, with the main
similarity being that of rendering 'parts' as *spans* or other elements (input, editableareas, etc), so that the user can 'interact' with it.
Depending on the elements we use we can get quite different results and thus creating unique interactions.

### So far, we have the following list of elements to be used across the variations:

- span: styled to be colored/uncolored (selection)
- editablearea with default text (so the use can modify it)
- dropzones: to which 'draggable chips' will be dropped to
- input elements: text, number, dropdowns, data, time, etc

Each type above would 'replace' some preset text, defining the interaction.

## Already-designed interactions: Overview

1) Text Highlight, Static: Static indicates single slide 

Uses the base pattern: square brackets to indicate targets.
```
You will [write] you text [here], and even set [sentences like this] so that they can be parsed.
```

2) Text Highlight, Sequential: Just different chunks separated by ';;'

```
I [am] not your brother;;
She [is] someone I love;;
We [are] not together;;
```

3) Text highlight: Categorize, Static

Uses a "@ct" reference to indicate a category and assign a target
```
I @ct(future, will be) studying math next year, right now I (present, am) thinking how to do it.
Right, my mom @ct(present, thinks) I @ct(past, lost) track of my goals, but that's not true;
```
- Take each first algument (future, present, past) to create categories
- Assign each member to their corresponding category


4) Text highlight: Categorize, Sequential: Same chunks thing.
5) Fill in the blanks: Drag and Drop - Static

Uses same base pattern, with the addition of the distractors pattern.
```
= ["rock", "moon"]; // distractors
I [am] your sister! You cannot [do] anything without me!
I am tired of having to [wait] for you to stop [playing] videogames
to get inspired to do the [chores] in the house;

@im(...)

Look at this room, it's a total [mess]! How can you live in these [conditions]?
```

6) Fill in the blanks: DND, Sequential 
7) Fill in the blanks, Sequential

Author can decide to do it ONLY of a particular element (time|tx|nm|sl), or a mix of these
```
She @tx(is|'s) my sister, I can't @sl([leave]|drink|think) her behind;;

Out of @nm(7) days of the @tx(week), in none of them did you dare to clean the bathroom!;;
```

8) Fill in the Blanks, Static
9) Transformation - Static

Edit the highlighted words/sentences to 'correct/update' them based on the given constraint.
for example: edit from simple present to present continuous 
```
[I drink water] because it is good for my health, honestly [she thinks] I don't care but I do.
```

10) Transformation, Sequential

--------------------------------------

[@src/types/Input.ts]
[@src/shared/dsl.ts]
Each element referencer has its own parse function, and each has its own little grammar.

tx: option1 | option2 | ... | optionN;
nm: option1 | options2A..option2B | optionN; // a..b <- correct option range
sl: option1 | [correctOption1 | correctOption2] | option2;
dt: date1 | date2;

--------------------------------------

[@src/types/Assets.ts]
Media referencers:

@as(name);

The whole string is passed to the final object. The renderer, in this case the engine, will then check each part of the 
data object and check if they match these patterns. If yes, it will use the "name" to get the asset from the asset object
passed to the class and render it with a media component.

as:

- im
- vi
- au
- tt
- etc

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

Utilities at [@src/shared/utils.ts] 
Generalized types at [@src/types/Global.ts]

The Global interaction data union has the data objects from the text engine already assigned
[@src/types/Data.ts]

----------------------------------------

As for the engine itself, parsers at 
[@src/engines/text/implementation/parsers.ts]

Sketch for element at
[@src/engines/text/script.ts]
