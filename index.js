const words = `wise : 智慧 : 12
forgiving : 宽容大量 : 13
self centered : 自私/自我为中心 : 14
adamant : 我行我素 : 15
perseverance : 坚持到底/有毅力/有恒心 : 16
positive : 乐观、正面积极 : 17
charismatic : 有魅力 : 6
extroverted : 外向 : 7
introverted : 内向 : 8
easy going : 随和 : 9
aggressive : 好胜 : 10
shy : 害羞 : 11
calm : 冷静 : 1
impulsive : 冲动 : 2
arrogant : 傲慢/骄傲 : 3
humble : 谦虚/谦卑 : 4
eccentric : 古怪 : 5
negative : 悲观消极 : 18
strong sense of pride : 自尊心强 : 19
easily contented: 知足常乐 : 20
be contented in poverty and devote to things spiritual; live contentedly as a poor scholar; happy to lead a simple virtuous life : 安贫乐道 : 21
speculate and take advantage of opportunity; resort to dubious shifts to further one’s interest; seize every chance to gain advantage by trickery : 投机取巧 : 22
change one’s view according to circumstances jump on the bandwagon : 见风使舵 : 23
resourceful; be wise and full of stratagems : 足智多谋 : 24
kind hearted and helpful : 有爱心、乐于助人 : 27
filial : 孝顺 : 28
irresponsible : 没有责任感/敷衍塞责 : 29
ungrateful : 忘恩负义 : 30
disciplined : 有自律的人 : 31
kind : 善良 : 32 
honest : 诚实 : 33
strong-willed : 坚强 : 34
courageous : 勇敢 : 35
generous, not stingy : 慷慨大方 : 36
stubborn : 固执 : 37
keep to his words : 有诚信 : 38
patient : 耐心 : 39
full of loving kindness, usually refers to the love of parents/adults to their children or teachers to their students : 慈爱 : 40
expect nothing in return : 不图回报 : 41
easily suspicious of things : 疑心重 : 42
temperamental / frequent mood swings : 情绪化 : 43
bad tempered : 性格暴躁 : 44
humorous : 风趣、幽默 : 45`

class Database {
	static alreadyInit = false;
	static parsedWords;

	static initialise() {
		this.alreadyInit = true;
		this.parsedWords = words.split(/\r?\n/gm);
	}

	static getWords() {
		// returns a copy of the parsed words
		if (!this.alreadyInit) {
			this.initialise();
		}

		return [...this.parsedWords];
	}
}

class Session {
	constructor() {
		this.words = Database.getWords();

		// jumble up array
		var upperLimit = this.words.length;
		for (let i = 0; i < this.words /2; i++) {
			var [a, b] = [Math.floor(Math.random() *upperLimit), Math.floor(Math.random() *upperLimit)];
			[this.words[a], this.words[b]] = [this.words[b], this.words[a]]
		}
	}

	isEmpty() {
		// returns true if session has no more data
		return this.words.length == 0;
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

$(document).ready(function() {
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

	function nextWord() {
		switch (state) {
			case 0:
				sessionObject = new Session();
				if (sessionObject.isEmpty()) {
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
				if (sessionObject.isEmpty()) {
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