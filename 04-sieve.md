The sieve shoudl be a command:

npm run sieve

paramters shoudl include:

- size (n x n grid, default to 10)
- stars (n amount ot stars. default to 2)
- number (do i need 100, 300, just 1? default to 1)
- seed (optional, if seed it overrides nnumber, jsut produces one)
- puzzle or board ( default to puzzle, sive runs until produces n amount of puzzles, if user types board then jsut need to generate baords, solver doesnt have to run)

If seed is selected, return the board and either "not valid" or the puzzle result


---

The sieve starts by generating seeds, then the seeds go into the gnerator, then the generator returns a board, then the board gets sent to the solver, then the solver tries to solve and either trurns invalid or the puzzle solution. the sieve then assigns a difficulty to the puzzle and sends it to the cloudlfare data base as a json object with metadata. happy happy.