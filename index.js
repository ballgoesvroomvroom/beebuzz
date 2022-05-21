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
		// returns the english prompt, answer in chinese and source

		if (this.words.length === 0) {
			// session expired; no more words
			return;
		} else {
			var a = this.words[this.words.length -1];
			this.words.pop(); // more performant than .shift() apparently

			return a.split(/\s*:\s*/gm);
		}
	}
}

$(document).ready(async function() {
	const $selectors = {
		"prompt": $("#prompt"),
		"source": $("#source"),
		"answer": $("#answer"),
		"nextButton": $("#nextButton")
	}

	let sessionObject;
	let cache; // stores the previously returned result by sessionObject.newWord()
	let state = 0; // haven't start; 1 - started (no answers displayed); 2 - answer displayed

	function renderWord(word, source) {
		// clears answer box too
		$selectors["prompt"].text(word);
		$selectors["source"].text(source);

		$selectors["answer"].html("&nbsp");
	}

	function renderAnswer(answer) {
		$selectors["answer"].text(answer);
	}

	async function nextWord() {
		switch (state) {
			case 0:
				sessionObject = new Session();
				if (await sessionObject.isEmpty()) {
					// check first to prevent a recursive loop from occurring if case 2 triggered this callback
					console.error("created session is empty on initialisation");
					return;
				}

				state = 2
				nextWord(); // recall it

				break
			case 1:
				renderAnswer(cache[1]);
				state = 2;

				break
			case 2:
				if (await sessionObject.isEmpty()) {
					// careful, might trigger a recursive chain if condition isn't handled properly
					state = 0;
					return nextWord();
				}
				cache = sessionObject.nextWord();
				renderWord(cache[0], cache[2]);
				state = 1;

				break
		}
	}

	$(document).on("keydown", e => {
		if (e.keyCode == 13) {
			// enter key
			e.preventDefault();
			nextWord();
		}
	})
	$($selectors["nextButton"]).on("click", e => {
		nextWord();
	})
})