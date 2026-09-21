# Installing the daily run on a dedicated machine

Once, by hand, on the laptop that will run every day:

1. **Tools.** Node 20+, `npm i -g m0saic`, `m0saic setup --yes` (pinned ffmpeg),
   the agent CLI(s) you will use (`claude`, `codex`, …) logged in interactively.
   Install every CLI the `roster` in `pipeline/config.json` names — a slot whose
   CLI is missing is skipped at draw time, so the day still runs, but the roster
   quietly narrows to whatever is actually installed. Check what the machine
   would draw from without running a day:

   ```
   node -e "import('./pipeline/lib/roster.mjs').then(async({rosterEntries})=>{for(const e of rosterEntries(require('./pipeline/config.json'))){let ok='✓';try{const m=await import('./pipeline/agents/'+e.agent+'.mjs');const w=await m.available();if(w!==true)ok='✗ '+w}catch(err){ok='✗ '+err.message}console.log(e.id.padEnd(24),ok)}})"
   ```
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
   - Windows: edit the env assignments **and the `Set-Location` path** in
     `one-a-day.task.xml` (it ships pointing at `$HOME\src\one-a-day`), then
     register it from PowerShell:

     ```powershell
     $xml = (Get-Content -Raw -Encoding UTF8 pipeline\schedule\one-a-day.task.xml) -replace '<\?xml[^>]*\?>\s*', ''
     Register-ScheduledTask -TaskName "one-a-day" -Xml $xml -Force
     Get-ScheduledTaskInfo -TaskName "one-a-day" | Select-Object NextRunTime
     ```

     Not `schtasks /Create /XML`: that path insists the file be UTF-16, and a
     UTF-16 file does not survive this repo's `.gitattributes` (`* text=auto
     eol=lf`). The file is kept UTF-8 and readable; stripping the declaration
     hands the XML to the API as a string, which is encoding-agnostic. Test
     with `Start-ScheduledTask -TaskName one-a-day`, remove with
     `Unregister-ScheduledTask -TaskName one-a-day`.

     The task runs as the logged-on user (`InteractiveToken`), because the
     agent CLIs authenticate against credentials in that user's profile. **The
     machine has to be logged in at the trigger** — it will wake for it, but it
     will not run from a logged-out session.

   Both files ship with `ONE_A_DAY_AGENT=random` and a **09:00 daily** trigger,
   so the roster picks the day's agent and model. Set it to a single adapter
   name, or add `ONE_A_DAY_ROSTER=<slot>`, if you want the same one every day.

   The trigger is **machine-local time** — neither scheduler takes a named
   timezone. On a machine set to Eastern, `09:00` is 9am ET all year, because
   Windows and launchd both shift the trigger with DST. If the machine's clock
   is set to something else, convert the hour yourself. A 09:00 start also
   keeps the run clear of the date boundary: the runner takes `journal/<date>/`
   from the local date, so a day that starts near midnight can straddle two.
6. **Watch the first scheduled day.** `tail -f ~/one-a-day-logs/<date>.console.log`
   and `journal/<date>/logs/*.log`. After that, read `journal/index.json` when you like.

If a day fails, nothing is lost: the journal commits with the reason, and
tomorrow's preflight starts from a clean pull.
