/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* global require exports  */
const puzzles_db = require('./sudoku_puzzles.js');

exports.generate_new_board = generate_new_board;

const numbers_in_sudoku = [1,2,3,4,5,6,7,8,9];
const empty_cell = 0;

// test();
// eslint-disable-next-line no-unused-vars
function test(){
	for (let i=0; i<1000; i++)
	{
		const e = generate_new_board('hard');
		if(e.show.flat().filter(c => c != 0 && c != 1).length)
		{
			console.log(i+' ===== ',e.show);
		}
	}
}
// puzzle entry: {array:a, show:show, level:'easy'}
function generate_new_board(level){
	// choose a seed according to level
	const level_seeds = puzzles_db.load_puzzles(level);
	let entry = level_seeds[Math.floor(Math.random()*level_seeds.length)];
	// permutate the seed
	const p = create_random_permutation();
	entry.array = permutate(entry.array, p);
	// spin the seed 0-3 times
	const spins = Math.floor(Math.random()*4);
	for(let i=0; i<spins; i++)
		entry = rotate_puzzle_entry(entry);
	// return a new entry
	return entry;
}
// eslint-disable-next-line no-unused-vars
function print_board(entry){
	const a = entry.array, show = entry.show;
	[a, show].forEach(array => {
		array.forEach(r => {
			let row = '';
			r.forEach(c => row+=c+', ');
			console.log(row);
		});
		console.log('');
	});
}
function create_random_permutation(){
	// create random permutation
	let permutation = new Array(9).fill(0);
	let n=1;
	const numbers=new Array(9).fill().map(() => n++);
	permutation = permutation.map(() => {
		const index = Math.floor(Math.random()*numbers.length);
		const v = numbers[index];
		numbers.splice(index,1);
		return v;
	});
	return permutation;
}
function rotate_puzzle_entry(entry){
	entry.array = rotate_90(entry.array);
	entry.show = rotate_90(entry.show);
	return entry;
}
function permutate(a, permutation){
	return a.map(r => r.map(cell => cell = permutation[cell-1]));
}
function rotate_90(a){
	const b = Array(9).fill().map(()=>Array(9).fill(empty_cell));
	for(let r=0; r<9; r++)
		for(let c=0; c<9; c++)
			b[c][8-r] = a[r][c];
	return b;
}
// eslint-disable-next-line no-unused-vars
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
	let r, c;
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
	console.log(entry.level, retval);
	return retval;
}
