const words = fetch("/api/words", {
	method: "GET"
}).then(r => {
	if (r.status == 200) {
		return r.text();
	} else {
		throw Error(`server returned status ${r.status}`);
	}
});

class Database {
	static alreadyInit = false;
	static parsedWords;

	static initialise() {
		return words.then(d => {
			this.parsedWords = d.split(/\r?\n/gm);
			this.alreadyInit = true;
		})
	}

	static getWords() {
		// returns a copy of the parsed words
		if (!this.alreadyInit) {
			return this.initialise().then(() => {
				return [...this.parsedWords];
			});
		}

		return new Promise(res => res([...this.parsedWords]));
	}
}

class Session {
	constructor() {
		// get a copy
		this.ready = Database.getWords().then(d => {
			this.words = d;

			// scramble array so it has a random order
			var upperLimit = this.words.length;
			for (let i = 0; i < this.words.length /2; i++) {
				var [a, b] = [Math.floor(Math.random() *upperLimit), Math.floor(Math.random() *upperLimit)];
				[this.words[a], this.words[b]] = [this.words[b], this.words[a]];
			}
		});
	}

	isEmpty() {
		// returns true if session has no more data
		return this.ready.then(() => {
			return this.words.length == 0;
		});
	}

	nextWord() {
		// returns a promise that returns the english prompt, answer in chinese, source, and pinyin

		if (this.words.length === 0) {
			// session expired; no more words
			return;
		} else {
			var a = this.words[this.words.length -1];
			this.words.pop(); // more performant than .shift() apparently

			let d = a.split(/\s*:\s*/gm);
			console.log(d[1], {"word": d[1]})
			return fetch("/api/pinyin/?q=" +d[1], {
				method: "GET"
			}).then(r => {
				if (r.status == 200) {
					// server will return "" if cannot find the pinyin for the word specified or malformed input etc
					// just not an error status code
					return r.text();
				} else {
					console.log("server returned status code != 200 while querying for pinyin")
					return ""
				}
			}).then(pinyin => {
				d.push(pinyin);
				return d;
			})
		}
	}
}

$(document).ready(async function() {
	const $selectors = {
		"prompt": $("#prompt"),
		"source": $("#source"),
		"answer": $("#answer"),
		"answerbox": $("#answerbox"),
		"pinyin": $("#pinyin"),
		"nextButton": $("#nextButton")
	}

	let sessionObject;
	let cache; // stores the previously returned result by sessionObject.newWord()
	let state = 0; // haven't start; 1 - started (no answers displayed); 2 - answer displayed

	let triggered = false; // debounce value
						 
	function renderWord(word, source) {
		// clears answer box too
		$selectors["prompt"].text(`[ ${word} ]`);
		$selectors["source"].text(source);

		// $selectors["answer"].html("&nbsp");
		$selectors["answerbox"].text();
		$selectors["pinyin"].text();
	}

	function renderAnswer(answer, pinyin) {
		$selectors["answerbox"].text(answer);
		$selectors["pinyin"].text(pinyin)
	}

	async function nextWord(...forced) {
		if (triggered && (forced.length === 0 || forced[0] == false)) {
			return;
		}

		triggered = true;
		switch (state) {
			case 0:
				sessionObject = new Session();
				if (await sessionObject.isEmpty()) {
					// check first to prevent a recursive loop from occurring if case 2 triggered this callback
					console.error("created session is empty on initialisation");
					return;

					// don't reset debounce
				}

				state = 2;
				nextWord(true); // recall it (true to bypass debounce)

				break
			case 1:
				renderAnswer(cache[1], cache[3]);
				state = 2;

				triggered = false; // reset debounce

				break
			case 2:
				if (await sessionObject.isEmpty()) {
					// careful, might trigger a recursive chain if condition isn't handled properly
					state = 0;
					return nextWord(true);
				}
				sessionObject.nextWord().then(d => {
					cache = d;

					renderWord(cache[0], cache[2]);
					state = 1;

					triggered = false; // reset debounce
				});

				break
		}
	}

	$(document).on("keydown", e => {
		if (e.keyCode == 13 || e.keyCode == 32) {
			// enter key (13) or space (32)
			e.preventDefault();
			nextWord();
		}
	})
	$($selectors["nextButton"]).on("click", e => {
		nextWord();
	})
})