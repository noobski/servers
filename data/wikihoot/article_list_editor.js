/* eslint-disable no-console */
// eslint-disable-next-line no-undef
const fs = require('fs');
/* open a file called 'article_titles.txt' and read all the titles into an array. if file does not exist, create it */
let titles = [];
const filename = './article_titles.txt';
if (!fs.existsSync(filename)) {
	fs.writeFileSync(filename, '', 'utf-8');
}
else {
	titles = fs.readFileSync(filename, 'utf-8').split('\r');
}

sort_and_delete_duplicates();
mark_top_of_file();
fetch_more_popular_titles(1);

function sort_and_delete_duplicates() {
	titles.sort();
	const new_titles = [];
	titles.forEach((e, i) => {
		if (i === 0) {
			new_titles.push(e);
		}
		else {
			if (e !== titles[i - 1]) {
				new_titles.push(e);
			}
		}
	});
	titles = new_titles;
	fs.writeFileSync('article_titles.txt', titles.join('\r'), 'utf-8');
}
function mark_top_of_file(){
	// add a line to the top of the file to mark the top of the file
	titles.push('-------------------------- TOP OF FILE');
	fs.writeFileSync('article_titles.txt', titles.join('\r'), 'utf-8');
}
function fetch_more_popular_titles(num) {
	fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit='+num)
		.then(response => response.json())
		.then(data => {
			data.query.random.forEach(e => {
				const new_title = e.title;
				console.log(new_title);
				// check if the title is already in the array
				if (!titles.includes(new_title)) {
					// if not, add it to the array
					titles.push(new_title);
				}
			});
			// write the array to the file
			fs.writeFileSync('article_titles.txt', titles.join('\r'), 'utf-8');
		});
}
