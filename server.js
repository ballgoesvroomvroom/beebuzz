const http = require("http");
const fs = require("fs");

const pinyin_lookup = require("./parsed_pinyin_lookup")

const html = fs.readFileSync(__dirname +"/index.html", "utf-8");
const css = fs.readFileSync(__dirname +"/index.css", "utf-8");
const js = fs.readFileSync(__dirname +"/index.js", "utf-8");

const words = fs.readFileSync(__dirname +"/words.txt", "utf-8");

const app = http.createServer((req, res) => {
	console.log(req.url, req.url.startsWith("/api/pinyin/?q="));
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

		var py = pinyin_lookup[query];
		if (py == null) {
			res.write("");
		} else {
			res.write(py);
		}
	}
	res.end();
})

app.listen(5000, () => console.log("on port 5000"))