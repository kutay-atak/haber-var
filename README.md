# 📰 Haber Var

**Haber Var** (Turkish for *"there's news"*) is a private, collaborative newspaper for friends and family who live far apart. Every few weeks the group answers the same handful of questions. When the deadline passes, everyone's stories, photos and videos are bound together into a newspaper that the whole group reads at once.

It is a free, self-hosted alternative to Letterloop, built to run entirely on free tiers.

> Looking for setup steps? See **[Instructions.md](Instructions.md)**. This page describes what the app is and how it works.

---

## The idea in one minute

Group chats are great for "where are you?" but terrible for "how are you, really?". Messages scroll away, photos get buried, and the quiet friend never gets a word in.

Haber Var slows the conversation down to a rhythm everyone can keep:

1. **An issue starts.** An admin picks a few questions and a deadline, or the issue starts by itself on a schedule ("every month on the 1st").
2. **Everyone answers in their own time.** A few lines, a photo, a short video, a voice note, or a vote in a poll.
3. **Answers stay hidden until the deadline.** Nobody sees anything early, so every answer is a small surprise.
4. **The newspaper comes out.** The answers are laid out as a real-looking publication with mastheads, columns, bylines, photos and charts, and everyone gets an email saying it's out.
5. **The group reacts.** Friends leave emoji reactions and comments under each other's stories.

The result reads less like a chat log and more like a keepsake.

---

## A tour of the app

### Getting in
- **Turkish or English.** The whole app, the newspaper templates and the emails are available in both languages. The TR | EN switch is in the header and on your profile; each person's emails arrive in the language they picked.
- **Sign up with Google, or with email and password.** There are no magic links and no "check your inbox to confirm" step. You're in as soon as you register.
- Forgot your password? A reset link arrives by email.

### Groups
- **Anyone can create a group** (for example "Cousins", "BOUN 501" or "The Lisbon Crew") and becomes its **admin**.
- **Inviting people** takes one link. Copy it, or share it straight to WhatsApp or Telegram (or paste it into Discord). The invite page shows the group name, who sent the invite and how many people are already in, then asks the visitor to sign up or log in.
- Admins can **renew the invite link** at any time, and the old one stops working.
- **Three roles.** Admins manage the group and its issues. **Editors** help shape the next issue by suggesting questions (see below). Members write and read. Admins choose each person's role in the group settings, and a group always keeps at least one admin.
- Groups hold up to 50 people.

### Issues
An *issue* (in Turkish, *sayı*) is one edition of the group's newspaper.

- **Three kinds of question.**
  - ✍️ **Written:** the classic open question, answered with text, photos, video or a voice note.
  - 📊 **Poll:** 2 to 6 options, one tap to vote.
  - 🏆 **Most likely to…:** everyone votes for a member of the group ("Who is always late?").
- **The question pool.** Pick from 88 built-in prompts: 71 open-ended questions ("What made you laugh the most this month?", "Show us the inside of your fridge"), plus 6 ready-made polls and 11 "most likely to" questions. Write your own, or let 🎲 *Random 5* choose. Each issue has 1 to 10 questions, and questions you write can be saved to the group's own pool.
- **Co-editing.** Editors and admins add questions to a shared **queue for the next issue**, either from the pool or written by them. When an admin prepares the next issue, the queued questions are filled in first, and the newspaper credits whoever asked each one ("Asked by Ayşe").
- **Deadline.** Must be at least an hour away and can be extended while the issue is running.
- **Drafts.** Admins can prepare an issue quietly and start it when ready. Starting it emails everyone.
- **Recurring issues.** Admins can put the newspaper on autopilot: weekly, every two weeks or monthly, on a chosen weekday or day of the month. They also choose how long each issue stays open and how many questions it has. Questions come from the editors' queue first; the rest are picked at random from the pool, preferring ones the group hasn't had yet. Each issue opens around 10:00 Turkey time and closes at 20:00 on its last day.
- **One issue at a time.** A group has at most one running issue, which keeps the rhythm clear. A recurring issue that falls due while another is still running waits for it to finish.
- **Publish early.** If everyone has already answered, an admin can publish without waiting for the deadline.

### Answering
- Each written question gets its own card with a text box and room for **up to 4 photos and 1 video**.
- **Voice notes are optional extras, not a replacement for writing.** Tap *Add a voice note* to record up to 2 minutes in the browser, listen back, then attach it or record again. You can also pick an audio file instead.
- **Polls and "most likely to" questions** are a single tap, and you can change or take back your vote until the deadline.
- **Drafts save automatically**, so you can write a sentence on the bus and finish it at home.
- You can see **who has already taken part** (but not what they wrote or voted), which is a gentle nudge for everyone else.
- Answers and votes can be changed right up to the deadline. After that they're locked.

### Photos and videos, without blowing the free quota
Media is the expensive part of an app like this, so Haber Var processes it **on the user's own device before uploading**:

| | What happens |
|---|---|
| Photos | Resized to at most 1600 px and converted to WebP (JPEG on older Safari). Location and other EXIF data are removed. Usually 100–300 KB. |
| Videos | Re-encoded in the browser to 720p H.264 at about 2 Mbps (using WebCodecs, hardware-accelerated where possible). 60 fps footage drops to 30 fps, and only the first 60 seconds are kept. A progress bar shows while it works. |
| Voice notes | Recorded in the browser as compressed audio at about 64 kbps, so 2 minutes is roughly 1 MB. |
| Limits | Up to 4 photos, 1 video and 1 voice note per answer, and 2 videos per person per issue. Hard caps are 3 MB per photo, 30 MB per video and 10 MB per voice note, enforced by the database as well. |
| Quota guard | When the monthly storage/bandwidth credit is 85% used, new videos are paused and photos keep working. |

Files go **directly from the browser to Cloudinary** using a short-lived signed permission, and the server verifies each upload's signature before saving it. In the newspaper, videos show a poster image and voice notes show a waveform; both only download when someone presses play, so readers don't burn bandwidth just by opening the page.

### The newspaper
When an issue is published, the answers become a newspaper. There are **nine templates**, each with its own personality:

| Template | Feel |
|---|---|
| 📰 **Classic Newspaper** | Columns, big headlines, black-and-white photos and a drop cap. The front page of a broadsheet. |
| ✨ **Modern Magazine** | A cover photo, generous white space and large pull quotes. |
| ✂️ **Scrapbook** | Polaroids, strips of washi tape and handwritten notes on lined paper. |
| 💌 **Letter** | Every answer is a letter, with stamps, postmarks and a signature. |
| 📸 **Photo Album** | Pictures first: big frames and short captions. |
| ◻️ **Minimal** | Lots of white space, a single column and a calm read. |
| 🌙 **Night Edition** | A dark background with glowing accents. |
| 📢 **Tabloid** | Red mastheads, "BREAKING" banners and shouting headlines. |
| 🕺 **Retro Zine** | 70s colours, sunbursts and chunky letters. |

Readers can **switch templates** from the menu above the newspaper, so the same issue can be read as a tabloid or a love letter. Every newspaper also **prints cleanly** or saves as a PDF, with columns and backgrounds preserved. Each question stays together on one page; a question longer than a page continues on the next. Videos and voice notes get a QR code on paper, so they can still be played from a printed copy.

**Results with charts.** Votes turn into graphics drawn in each template's own colours:
- 📊 **Polls** get a donut chart with the total in the middle, a bar for each option with its percentage, a 👑 for the winner, and the faces of who chose what.
- 🏆 **"Most likely to…"** gets a winner banner, a 🥇🥈🥉 podium and a ranked list with bars. These votes are secret: the newspaper only shows how many votes each person received, never who voted for whom.

**Reactions and comments.** Under every published answer, readers can leave emoji reactions (❤️ 😂 😮 😢 👏 🔥) and short comments. Hovering over a reaction shows who left it. People can delete their own comments, and admins can delete any comment. Reactions and comments only open once the newspaper is out, and they don't appear on printed copies.

### The Design Studio
Admins get a full studio with live preview to make the newspaper their own:

| Section | Options |
|---|---|
| Masthead and text | Newspaper name (in the template's lettering or old-newspaper lettering), tagline, an editor's note with signature, and a closing note |
| Colours | 15 palettes, plus any custom accent colour |
| Typography | 12 heading + body font pairings (classic serif, elegant, handwriting, typewriter, tabloid, playful…) and 3 text sizes |
| Page | 8 paper textures (plain, dotted, lined, grid, linen, kraft, aged, confetti), 1–3 columns, spacing, title alignment and the amount of decoration |
| Photos | 9 filters (black & white, sepia, vintage, dramatic…), 6 frames (polaroid, postage stamp, arch…), photo size and the cover photo |
| Layout | Stories one under another, or **like a front page**, where short questions sit side by side and longer ones get wider columns. In the Classic template this builds a real front page: teasers above the masthead, the lead story with its photo in the middle, narrow stories on both sides, and justified, hyphenated text. On paper, the side stories sit under the masthead and the lead story gets a page of its own. Arrange by question or by person; order answers by time, name or shuffle; toggles for drop caps, avatars, question numbers, contributor list, date and stats |

A few extras:
- **🎲 Surprise me** rolls a random look.
- **Reset look** keeps your text.
- You can preview at desktop or phone size.
- Saving a design as the **group default** means every future issue starts with it.

Anyone can try the studio without an account at **`/sablonlar`**, using a sample issue. Nothing is saved there.

### Notifications
Haber Var sends three kinds of notification, each at most once per person per issue. They arrive by email and, on devices where people turned them on, as phone notifications:

1. **"A new issue has started"**, with the questions and the deadline.
2. **One reminder** in the last 48 hours, only to people who haven't taken part yet.
3. **"The newspaper is out!"**, with a short summary such as "4 friends took part: 15 answers, 6 photos, 1 voice note and 9 votes."

Anyone can turn emails off from their profile; phone notifications are switched on or off per device, independently of email. A daily scheduled job starts recurring issues, publishes issues whose deadline has passed and sends the reminders. Starting or publishing an issue notifies everyone right away.

### On your phone, without an app store
Haber Var installs to the home screen like an app, for free and without the App Store or Google Play:
- **Android:** an *Install the app* button on the groups page and the profile page does it in one tap. In browsers without that button, the browser menu has *Install app* or *Add to Home screen*.
- **iPhone and iPad:** the app shows the three short steps (Safari → *Share* → *Add to Home Screen*).
- Once installed, it opens full screen from its own icon, without the browser bar.
- **Phone notifications** for new issues, the last-day reminder and the published newspaper. Tapping one opens that issue. Turn them on from the prompt on the groups page or from the profile page, which also has a *Send a test notification* button. On iPhone they need iOS 16.4 or later and the app opened from the home screen.
- With no connection, a friendly offline page replaces the browser's error screen.
- On iPhone, the home-screen app keeps its own login, separate from Safari, so people log in once more there.

---

## Privacy and safety

- **Row-level security on every table.** People only ever see groups they belong to.
- **Answers and votes are hidden at the database level until the issue is published.** This isn't just the interface hiding them: even a bug in the app couldn't leak them early.
- **"Most likely to…" votes stay secret even after publishing.** The database only ever hands out the totals. Poll choices, on the other hand, are shown with names, and the voting screen says so.
- **Email addresses are never shown to other members.** Only the server reads them, to send notifications.
- **Phone notifications belong to a device.** Logging out removes that device. The server only sends to the browsers' own push services (Google, Apple, Mozilla, Microsoft), and a notification only says which group and issue it's about.
- **Secret keys never reach the browser.** These are the database service key, the Cloudinary secret and the email password.
- **Invite links are unguessable** 16-character codes and can be revoked with one click.
- **Deleting an issue or a group** also deletes its photos and videos from storage.

---

## Under the hood

| Layer | Technology | Free tier used |
|---|---|---|
| App and hosting | Next.js 16 (App Router, Server Actions, React 19) on **Vercel Hobby** | 100 GB bandwidth per month, 1 daily cron job |
| Database and auth | **Supabase** (Postgres, row-level security, Google OAuth) | 500 MB database, 50,000 monthly users |
| Photos, video and voice notes | **Cloudinary** | About 25 GB of storage + bandwidth per month |
| Email | **Gmail SMTP**, or any free SMTP service | About 500 emails per day |
| Phone notifications | **Web Push** through each browser's own push service | Free, no account needed |

**Rough maths:** a group of 10 publishing monthly, where everyone adds 3 photos and 1 video, adds about 150 MB per month. Even if everyone watches every video, that's about 1.5 GB of traffic, comfortably inside the free limits.

Other details:
- **Styling:** Tailwind CSS v4 with container queries, so each template adapts to the width of the newspaper rather than the whole screen.
- **Templates:** every newspaper template is driven by design tokens (CSS custom properties).
- **Video:** compression uses [Mediabunny](https://mediabunny.dev) on top of WebCodecs.
- **Validation:** every input is validated twice, in the app (Zod) and in the database (constraints, triggers and security-definer functions).

---

## Project status

Haber Var is a personal project, built for one circle of friends and shared in case it's useful to others. It is complete enough to run a real group. Everything described above works:
- sign-up, groups and issues
- editors and the question queue
- answers with photos, video and voice notes
- polls and "most likely to" questions with charts
- reactions and comments
- recurring issues
- the nine templates and the design studio
- printing and email
- installing to the home screen and phone notifications

Ideas for later:
- An automatic PDF archive of every issue

To run your own copy, follow **[Instructions.md](Instructions.md)**. Setup takes about 30–45 minutes and costs nothing.

*Made with love, for friends who are far away.* 💌
