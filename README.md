# 📰 Haber Var

**Haber Var** (Turkish for *"there's news"*) is a private, collaborative newspaper for friends and family who live far apart. Every few weeks the group answers the same handful of questions. When the deadline passes, everyone's stories, photos and videos are bound together into a newspaper that the whole group reads at once.

It is a free, self-hosted alternative to Letterloop, built to run entirely on free tiers.

> Looking for setup steps? See **[Instructions.md](Instructions.md)**. This page describes what the app is and how it works.

---

## The idea in one minute

Group chats are great for "where are you?" but terrible for "how are you, really?". Messages scroll away, photos get buried, and the quiet friend never gets a word in.

Haber Var slows the conversation down to a rhythm everyone can keep:

1. **Someone starts an issue.** They pick a few questions and a deadline.
2. **Everyone answers in their own time.** A few lines, a photo, a short video.
3. **Answers stay hidden until the deadline.** Nobody sees anything early, so every answer is a small surprise.
4. **The newspaper comes out.** The answers are laid out as a real-looking publication with mastheads, columns, bylines and photos, and everyone gets an email saying it's out.

The result reads less like a chat log and more like a keepsake.

---

## A tour of the app

### Getting in
- **Sign up with Google, or with email and password.** There are no magic links and no "check your inbox to confirm" step. You're in as soon as you register.
- Forgot your password? A reset link arrives by email.

### Groups
- **Anyone can create a group** (for example "Cousins", "BOUN 501" or "The Lisbon Crew") and becomes its **admin**.
- **Inviting people** takes one link. Copy it, or share it straight to WhatsApp or Telegram (or paste it into Discord). The invite page shows the group name, who sent the invite and how many people are already in, then asks the visitor to sign up or log in.
- Admins can **renew the invite link** at any time, and the old one stops working.
- **Roles** are simple. Admins manage the group and its issues; members write and read. Admins can promote other members, and a group always keeps at least one admin.
- Groups hold up to 50 people.

### Issues
An *issue* (in Turkish, *sayı*) is one edition of the group's newspaper.

- **Questions.** Pick from a built-in pool of 50 warm, open-ended prompts ("What made you laugh the most this month?", "Send us a photo of the view from your window"). Write your own, or let 🎲 *Random 5* choose. Each issue has 1 to 10 questions.
- **Deadline.** Must be at least an hour away and can be extended while the issue is running.
- **Drafts.** Admins can prepare an issue quietly and start it when ready. Starting it emails everyone.
- **One issue at a time.** A group has at most one running issue, which keeps the rhythm clear.
- **Publish early.** If everyone has already answered, an admin can publish without waiting for the deadline.

### Answering
- Each question gets its own card with a text box and room for **up to 4 photos and 1 video**.
- **Drafts save automatically**, so you can write a sentence on the bus and finish it at home.
- You can see **who has already written** (but not what they wrote), which is a gentle nudge for everyone else.
- Answers can be edited right up to the deadline. After that they're locked.

### Photos and videos, without blowing the free quota
Media is the expensive part of an app like this, so Haber Var processes it **on the user's own device before uploading**:

| | What happens |
|---|---|
| Photos | Resized to at most 1600 px and converted to WebP (JPEG on older Safari). Location and other EXIF data are removed. Usually 100–300 KB. |
| Videos | Re-encoded in the browser to 720p H.264 at about 2 Mbps (using WebCodecs, hardware-accelerated where possible). 60 fps footage drops to 30 fps, and only the first 60 seconds are kept. A progress bar shows while it works. |
| Limits | Up to 4 photos and 1 video per answer, and 2 videos per person per issue. Hard caps are 3 MB per photo and 30 MB per video, enforced by the database as well. |
| Quota guard | When the monthly storage/bandwidth credit is 85% used, new videos are paused and photos keep working. |

Files go **directly from the browser to Cloudinary** using a short-lived signed permission, and the server verifies each upload's signature before saving it. In the newspaper, videos show a poster image and only download when someone presses play, so readers don't burn bandwidth just by opening the page.

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

Readers can **switch templates** from the menu above the newspaper, so the same issue can be read as a tabloid or a love letter. Every newspaper also **prints cleanly** or saves as a PDF, with columns, page breaks and backgrounds preserved.

### The Design Studio
Admins get a full studio with live preview to make the newspaper their own:

| Section | Options |
|---|---|
| Masthead and text | Newspaper name, tagline, an editor's note with signature, and a closing note |
| Colours | 15 palettes, plus any custom accent colour |
| Typography | 12 heading + body font pairings (classic serif, elegant, handwriting, typewriter, tabloid, playful…) and 3 text sizes |
| Page | 8 paper textures (plain, dotted, lined, grid, linen, kraft, aged, confetti), 1–3 columns, spacing, title alignment and the amount of decoration |
| Photos | 9 filters (black & white, sepia, vintage, dramatic…), 6 frames (polaroid, postage stamp, arch…), photo size and the cover photo |
| Layout | Arrange by question or by person; order answers by time, name or shuffle; toggles for drop caps, avatars, question numbers, contributor list, date and stats |

A few extras:
- **🎲 Surprise me** rolls a random look.
- **Reset look** keeps your text.
- You can preview at desktop or phone size.
- Saving a design as the **group default** means every future issue starts with it.

Anyone can try the studio without an account at **`/sablonlar`**, using a sample issue. Nothing is saved there.

### Email notifications
Haber Var sends three kinds of email, each at most once per person per issue:

1. **"A new issue has started"**, with the questions and the deadline.
2. **One reminder** in the last 48 hours, only to people who haven't written anything yet.
3. **"The newspaper is out!"**, with a short summary such as "4 friends wrote: 15 answers, 6 photos and 2 videos."

Anyone can turn emails off from their profile. A daily scheduled job publishes issues whose deadline has passed and sends the reminders.

---

## Privacy and safety

- **Row-level security on every table.** People only ever see groups they belong to.
- **Answers are hidden at the database level until the issue is published.** This isn't just the interface hiding them: even a bug in the app couldn't leak them early.
- **Email addresses are never shown to other members.** Only the server reads them, to send notifications.
- **Secret keys never reach the browser.** These are the database service key, the Cloudinary secret and the email password.
- **Invite links are unguessable** 16-character codes and can be revoked with one click.
- **Deleting an issue or a group** also deletes its photos and videos from storage.

---

## Under the hood

| Layer | Technology | Free tier used |
|---|---|---|
| App and hosting | Next.js 16 (App Router, Server Actions, React 19) on **Vercel Hobby** | 100 GB bandwidth per month, 1 daily cron job |
| Database and auth | **Supabase** (Postgres, row-level security, Google OAuth) | 500 MB database, 50,000 monthly users |
| Photos and video | **Cloudinary** | About 25 GB of storage + bandwidth per month |
| Email | **Gmail SMTP**, or any free SMTP service | About 500 emails per day |

**Rough maths:** a group of 10 publishing monthly, where everyone adds 3 photos and 1 video, adds about 150 MB per month. Even if everyone watches every video, that's about 1.5 GB of traffic, comfortably inside the free limits.

Other details:
- **Styling:** Tailwind CSS v4 with container queries, so each template adapts to the width of the newspaper rather than the whole screen.
- **Templates:** every newspaper template is driven by design tokens (CSS custom properties).
- **Video:** compression uses [Mediabunny](https://mediabunny.dev) on top of WebCodecs.
- **Validation:** every input is validated twice, in the app (Zod) and in the database (constraints, triggers and security-definer functions).

---

## Project status

Haber Var is a personal project, built for one circle of friends and shared in case it's useful to others. It is complete enough to run a real group: sign-up, groups, issues, answers with media, the nine templates, the design studio, printing and email all work.

Ideas for later:
- Emoji reactions and comments on answers
- An automatic PDF archive of every issue
- Recurring issues (for example on the 1st of every month)

To run your own copy, follow **[Instructions.md](Instructions.md)**. Setup takes about 30–45 minutes and costs nothing.

*Made with love, for friends who are far away.* 💌
