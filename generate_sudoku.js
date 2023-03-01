/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* global require exports permutate_puzzle_entry */
const puzzles_db = require('./sudoku_puzzles.js');

exports.generate_new_board = generate_new_board;

const numbers_in_sudoku = [1,2,3,4,5,6,7,8,9];
const empty_cell = 0;

// test();
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
	permutation = permutation.map(e => {
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


function graph(level){
	// graph level progress
	let e = document.createElement('button');
	e.style.width=level*7;
	document.body.appendChild(e);
	e = document.createElement('span');
	e.innerHTML = level;
	e.style.fontSize = 10;
	document.body.appendChild(e);
	document.body.appendChild(document.createElement('br'));
}

function test_creating_sudoku_board(){
	// fill sudoku board with zeros
	const a = Array(9).fill().map(()=>Array(9).fill(empty_cell));
	sudoku_solve(1, a);

}
function sudoku_solve(level, a){
	console.log(level++);
	graph(level);
	// check if finished (all cells are filled)
	if(!a.flat().includes(empty_cell))
		return true; // succeeded solving!
	// choose random empty square
	const [xr,xc] = find_random_empty_square();
	const r = xr, c = xc;
	// put a random (1-w) number in it that does not appear in its row and column
	const candidates = find_eligible_numbers(r,c);
	while(candidates.length)
	{
		a[r][c] = '*'; // debugging purposes
		// choose a random candidate & remove it from the candidates list
		const index = Math.floor(Math.random()*candidates.length);
		const candidate = candidates[index];
		candidates.splice(index,1);
		a[r][c] = candidate;
		// generate next sudoku number
		const retval = sudoku_solve(level);
		if(retval)
			return true;
		else
			a[r][c] = empty_cell; // 'delete' candidate and choose next one (if exists)
	}
	// if no candidates at all, return failure (parent needs to change its candidate)
	return false;
}
function find_eligible_numbers(r,c){
	// get all the numbers from the 1/9th that this r,c is in
	const existing = [];
	let tl_r, tl_c;
	tl_r = Math.floor(r/3)*3, tl_c = Math.floor(c/3)*3;
	for(let i=tl_r; i<tl_r+3; i++)
		for(let j=tl_c; j<tl_c+3; j++)
			existing.push(a[i][j]);
	// add all numbers from the row and column
	const all_nums = existing.concat(a.map(x => x[c]).concat(a[r]));
	// find all numbers from 1..w that don't exist in the existing numbers
	return numbers_in_sudoku.filter(x => !all_nums.includes(x));
}
function find_random_empty_square(){
	let r=-1, c;
	while(r==-1 || (a[r][c]!=empty_cell))
	{
		r=Math.floor(Math.random()*9);
		c=Math.floor(Math.random()*9);
	}
	return [r,c];
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
function test_permutation(){
	const a = [[4,2,7,8,6,5,9,1,3],
		[9,1,5,2,4,3,6,8,7],
		[6,8,3,7,9,1,2,5,4],
		[8,7,1,6,2,9,3,4,5],
		[3,4,9,1,5,8,7,2,6],
		[2,5,6,3,7,4,8,9,1],
		[5,9,8,4,3,7,1,6,2],
		[1,3,2,5,8,6,4,7,9],
		[7,6,4,9,1,2,5,3,8]];
	const show =  [[0,0,0,1,0,1,0,1,1],
		[0,0,0,1,0,1,1,0,0],
		[1,0,0,0,1,0,1,0,1],
		[0,0,0,0,0,0,0,0,1],
		[0,1,0,1,0,0,1,0,1],
		[1,1,1,1,0,1,1,1,0],
		[1,1,0,0,0,1,1,0,1],
		[1,0,1,0,1,0,1,1,0],
		[0,0,1,1,1,0,0,1,1]];
	const entry = {array:a, show:show, level:'easy'};

	// test the permutation
	permutate_puzzle_entry(entry);
}
function test_new_board_creation(){
	sudoku_solve(1);
	validate_solution(a);
}
