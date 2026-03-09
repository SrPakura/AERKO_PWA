<div align="center">
  <h1>Aerko_</h1>
</div>

<div align="center">
  <img src="icon-512.png" alt="Aerko_ Logo" width="256">

 The most advanced fitness web app in history.
</div>

---

Aerko_ is a web application that can be installed natively as a PWA. It combines advanced nutrition, training, and progress tracking with an obsessive focus on local privacy, performance, and usability. All of this with the sole purpose of bringing respect back to users in a market flooded with basic, monthly-subscription CRUD apps. I'm going to talk about all of this in depth following this order:

### Index
* [1. Design Philosophy & UX](#1-design-philosophy--ux)
* [2. Main Features](#2-main-features)
*[3. Languages & Personalities](#3-languages--personalities)
* [4. Privacy & Security](#4-privacy--security)
* [5. Installation & Use (PWA)](#5-installation--use-pwa)
* [6. Architecture & Tech Stack](#6-architecture--tech-stack)
*[7. The Role of AI in Development](#7-the-role-of-ai-in-development)
* [8. Roadmap](#8-roadmap)
* [9. Acknowledgments & Credits](#9-acknowledgments--credits)

---

## 1. Design Philosophy & UX

> **Wall of text warning:** As a product designer, I'm going to get really heavy-handed here just in case you want to skip this part. I'm going to use design terms and laws that I'll assume you know perfectly well. You've been warned, and *musho betis*.

### The Basics:
To make this app I didn't say to myself: *"Hey, what do I need to work out?"*. In fact, the reality is sadder: it started as my Master's Thesis (TFM). But why am I saying this? Because I'm getting sidetracked. The foundations of the project follow a **Design Thinking** approach with a **double diamond** methodology (goodbye to 90% of the people who were reading this, I forgive you for scrolling past). I did this not only to search for information for the netnography, but by actually interacting with the community itself on Reddit. 

From posts created specifically to solve initial questions or gather data, to surveys and usability tests *(sadly I only managed to get 2 members on Reddit, so please join the community. Thanks)*. I'm specifying this so you know I didn't just do whatever the hell I felt like (well, partly yes, xd), but I built a tool with features proposed by the community that I genuinely think can be useful. But let's stop writing nonsense and start talking about what we love: the visuals.

### UI: 
For the interface, I used a combination of **brutalism** (or neo-brutalism, depending on how you look at it), utilitarianism, and finally, a **cyberpunk/terminal/IDE aesthetic** that I absolutely love. I'm fully aware that the UI won't be to everyone's taste (specifically the *casuals* who have been at the gym for 3 days), but hey, I'm the designer here >:)

* **Color Palette (60-30-10):** 
    * ⬛ **Soft Black** (`#1A1A1A`) - Dominant background.
    * ⬜ **White** (`#FFFFFF`) - Text and contrasts.
    * 🟩 **Acid Green** (`#CCFF00`) - Accent. 
    *(Each with an extra color for the `hover` state. And yes, I made hovers on a mobile-first project, not because I'm an idiot (which I am), but because I plan to make special screens and features for PC. Hold your tomatoes).*
    
* **Typography and Hierarchy:** The love of my life, **JetBrains Mono**, combined with **Clash Display**. Since I legally couldn't include the Clash Display files in the repository, I put **Space Grotesk** as a *fallback*. These fonts not only prevent you from getting tired of reading numbers, but they formalize the hierarchy itself using the **perfect fourth** as a scale.

* **Contrast and Speed:** This style has brutal contrast both in brightly lit gyms and in dark basements. Also, it imposes authority (just in case you want to show off that your 1RM is 1521kg and have people believe you. I've already done it and they didn't believe me, but almost). On top of that, the feeling of extreme speed is something that honestly gives me a lot of satisfaction.

### UX: 
Here comes the part I like the most: **the app is idiot-proof**. Exaggerations, jokes, and ego aside, the app is visually intimidating, but it hides all the difficult calculations behind extremely simple functions (to the point that my parents know how to use the nutrition and progress modules). The only exception is training due to the scientific terms, but once you know them, it's a walk in the park again. Everything has been coldly calculated by my schizophrenic mind based on Jakob Nielsen's 5 usability components (which you clearly know), absolutely prioritizing **Efficiency**. 

* **Thumb-Driven Design:** Since I have small hands, I used my own thumb as a reference. If I can reach it, you can reach it (a law of life studied by Harvard University).

* **Custom Anti-Shake Keyboard:** Designed for when you end up dizzy after a heavy set of squats *(because you train legs, right?)*. The buttons are huge (I'd even say gigantic... In case you don't get it, I'm making a joke implying my member is the size of the button. Yes, you can report me) and have *anti-shake* logic to prevent you from pressing the same number twice in a matter of milliseconds. Add to this buttons in other sections with exaggerated padding for easy reach.

* **The MediaPipe Sacrifice:** A decision for which you are going to crucify me: MediaPipe only works with recordings, not live. This isn't on a whim, but to be able to implement the optimization that I will proudly talk about later and **not drain your battery while you're out**, and yes, this decision was strictly necessary.

But let's stop talking about silly things like those that you can easily understand, let's get into the theory. As I said before, efficiency is prioritized throughout the entire app. We could define the app's philosophy as: put in the effort once, and enjoy the rest of the time.

* **Diet and Routine:** You make your diet once, and until you change it, you only have to press 3 buttons a day (6 if you weigh your food xd). The same goes for the routine.

* **Transversal Data (The Iniesta of the app):** Everything is connected. If you log your weight, the diet recalculates itself. If you log a set, the app suggests the optimal weight for the next session based on your mesocycle's goal. If you fail or accumulate fatigue, the app adjusts the weight based on your history and goals (mesocycles). 

(And I think I'm going to stop here before I write a thesis explaining Fitts's Law, which I already know you don't care about).

---

## 2. Main Features

Alright, this part is very long, and I won't lie to you, I'm feeling lazier about it than you can imagine. That being said, I'm simply going to make a crappy list (well, in the end I decided to add emojis so you won't complain, look how nice I am) until I reach a feature I actually want to brag about.

### 🍎 Nutrition

* **Wizard and calculators:**
    * **Base scientific calculation:** If you are a normal person and you are too lazy to calculate your macros, don't worry. The app, through a very simple wizard, collects your data (this sounded terrible) and uses the Harris-Benedict formula (the 1984 one, because as you'll know if you read the code, I'm very retro) to calculate calories with an ideal range so you don't kill yourself trying to hit an exact number (which is stupid). Macros are calculated using scientific ratios from an entity called ISSN; maybe you bumped into them buying bread one day.
    * **God Mode:** Does my wizard, the Harris-Benedict formula, or even my app disgust you? Rest easy, because I let you input calories and macros manually.
    * **Reactive recalculation:** If you made the diet using the wizard and you log a new body weight in the progress module, the diet recalculates itself. If you're in God Mode, you do it yourself manually, you show-off.

* **The Pantry (hopefully full):**
    * **Hybrid database and barcode scanner:** Thanks to BEDCA, USDA, and Open Food Facts (not counting, of course, my effort to manually compile foods and create the `.json`), you have access to a local database of, if I remember correctly, +340 foods. Anyway, you won't need it since we have native integration of the OFF API to read barcodes and log foods automatically, without you having to type much.
    * **Group management:** Also, we all know that a meal isn't just "chicken breast" and that's it, a *serranito* has more things in it. That's why you can combine them into a group so your head doesn't explode checking off 4 foods at the same time. 

* **Modular design and Smart Checks:**
    * **Base diets and notifications:** Inspired directly by Figma's master components and Pareto's law. We all eat the same things, but not exactly the same; that's why you can configure the foods you normally eat, the meals, and the weight of each food. That being said, meals also have the ability to send notifications via the *Notification Triggers API*, which looking at the name I can already guess doesn't work on iOS. Anyway, I haven't tested it, so it might not work on Android either. Very professional, I know.
    * **Fixed and variable weights:** A food (regardless of whether it's individual or part of a group) can be configured as fixed (e.g., I always eat 600g of chicken breast), or variable. And what is variable? Well, you input the amount each day.
    * **Zero friction flow:** Literally. A screen with an accordion per meal, so you can quickly check off the foods you previously configured in record speed (compared to other apps that make you search for the food every day as if you were...). And that's it. 
    * **Visual dashboard:** Ugh, I'm too lazy to add this. Yes, a progress bar that visually changes to indicate the amount of kcals. It changes to a friendlier version in Zen mode. There are also 3 lite bars for macros.

### 🏋️ Training 

* **Smart Flow and progression:**
    * **Flow with native and adjustable rests:** So you don't have to leave the app, the flow is as simple as creating a routine, starting the diet, doing the exercises, and little else. During the rest period of each exercise you log the data, you have a stopwatch, it notifies you if you hit a PR (based on e1RM), and more (the crappiest way to say I don't want to write anymore).
    * **Recommendation engine:** Yep, if you configure the mesocycles (relax, it's literally just clicking two buttons) the app learns from you. It sees what kind of sets you do (straight sets or reverse pyramid), fatigue patterns (simply put, if you dropped the weight last week), and the next time you do that exercise it recommends the weight. All so you don't have to think, huh.

* **Volume analysis:**
    * **Scientific weekly volume (traffic lights):** It cross-references your effective sets (because yes, it can detect warm-ups) with a master anatomical database ("master" is the nicest marketing term I found to avoid saying they can be as inaccurate as equations solved by a 7th grader) that tells you exactly what threshold you are in for each muscle (MV, MEV, MAV, or MRV).
    * **Imbalance Detector:** Again, this could fail because of the database, but assuming it doesn't because I put a lot of love into it, it analyzes the percentage of volume each muscle head gets. So if it notices you're a gorilla who skips calves, it's going to tell you so you can fix it. 

* **Modular planning and calculators:**
    * Just like before, here you simply create the routine with the exercises and that's it. You can create exercises manually and little else I feel like writing.
    * **Adaptive 1RM Calculator:** A work of art. Uses the Brzycki formula for under 5 reps, Epley for 6-10 reps, and Lombardi for the rest. 

#### 🦾 MediaPipe (The Crown Jewel)
Here I am going to stop because this is what I'm most proud of. You record your Squat, Bench Press, or Deadlift sets, and if you recorded it right, the model gives you a realistic score from 0 to 100. Mind you, I say *right*, because MediaPipe (especially, very especially, the Lite model) doesn't do magic. If you record yourself from the side for a bench press, it won't work, and if you record yourself from the front for a squat, MediaPipe is going to do backflips. 

But since I know you guys are absolute legends, I know you'll do it right, and that, depending on the exercise, it will measure several things for you, like ROM, angles, sticking points, bar path, forearm stability, lockout, tempo, etc... 

But wait, I didn't come here to say that crap, but to talk about the mental orgasm I had while doing the optimization. The first and most logical thing is to throw MediaPipe into a Web Worker so it doesn't freeze the screen, but of course, does MediaPipe consider that a possibility? Nope, it demands to interact with the DOM. So to trick the model (to teach it its place), I simply **built a phantom DOM**, and boom, tamed. 

But it doesn't end there, because if it was just that, I wouldn't be writing this. Processing a 1080p 60fps video is unnecessary (the model itself scales down the resolution), so, to take the load off the model and improve speed without killing your processor, I built logic similar to how Ping-Pong works. First, the video is downscaled to 720p or 480p, I don't remember right now, and the framerate is dropped to 15-30fps through a traffic controller that sends a frame, and waits for the `"FRAME_DONE"` signal to send the next one. 

Then, so as not to display a choppy 15fps video, the points are mathematically interpolated (the culprits of the lag you'll see analyzing videos, but don't worry because it only affects visuals, not calculations) and an EMA filter is applied to smooth the coordinates between frames. What does this mean? That if the video is good, the difference between *Full* and *Heavy* is noticeable, but barely. 

I'd post a benchmark, because yes, I tested it with all 3 models, but I'll pass. I'll simply tell you the differences: if we consider *Heavy* to be 100% accurate, *Full* is between 87% and 94% accurate, while *Lite*... Well, 59-71%. All this based on analyzing the same video 5 times on each model. And here ends this marvel.

### 📈 Progress

* **Anti-obsession system:** Pretty sad that I have to brag about this, but yes, the app has a *dynamic cooldown* (20 hours for Default and Tsundere modes, 1 week for Zen) when logging weights. This is to prevent users from developing the *"Why did I gain weight if I didn't eat?"* syndrome and the like. 
* **Data entry:** Allows basic biometrics data entry (weight, height, body fat percentage, photo), perimeter measurements, and skinfolds. All this inside the app, locally. 
* **Scientific fat calculator:** If you use a caliper, you don't have to do math. The app takes the skinfolds you put in (you can log them on the spot too) and, using the Jackson-Pollock 3/7 formula, calculates your body density alongside Siri's equation. 
* **Visual dashboard:** With all due respect, I am too lazy to write this. There are a lot of charts and a half-assed *Wrapped*. That's it.

### ⚙️ System

* **Modes:** There are 3 modes, each with its own quirks.
* **Easter Eggs:** Internal comments in the code talking about my personal life, love life, and other stuff, just in case you want to gossip. 
* **Transversal data:** I already explained this before with the diet example (The Iniesta of the app).
* **Universal migration:** You can import data from Hevy, Strong, Lifta, Apple Health, Google Fit, or Samsung Health (and obviously from Aerko_) with parsers that are *supposed* to be able to inject them without issues... though who knows, they might explode. 
* **Privacy and security:** The thing that gave me the most nightmares due to a sequence of random bugs. Basically, the whole app lives in IndexedDB, but with the ability to protect it with heavy-duty cryptography (`AES-GCM`). It basically uses the native `window.crypto.subtle` API with key derivation (`PBKDF2`), so your 4-digit PIN goes through 100,000 mathematical iterations combined with a unique salt generated on your device. There's also an *auth canary* system to verify the PIN is correct without exposing real data.
* **RAM Isolation:** Since I'm not an idiot, I don't save the master key on the hard drive; it only exists in volatile memory (RAM for friends) while you have the session open.  
* **Data loss:** That being said, if you forget your PIN, unless you're a fan of brute force, recovering your data is going to cost you a little too much. 
* **Export:** You can export everything you've done into a `.json` file. If you have encryption enabled, it decrypts in RAM to keep the local database bulletproof. And remember: if an app gives you *vendor-lock*, burn it. 
* *I don't remember anything else, but I'm sure there's more.*

---

## 3. Languages and Personalities

Obviously, making an app and translating it isn't enough, that's for *normies*. I also made modes where not only the behavior of the app changes, but also how it talks to you. In this case, the Default mode is translated into Spanish (native), English, Portuguese, German, and French (the latter via AI). 

But before we continue, let's talk about the personalities. There are basically 3 modes:

* **Default:** Classic, boring, straightforward.
* **Zen:** Designed specifically for kind experiences and avoiding EDs (Eating Disorders). Understanding texts, no pressure, and no visual penalties.
* **Tsundere:** Honestly "Tsundere" is false advertising, but if I give it the name it deserves, I might get sued sooner than expected. Basically: maximum hostility, dark humor, and constant humiliation, whether you deserve it or not. 

Mind you, the engine (`i18n.service.js`) is smart for several reasons that I'm going to tell you with very low energy:

* **Dynamic loading:** To avoid loading all the texts of all the languages of all the modes of all the screens at once, the app only imports the text fragment of the exact screen the user is looking at in that moment. 
* **Smart fallback and cross-mode compatibility:** There is something important here, and it's that it always loads the base file (Default) first, and then tries to load the specific mode's file. What does this mean? That you can use Zen mode in English (for example) to take advantage of its UX benefits and progress rules, but since it isn't translated, the system doesn't break: it will simply show you the texts from the Default mode. 

I could keep bragging about more things, like the random insult collection system for the Tsundere mode, but I'm going to deliver the bad news: **the Tsundere and Zen modes are not translated into other languages** (only in Spanish). 

I am incredibly sorry, but understand me: if I translate dark humor or gym jokes with a generic AI, it could spit out contextless atrocities that would only make the app look bad, waste my time, and for nothing (since the app supports the modes without breaking the text thanks to the fallback). If you want to contribute to the project, this is the best way to do it, honestly.

---

## 4. Privacy and Security

I've partially explained this already, but well, let's go for more, right? Let's take it easy and with low energy again because believe me, making GitHub READMEs is not exactly my favorite Sunday activity (I'm more into taking photos of sparrows with my camera, but anyway, that's too much information):

* **Offline-first and zero cloud:** The app has no backend (and thank goodness, because if I had to pay for a server on top of it all, not even harvesting your data would make the math work). Absolutely everything lives in the browser via `IndexedDB`. Now then, you already know this, let's talk about security.
* **Native Cryptography (Military Grade):** How about that? That "Military Grade" is a clear *power word* to make you think I'm smart now, eh? Sorry for the delusion. As I explained before, I implemented the browser's native Web Crypto API to use the industry standard 256-bit `AES-GCM`.
* **Key Derivation (`PBKDF2`):** A simple 4-digit PIN is not secure *per se*, and that's exactly why the PIN goes through the `PBKDF2` algorithm with 100,000 iterations, and is combined with a randomly generated salt (since I'm a pedant, I'll say it: it's not random, pure randomness doesn't exist in computers. You're welcome) by your phone to create a master key. 
* **Volatile Isolation (RAM):** Since I already explained this before, I don't know what I'm doing. Basically, the key only exists in RAM. When you close the tab, the key does an `rm -- "$0"` (in case you don't get it, that makes a script delete itself after running, I think).
* **The Canary:** To verify that the PIN is correct without exposing actual data, the app tries to decrypt a small package containing the text `'AERKO_SECURE'` (my bad for not putting an easy troll phrase there). 
* **Segmented Vaults:** All data is divided into vaults that can be encrypted (`user_vault`, `nutrition_vault`, `training_vault`, and `progress_vault`) and a `public_store` to put configuration data. 

And that's it, thank goodness because what a pain in the ass to repeat the same thing, this feels like a biology presentation.

---

## 5. Installation and Use (PWA)

Aerko_ is a web application, but don't screw with me, using it from the browser is an insult when it's designed from the ground up to be a native PWA. It is meant to live on your home screens (whether Tim Cook likes it or not), run full-screen, and work 100% offline. 

### Android
If you want to install it on Android you can do it from the app settings (I put the button there), or if you're in a hurry, when you enter simply hit the **3 dots** (browser menu) > **Add to home screen** > **Install**. 

### The iOS Drama
If you want to install it from iOS... Well, you guys do have to eat the manual steps. If you read the code you'll see I didn't just limit myself to making a simple screen with the explanation. But anyway, if I'm not mistaken, the steps are:

1. Open the web from **Safari** (mandatory, Apple things).
2. Tap the **Share** button (the little square with the arrow pointing up).
3. Select **Add to Home Screen**.

---

## 6. Architecture and Tech Stack

If you expected to come in and find a `package.json` with 400 dependencies, a `node_modules` folder, or something like that, please say "musho betis" as an apology. I hate most frameworks; at most I'd say I like Astro, but I don't think using it was even possible in this case. I could criticize React, Angular, or others, but who am I to do so? In any case, I chose the "hard" path (you'll understand the quotes later) because it is the optimal path. 

### Stack
* **Vanilla JS:** I put "Vanilla", but I think the fact that I'm using libraries means it's not Vanilla anymore. If so, excuse me, insult me, or report me, I deserve it. 
* **Native Web Components:** The entire modular interface was built by extending the `HTMLElement` class and using the native `customElements.define` API. I used a mix of Shadow DOM and Light DOM that, if I'm honest, not even I understand, but I'm sure if you ask an AI it will tell you it makes some sort of sense (or so I hope). 
* **Native Database:** Yep, mentioning again that I use `IndexedDB`, but here I clarify that I used my own asynchronous *wrapper* so I wouldn't hang myself managing promises. 
* **Pure CSS:** Obviously, no Tailwind, Bootstrap, or any of that weird stuff. Native CSS files using variables. 

### Key Libraries
Only the essential ones, and please, nobody tell me "I could have written them myself".
* **MediaPipe Vision (`vision_bundle.js`):** Google's computer vision masterpiece (trying not to sound like a kiss-ass here), successfully hijacked and hacked.
* **Chart.js:** I would have preferred to post a meme rather than write a canvas library to draw biomechanical radars and dual-axis charts from scratch. Sorry, I guess. 
* **HTML5-QRCode:** Yes, I know there is a native API to read barcodes, but again, I don't think it will be very compatible with iOS until 2034.
* **JSZip:** Fundamental for the import system without forcing the user to manually unzip `.zip` files.
* **SortableJS:** I'm not Newton, so with this I inject the physics and laws of thermodynamics of *drag & drop*.

---

## 7. The Role of AI in Development

Now you're going to understand the quotes around "hard" due to the huge role AI played in this project. You already read about the Default mode translations, but let's see what else. However, let's start with what is 100% human so you don't abandon the repo here:

### 100% Human Stuff
* **Design Thinking, UX, and UI:** The previous research, the design, the heuristics, the logic and functions, the information structuring, and a long etcetera were born purely out of my head, from Design Thinking research, and Figma. 
* **Architecture and Technical Decisions:** The flat refusal to use frameworks, the use of `IndexedDB` (because Gemini even recommended using SQLite compiled in WASM and I said no), the optimization, and a long list of architectural decisions. 
* **Copywriting and Personalities:** The over 1000 lines of insults, sarcasm, humiliations, and generic lines in Spanish that almost made me break my keyboard (in fact, the "A" key sounds weird now), all written by me and straight from my head. 

### The Code (The Magic of AI)
Now let's get to the code, for which I used **Gemini 3.0 Pro** from the beginning up to about halfway through the training module. Then **Gemini 3.1 Pro** came out and took over from MediaPipe to the end. 

Now then, how much code was generated? Well, approximately **85-90% of the code has been banged out by AI**. What I wrote the least was the JS, since Gemini did a surprisingly good job (it's also true that the explanations I gave it were pretty clear). What I had to touch up manually the most was the CSS. It's all true: Gemini doesn't have access to Figma or my measurements and, no matter how much I pass them in text, it doesn't quite catch them fully. 

**The supervision was extreme.** I didn't use prompts like: *"Hey, continue my app. Thanks cutie <3"* (I wish). Instead, it was explained modularly exactly what it had to do on a technical level, and the model itself developed it. On the other hand, I can attest that I've read and reviewed almost all the code, except for a *fix* at the very end of the app that, well... if it works, don't touch it. 

Let's remember my primary profession is Product Designer. AI is the big reason why I didn't have to spend thousands of euros hiring a dev team, nor did I spend 2 years hand-coding this (in fact, it was free thanks to Google One Students, although mentally I think I came out wounded).

---

## 8. Roadmap (Or what I'd like to do if I had the time)

I'll give you a spoiler: I want to trash this code. I am traumatized by it. The most I want to do right now is fix bugs (I'll take responsibility for that until 2027), but for the next version it's 99% likely that I'll rewrite the code from scratch, but better. 

I'll probably wait for Gemini 3.2 or 3.3 Pro to come out. Well, more than waiting for a model to drop, I'll wait until I have enough money to be able to spend 7 weeks developing full-time, because after this app I start working 💀

But anyway, what do I want to add in the future?

### Nutrition
* **Filters in the food search:** The `.json` is already prepared for this, so I might surprise you and update it one of these days.
* **Ideal macros and grams planner:** A kind of assistant that recommends how much to eat based on your base diet and your input (similar to the future "Project" module).

### Training and Progress
* **Cardio and Endurance:** Right now the biggest flaw of the app is that it's designed 100% for hypertrophy. It's time to add an integrated cardiovascular training section.
* **Long-term mesocycle planner:** To organize complete training blocks.
* **Default and importable routines:** For those who don't want to think and prefer to load a pre-made PPL (Push/Pull/Legs).
* **Up to 3 customizable stopwatches:** Because sometimes a single rest *timer* isn't enough.
* **The real "Wrapped":** As much as it pains me, making a proper annual summary.

### The PC Experience (Next Level)
* **Advanced progress module:** What's already on mobile, but taking advantage of the big screen with much more detailed metrics.
* **Advanced technique analysis (RTPose):** MediaPipe on web falls short for certain things. There are models like RTPose (or however you spell it) that are much more powerful and could run on a regular PC without as many limitations, allowing for even more precise biomechanical analysis.
* **"Project" Module:** A system that recommends and creates specific routines for you to achieve a specific physical goal.

### System and Architecture
* **Extreme modularity:** Being able to choose which modules to install and which ones not to. If you only use the app for nutrition, or only for training, you don't have to load the rest.
* **More content:** Add more foods to the local database, more exercises, and of course, more insult and sarcasm *copywriting*.
* **Optional Cloud (Cloudflare):** It's highly unlikely I'll add this because it makes me incredibly lazy just thinking about it, but I might add it optionally so you can choose between `IndexedDB` (local), connecting your own cloud, or using mine for 2€/month. Mind you, charging means providing support, and providing support is working, so don't wait up for this last option too eagerly.

> **Note:** If you have more suggestions, I'll be happy to hear them (or read them in the *Issues*). Just, please, nobody ask me to connect smart scales or watches via Bluetooth; those companies aren't exactly pro-standards and it's absolute hell.

---

## 9. Acknowledgments and Credits

I don't use heavy commercial frameworks, but I'm not ungrateful either. Aerko_ wouldn't exist with this level of precision without the work of open-source communities and tools that are actually worth it.

### Databases (The Fuel)
* Infinite thanks to **OpenFoodFacts** for making the free and independent barcode scanner possible. 
* To the **USDA** and **BEDCA** for providing the scientific and nutritional accuracy necessary to build the master database (`master_foods.json`) without poisoning anyone.

### Technology (The Engine)
* To **Google** for releasing the **MediaPipe** vision tools (even though I had to hijack them and forcefully inject them into a Web Worker so I wouldn't melt phones). 
* And absolute respect to the developers of the only third-party libraries worthy of stepping foot in this repository. Pure, useful tools with no toxic dependencies:
    * **Chart.js** (Nick Downie and community)
    * **HTML5-QRCode** (Minhazav)
    * **JSZip** (Stuart Knightley)
    * **SortableJS** (Lebedev Konstantin / RubaXa)

### Credits (SrPakura)
And finally, to myself. As a Product Designer, Software Architect, "AI Shepherd", and professional writer of personal experiences. You really gotta have a huge ego to put this in here hahaha. But anyway, thanks for reading, I'm finally done writing.