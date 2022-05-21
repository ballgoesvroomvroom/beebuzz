const http = require("http");
const fs = require('fs');

const html = fs.readFileSync(__dirname +"/index.html", "utf-8");
const css = fs.readFileSync(__dirname +"/index.css", "utf-8");
const js = fs.readFileSync(__dirname +"/index.js", "utf-8");

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
	}
	res.end();
})

app.listen(5000, () => console.log("on port 5000"))