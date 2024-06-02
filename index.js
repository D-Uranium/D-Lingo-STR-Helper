try {
	process.env.LESSONS = process.env.LESSONS ?? 1;

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
		"user-agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
	};

	const { sub } = JSON.parse(
		Buffer.from(process.env.DUOLINGO_JWT.split(".")[1], "base64").toString(),
	);

	const { fromLanguage, learningLanguage } = await fetch(
		`https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage`,
		{
			headers,
		},
	).then((response) => response.json());

	// Fetch available skills (units)
	const skillsResponse = await fetch(
		`https://www.duolingo.com/2017-06-30/users/${sub}/skills`,
		{
			headers,
		},
	).then((response) => response.json());

	const skills = skillsResponse.skills;

	let xp = 0;

	// Helper function to introduce a delay
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	// Function to generate a random delay between min and max milliseconds
	const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

	for (let i = 0; i < process.env.LESSONS; i++) {
		// Select a random skill
		const randomSkill = skills[Math.floor(Math.random() * skills.length)];

		const session = await fetch(
			"https://www.duolingo.com/2017-06-30/sessions",
			{
				body: JSON.stringify({
					challengeTypes: [
						"assist",
						"characterIntro",
						"characterMatch",
						"characterPuzzle",
						"characterSelect",
						"characterTrace",
						"characterWrite",
						"completeReverseTranslation",
						"definition",
						"dialogue",
						"extendedMatch",
						"extendedListenMatch",
						"form",
						"freeResponse",
						"gapFill",
						"judge",
						"listen",
						"listenComplete",
						"listenMatch",
						"match",
						"name",
						"listenComprehension",
						"listenIsolation",
						"listenSpeak",
						"listenTap",
						"orderTapComplete",
						"partialListen",
						"partialReverseTranslate",
						"patternTapComplete",
						"radioBinary",
						"radioImageSelect",
						"radioListenMatch",
						"radioListenRecognize",
						"radioSelect",
						"readComprehension",
						"reverseAssist",
						"sameDifferent",
						"select",
						"selectPronunciation",
						"selectTranscription",
						"svgPuzzle",
						"syllableTap",
						"syllableListenTap",
						"speak",
						"tapCloze",
						"tapClozeTable",
						"tapComplete",
						"tapCompleteTable",
						"tapDescribe",
						"translate",
						"transliterate",
						"transliterationAssist",
						"typeCloze",
						"typeClozeTable",
						"typeComplete",
						"typeCompleteTable",
						"writeComprehension",
					],
					fromLanguage,
					isFinalLevel: false,
					isV2: true,
					juicy: true,
					learningLanguage,
					skillId: randomSkill.id, // Specify the skill ID
					smartTipsVersion: 2,
					type: "PRACTICE",
				}),
				headers,
				method: "POST",
			},
		).then((response) => response.json());

		// Simulate time taken for a practice session (random between 81 and 126 seconds)
		const practiceTime = randomDelay(81000, 126000);
		const startTime = +new Date() - practiceTime;
		await delay(practiceTime);

		const response = await fetch(
			`https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
			{
				body: JSON.stringify({
					...session,
					heartsLeft: 0,
					startTime: startTime / 1000,
					enableBonusPoints: false,
					endTime: +new Date() / 1000,
					failed: false,
					maxInLessonStreak: 9,
					shouldLearnThings: true,
				}),
				headers,
				method: "PUT",
			},
		).then((response) => response.json());

		xp += response.xpGain;

		// Delay between practices (random between 8 and 12 seconds)
		if (i < process.env.LESSONS - 1) {
			const breakTime = randomDelay(8000, 12000);
			await delay(breakTime);
		}
	}

	console.log(`🎉 You won ${xp} XP`);
} catch (error) {
	console.log("❌ Something went wrong");
	if (error instanceof Error) {
		console.log(error.message);
	}
}
