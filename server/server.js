const http = require("http");
const path = require("path");
const fs = require("fs");

const publicpath = path.join(__dirname, "../public")
const html = fs.readFileSync(path.join(publicpath, "/index.html"), "utf-8");
const css = fs.readFileSync(path.join(publicpath, "/index.css"), "utf-8");
const js = fs.readFileSync(path.join(publicpath, "/index.js"), "utf-8");

const pinyin_lookup = require("./parsed_pinyin_lookup")
const preparsed_words = fs.readFileSync(__dirname +"/words.txt", "utf-8");

function getPinyin(word) {
	// only parse words that contains words only; not punctuations (may have unexpected behaviour)
	var py = pinyin_lookup[word];
	if (py == null) {
		// no pinyin matching for this query (could be a very odd phrase)
		// fallback to matching pinyin for individual word, not accurate (will implement another method soon)
		var individual_py = ""; // build new pinyin
		for (let i = 0; i < word.length; i++) {
			var char = word[i]; // individual character from the query
	
			var char_py = pinyin_lookup[char];
			if (char_py == null) {
				individual_py += "- "; // represent not found for this word
			} else {
				individual_py += char_py +" ";
			}
		}
	
		py = individual_py.slice(0, -1); // remove trailing whitespace from last iteration
	}

	return py;
}

// parse words ('attach' pinyin to the end with delimiter ' : ')
let words;
let lines = preparsed_words.split(/\r?\n/gm);
for (let i = 0; i < lines.length; i++) {
	var line = lines[i];

	var d = line.split(" : ");
	var chineseWord = d[1];

	words += line +` : ${getPinyin(chineseWord)}\n`;
}
// remove trailing whitespace else client will parse it as empty data and still display it
words = words.slice(0, -1);

const app = http.createServer((req, res) => {
	if (req.url == "/index.js") {
		res.setHeader("Content-Type", "application/javascript");
		res.write(js);
	} else if (req.url == "/index.css") {
		res.setHeader("Content-Type", "text/css");
		res.write(css);
	} else if (req.url == "/") {
		res.setHeader("Content-Type", "text/html");
		res.write(html);
	} else if (req.url == "/api/words") {
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.write(words);
	} else if (req.url.startsWith("/api/pinyin/?q=")) {
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		let query = req.url.slice("/api/pinyin/?q=".length);
		query = decodeURI(query); // query is urlsafe encoded by default

		py = getPinyin(query);

		console.log(query, py)
		if (py == null) {
			// shouldn't be null no more, at most just dashes
			res.write("");
		} else {
			res.write(py);
		}
	}
	res.end();
})

app.listen(5000, () => console.log("on port 5000"))