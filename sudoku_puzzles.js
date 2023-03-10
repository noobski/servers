/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
/* global exports */

exports.load_puzzles = load_puzzles;
const numbers_in_sudoku = [1,2,3,4,5,6,7,8,9];

// test();
// eslint-disable-next-line no-unused-vars
function test(){
	['easy', 'medium', 'hard'].forEach(level => {
		console.log(level);
		console.table(load_puzzles(level));
	});
}

// the 'exported' array of seed puzzles
// each seed is: {array:a, show:show, level:'easy'}

// let puzzle_seeds = load_puzzles();

function load_puzzles(level){
	const puzzles = [];
	let entry, a, show;

	// easy
	a = [[4,2,7,8,6,5,9,1,3],
		[9,1,5,2,4,3,6,8,7],
		[6,8,3,7,9,1,2,5,4],
		[8,7,1,6,2,9,3,4,5],
		[3,4,9,1,5,8,7,2,6],
		[2,5,6,3,7,4,8,9,1],
		[5,9,8,4,3,7,1,6,2],
		[1,3,2,5,8,6,4,7,9],
		[7,6,4,9,1,2,5,3,8]];
	show =  [[0,0,0,1,0,1,0,1,1],
		[0,0,0,1,0,1,1,0,0],
		[1,0,0,0,1,0,1,0,1],
		[0,0,0,0,0,0,0,0,1],
		[0,1,0,1,0,0,1,0,1],
		[1,1,1,1,0,1,1,1,0],
		[1,1,0,0,0,1,1,0,1],
		[1,0,1,0,1,0,1,1,0],
		[0,0,1,1,1,0,0,1,1]];
	entry = {array:a, show:show, level:'easy'};
	validate_solution(entry);
	puzzles.push(entry);
	a = [[4,2,7,1,3,9,5,6,8],
		[9,1,5,8,7,6,3,4,2],
		[6,8,3,5,4,2,1,9,7],
		[2,5,6,9,1,8,4,7,3],
		[3,4,9,2,6,7,8,5,1],
		[8,7,1,4,5,3,9,2,6],
		[5,9,8,6,2,1,7,3,4],
		[7,6,4,3,8,5,2,1,9],
		[1,3,2,7,9,4,6,8,5]];
	show =  [[1,1,1,1,0,0,0,1,1],
		[0,0,1,1,1,1,1,0,0],
		[1,0,1,1,1,0,1,0,0],
		[1,0,0,0,1,0,1,0,0],
		[1,1,0,0,1,1,0,1,1],
		[1,0,1,0,1,0,0,1,0],
		[0,1,0,0,0,0,1,1,0],
		[1,0,1,1,0,0,1,0,1],
		[0,1,1,0,1,1,1,0,0]];
	entry = {array:a, show:show, level:'easy'};
	validate_solution(entry);
	puzzles.push(entry);

	// easy
	a = [[4,2,7,8,6,5,9,1,3],
		[9,1,5,2,4,3,6,8,7],
		[6,8,3,7,9,1,2,5,4],
		[8,7,1,6,2,9,3,4,5],
		[3,4,9,1,5,8,7,2,6],
		[2,5,6,3,7,4,8,9,1],
		[5,9,8,4,3,7,1,6,2],
		[1,3,2,5,8,6,4,7,9],
		[7,6,4,9,1,2,5,3,8]];
	show =  [[0,0,0,1,0,1,0,1,1],
		[0,0,0,1,0,1,1,0,0],
		[1,0,0,0,1,0,1,0,1],
		[0,0,0,0,0,0,0,0,1],
		[0,1,0,1,0,0,1,0,1],
		[1,1,1,1,0,1,1,1,0],
		[1,1,0,0,0,1,1,0,1],
		[1,0,1,0,1,0,1,1,0],
		[0,0,1,1,1,0,0,1,1]];
	entry = {array:a, show:show, level:'easy'};
	validate_solution(entry);
	puzzles.push(entry);

	a = [[6,1,3,8,2,7,9,4,5],
		[2,5,7,6,4,9,1,3,8],
		[9,8,4,5,3,1,2,7,6],
		[4,2,9,1,8,5,3,6,7],
		[3,7,8,9,6,2,5,1,4],
		[5,6,1,3,7,4,8,2,9],
		[8,3,2,4,9,6,7,5,1],
		[1,9,6,7,5,3,4,8,2],
		[7,4,5,2,1,8,6,9,3]];
	show = [[0,0,1,0,1,0,0,0,0],
		[1,1,1,0,1,1,1,0,0],
		[1,1,0,0,1,1,1,0,0],
		[0,1,0,0,0,0,1,0,1],
		[0,0,1,0,1,1,1,1,1],
		[1,0,1,1,1,0,1,0,1],
		[0,1,0,1,1,1,0,0,0],
		[0,1,1,1,0,0,1,1,0],
		[1,0,0,0,0,0,0,0,0]];
	entry = {array:a, show:show, level:'easy'};
	validate_solution(entry);
	puzzles.push(entry);

	// medium
	a = [[8,9,2,3,7,4,5,6,1],
		[5,4,1,9,6,2,3,7,8],
		[3,7,6,1,8,5,4,2,9],
		[2,6,7,5,3,1,9,8,4],
		[1,8,3,6,4,9,2,5,7],
		[9,5,4,8,2,7,6,1,3],
		[7,1,5,4,9,6,8,3,2],
		[6,3,9,2,1,8,7,4,5],
		[4,2,8,7,5,3,1,9,6]];
	show =  [[0,0,0,0,0,0,1,1,1],
		[0,0,1,0,0,0,1,0,0],
		[0,1,0,1,0,0,0,0,0],
		[1,1,0,1,1,0,0,0,1],
		[0,0,1,0,0,1,1,0,0],
		[1,0,0,1,0,1,1,0,0],
		[1,1,0,1,1,1,1,0,1],
		[0,0,0,0,0,0,0,0,0],
		[0,1,1,0,0,1,1,0,0]];
	entry = {array:a, show:show, level:'medium'};
	validate_solution(entry);
	puzzles.push(entry);

	a = [[8,5,9,1,2,6,7,3,4],
		[4,7,6,5,8,3,2,1,9],
		[2,1,3,4,9,7,6,8,5],
		[7,4,2,9,3,1,5,6,8],
		[5,9,1,6,7,8,3,4,2],
		[3,6,8,2,4,5,1,9,7],
		[1,8,7,3,5,4,9,2,6],
		[9,3,4,7,6,2,8,5,1],
		[6,2,5,8,1,9,4,7,3]];
	show = [[1,1,1,0,0,0,1,0,0],
		[1,0,1,0,0,0,0,1,0],
		[1,0,0,0,1,1,0,1,0],
		[1,0,0,1,0,1,0,1,1],
		[0,0,1,0,1,1,0,1,0],
		[0,0,0,0,0,0,0,1,0],
		[0,1,0,1,1,1,1,0,1],
		[0,1,0,0,1,0,1,0,0],
		[0,1,1,0,1,0,1,0,1]];
	entry = {array:a, show:show, level:'medium'};
	validate_solution(entry);
	puzzles.push(entry);

	a = [[3,1,2,6,8,5,4,7,9],
		[9,5,8,7,3,4,1,6,2],
		[6,7,4,2,1,9,5,3,8],
		[5,2,6,4,7,3,8,9,1],
		[4,3,9,8,5,1,7,2,6],
		[7,8,1,9,2,6,3,4,5],
		[2,4,7,5,6,8,9,1,3],
		[8,6,3,1,9,7,2,5,4],
		[1,9,5,3,4,2,6,8,7]];
	show = [[0,0,0,0,0,0,1,0,1],
		[0,0,1,1,1,1,1,0,0],
		[1,1,0,0,1,1,0,1,1],
		[1,1,0,0,1,1,0,1,1],
		[0,0,0,1,0,1,0,1,0],
		[1,0,0,0,0,0,1,0,1],
		[1,1,0,0,0,1,0,1,0],
		[0,0,1,1,0,0,0,0,1],
		[0,0,1,0,0,1,1,0,0]];
	entry = {array:a, show:show, level:'medium'};
	validate_solution(entry);
	puzzles.push(entry);

	// hard
	a = [[2,4,7,5,6,8,9,3,1],
		[1,9,5,3,4,2,6,7,8],
		[8,6,3,1,9,7,2,4,5],
		[4,3,9,8,5,1,7,6,2],
		[7,8,1,9,2,6,3,5,4],
		[5,2,6,4,7,3,8,1,9],
		[3,1,2,6,8,5,4,9,7],
		[6,7,4,2,1,9,5,8,3],
		[9,5,8,7,3,4,1,2,6]];
	show =  [[0,0,1,1,1,0,0,1,0],
		[1,1,0,0,0,0,0,0,0],
		[1,0,1,1,0,0,1,0,0],
		[1,0,0,0,1,1,0,1,0],
		[1,0,0,0,1,0,0,0,1],
		[0,0,0,0,1,0,0,0,0],
		[0,1,0,0,0,1,0,0,1],
		[0,0,1,0,0,0,0,0,1],
		[0,1,0,1,1,0,1,0,0]];
	entry = {array:a, show:show, level:'hard'};
	validate_solution(entry);
	puzzles.push(entry);

	a = [[5,8,6,4,7,2,9,1,3],
		[3,2,4,9,5,1,6,8,7],
		[1,7,9,6,3,8,2,5,4],
		[4,3,7,2,6,5,8,9,1],
		[9,6,2,8,1,7,3,4,5],
		[8,1,5,3,9,4,7,2,6],
		[2,9,1,7,4,6,5,3,8],
		[7,4,3,5,8,9,1,6,2],
		[6,5,8,1,2,3,4,7,9]];
	show =  [[1,1,1,0,1,0,0,0,0],
		[0,0,0,1,0,1,1,0,0],
		[0,0,0,1,0,0,1,1,1],
		[0,0,1,0,0,0,0,0,0],
		[1,0,1,0,1,0,1,0,1],
		[0,0,1,0,1,0,0,0,0],
		[0,1,0,0,1,0,0,0,1],
		[0,0,1,1,0,0,0,1,0],
		[0,0,0,0,1,0,1,1,0]];
	entry = {array:a, show:show, level:'hard'};
	validate_solution(entry);
	puzzles.push(entry);

	a = [[9,2,6,3,4,5,8,7,1],
		[8,5,1,7,2,6,3,4,9],
		[4,7,3,8,9,1,2,5,6],
		[5,6,8,9,1,3,4,2,7],
		[3,4,2,6,8,7,9,1,5],
		[1,9,7,2,5,4,6,8,3],
		[7,3,4,1,6,2,5,9,8],
		[6,8,5,4,7,9,1,3,2],
		[2,1,9,5,3,8,7,6,4]];
	show =  [[0,0,1,0,0,1,0,0,0],
		[1,0,0,0,0,0,0,1,1],
		[0,1,1,0,1,0,1,0,0],
		[0,1,1,0,1,0,1,0,0],
		[1,1,0,0,0,1,0,0,0],
		[0,0,1,1,0,0,0,0,0],
		[1,1,1,0,0,0,1,0,1],
		[1,0,1,0,0,1,1,0,0],
		[0,0,0,1,1,0,0,0,1]];
	entry = {array:a, show:show, level:'hard'};
	validate_solution(entry);
	puzzles.push(entry);

	// filter to current level
	return(puzzles.filter(p => p.level == level));
}

function validate_solution(entry){
	const array = entry.array;
	let row, col, ninth;
	let row_valid=true, col_valid=true, ninth_valid=true;
	// test rows
	for(let i=0; i<9; i++){
		row = array[i].flat();
		const filter = numbers_in_sudoku.filter(x => row.includes(x));
		row_valid = (row_valid && filter.length==9 && row.length==9);
		if(!row_valid)
			break;
	}
	// test columns
	for(let i=0; i<9; i++){
		col = array.map(x => x[i]);
		const filter = numbers_in_sudoku.filter(x => col.includes(x));
		col_valid = (col_valid && filter.length==9 && col.length==9);
		if(!col_valid)
			break;
	}
	// test 9ths
	let r,c;
	const ns = [[r=0,c=0],[r=3,c=0],[r=6,c=0],
		[r=0,c=3],[r=3,c=3],[r=6,c=3],
		[r=0,c=6],[r=3,c=6],[r=6,c=6]];
	for(let v=0; v<ns.length; v++)
	{
		r = ns[v][0], c = ns[v][1];
		ninth = [];
		for(let i=r; i<r+3; i++)
			for(let j=c; j<c+3; j++)
				ninth.push(array[i][j]);
		const filter = numbers_in_sudoku.filter(x => ninth.includes(x));
		ninth_valid = (ninth_valid && filter.length==9 && ninth.length==9);
		if(!ninth_valid)
			break;
	}
	const retval = (row_valid&&col_valid&&ninth_valid);
	if(!retval)
	{
		console.log('row error ',row_valid ? 'none' : row);
		console.log('col error ',col_valid ? 'none' : col);
		console.log('ninth error ',ninth_valid ? 'none' : ninth);
	}
	return retval;
}
