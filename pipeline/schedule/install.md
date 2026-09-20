# Installing the daily run on a dedicated machine

Once, by hand, on the laptop that will run every day:

1. **Tools.** Node 20+, `npm i -g m0saic`, `m0saic setup --yes` (pinned ffmpeg),
   the agent CLI(s) you will use (`claude`, `codex`, …) logged in interactively.
2. **Tier.** `m0saic activate <key>` or export `M0SAIC_PRODUCT_KEY` in the
   scheduler's environment. `m0saic license` must print `tier: paid`, or
   preflight refuses (free tier stamps previews).
3. **Repo.** `git clone git@github.com:m0saic-project/one-a-day.git ~/src/one-a-day && cd ~/src/one-a-day && npm install`.
   The machine's git identity and an SSH key with push rights to `main`.
4. **One attended day.** `node pipeline/run.mjs --no-push`. Read the journal it
   wrote. Then `git push`. Then, and only then, schedule it.
5. **Schedule.**
   - macOS: edit `EnvironmentVariables` in `com.m0saic.one-a-day.plist`
     (or put the exports in `~/.zshenv`), then
     `mkdir -p ~/one-a-day-logs && cp pipeline/schedule/com.m0saic.one-a-day.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.m0saic.one-a-day.plist`.
     Test with `launchctl start com.m0saic.one-a-day`. Keep the lid open or
     use an external display: `caffeinate` does not beat lid-close sleep.
   - Windows: edit the env assignments in `one-a-day.task.xml`, then
     `schtasks /Create /TN one-a-day /XML pipeline\schedule\one-a-day.task.xml`.
     Test with `schtasks /Run /TN one-a-day`.
6. **Watch the first scheduled day.** `tail -f ~/one-a-day-logs/<date>.console.log`
   and `journal/<date>/logs/*.log`. After that, read `journal/index.json` when you like.

If a day fails, nothing is lost: the journal commits with the reason, and
tomorrow's preflight starts from a clean pull.
