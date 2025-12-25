THIS FILE DOES NOT INCLUDE ACADEMICAL DOCUMENTATION, EVERYTHING HERE WAS WRITTEN WITH MY LIMITED UNDERSTANDING OF THINGS BASED ON MY RESEARCH
THIS IS NOT AI, TABLES WERE GENERATED WITH A 15-lines PYTHON SCRIPT.

# Matrices

Matrices are a great tool that I found useful for creating forms, surveys and 'quizzes', the latter being down the line the objective of COGNIKIT.
Here I provide a simple explanation of my understanding of matrices ACCOMODATED to the context of assessment design. I identified a set of types 
and what I grouped as variations of those types that we can define here to later create a unified engine. 

1) Look-up matrix

Compare headers and rows and write the result of the combination of both based on a constraint.

Constraint: Prices of the products in their respective countries.

+-------+-------+-----+--------+
|       | Japan | USA | France |
+-------+-------+-----+--------+
| Milk  | 2$    | 4$  |        |
| Sugar |       |     |        |
| Eggs  | 1$    |     | 1.5$   |
+-------+-------+-----+--------+

**Empty cells just represent those values that have not been filled in yet**

2) Classification Matrix

A 'classification matrix' (terminology may vary), is a table where we attach attributes to some "item".

+--------+-------------+--------------+----------------+
|        | Interpreted | Supports OOP | Strongly Typed |
+--------+-------------+--------------+----------------+
| Python | x           | x            | x              |
| C#     |             | x            | x              |
| Go     |             | -            | x              |
| Rust   |             | -            | x              |
+--------+-------------+--------------+----------------+

**Having 'partial' cell values is not necessary, just showing here for visuals**
**rather specify partial should be NONE, or be more deterministic: "Fully Supports OOP"**

3) Constraints Variations

We are able to create more construct-specific tables by simply altering the composition of the table and adding
constraints like the following:

- Limiting the completion of a row to a single column
- Limiting the completion of a cell to a set of anwers

## Example: n-ary choice:

+------------------------------+------+-------+
|                              | True | False |
+------------------------------+------+-------+
| Earth is flat                |      | x     |
| Water is blue                | x    |       |
| MJ was a singer              | x    |       |
| They speak Mexican in Mexico |      | x     |
+------------------------------+------+-------+

## Example: Stablished set of answers

+-------------+------------------+-------------------+-----------+---------------------+
|             | Access Dashboard | CORS on User Data | Telemetry | Manage Restrictions |
+-------------+------------------+-------------------+-----------+---------------------+
| Adming      | Yes              | Yes               | Yes       | Yes                 |
| Coordinator | Yes              | No                | No        | No                  |
| Manager     | Yes              | No                | Yes       | Yes                 |
| Employee    | No               | No                | No        | No                  |
+-------------+------------------+-------------------+-----------+---------------------+

** Incidence and Truth tables can be also created with this base **

4) Adjacency Table

An adjacency table compares a set of items against themselves. Example use cases are found in day-to-day life, like
if you see a table of teams from some sort of sport which defined the amount of win/loses between themselves. The 
diagonal space which indicates comparissons between two same items is usually restricted or not enabled.

+-----------+-----------+--------+---------+
|           | Marketing | IT     | Finance |
+-----------+-----------+--------+---------+
| MARKETING | -         | Medium | Low     |
| IT        | High      | -      | High    |
| FINANCE   | Medium    | Low    | -       |
+-----------+-----------+--------+---------+

** Constraint: Influence of each field over the other in personal projects **

--------------------------------------------------------------------------------------------

THIS SOFTWARE IMPLEMENTATION

** Plan for the moment **

Use simple HTML tables. Create them dynamically based on configuration.

```ts
type CellValue = string | number | boolean | null;
// this only applies for the adjacency and lookup tables; classification and n-ary simply toggle radio/checkbox based on the rowSelection constraint 
type CellKind = 'text' | 'number' | 'select' | 'radio' | 'checkbox';
type TableState = Record<string, Record<string, CellValue>>;

interface TableConfiguration {
    cols: string[];
    rows: string[];    
    answerKey: TableState | Map<string, string[]>;

	cellKind?: CellKind;

    // custom tables with custom disabled cells (adjacency disables a the middle diagonla by default) 
    disabled?: (r: string, c: string) => boolean;
    // For usage on select/constraint entries 
    allowed?: (r: string, c: string) => CellValue[] | null;

    // this is how we really build a different table kind for the set preset.
    // Like a single row selection ends up in n-ary, more in classification. 
    preset?: 'lookup' | 'n-ary' | 'classification' | 'adjacency';
    variant: Variant;
}

// other types and detailes at @types/Tables.ts
```

// Classification Module
## How is Classification Matrix data parsed?
```txt
a = .. | ..;
b = ..;
c = .. | .. | ..;
d = .. | ..;

1 - Take all the category declarations (name =) to create the headers
2 - Create a set with all values of all categories to create the rows, since we allow items in multiple categories here 
3 - Compare the categories attached to those items against the original data object for grading
```

// Miscellaneous Module
## How is n-ary choice Matrix data parsed?
```txt
a = ... | ... | ...;
b = ...;
c = ... | ...;

1 - All category declarions represent a column
2 - All category items must be UNIQUE, so you take them and create the rows
3 - Each row uses radio-buttons, so one single answer per row to create the final state object
```

// Assossiation Module
## How is Adjacency Matrix data parsed?
```txt
a = .. | .. | ..;
b = .. | .. | ..;
c = .. | .. | ..;
d = .. | .. | ..;

Each value in a category represents the answer to their partner repectively.
First option from 'a' represents the answer a-b, the second a-c, and the third a-d.
Fist option of 'd' represents the answer d-a, the second d-b and the third d-c. Same with the others.

- Answers can be provided by text if they values in the code are non-equal strings.
- If they are numbers, they will be provided using a number input element.
- These above are auto-detected, and specifying something different in the configuration is mere formality

In case 'select' input type is selected:

1 - take all the items
2 - create a set of all items
3 - use the set values to create a unique select
```

// Production Module
## How is the Lookup Matrix data parsed?
```txt
= japan | usa | france;
milk = ... | ... | ...;
sugar = ... | ... | ...; 
eggs  = ... | ... | ...;

The '= ... | ... | ...;' is a utility used in the normal classification data parser for distractors. We can use it
here to simply indicate the headers to fill the cells against. The table self-draws itself as seen above.

Same rules from 'adjacency' matrix apply for text/number/select input types.
```
