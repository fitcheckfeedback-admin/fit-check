import plistlib
import os
import glob

bundle_id = os.environ.get("BUNDLE_ID", "app.stylesense.fitcheck")
team_id = os.environ.get("TEAM_ID", "P6D4L2GJ75")

profiles = glob.glob(os.path.expanduser("~/Library/MobileDevice/Provisioning Profiles/*.mobileprovision"))
profile_name = ""

for p in profiles:
    raw = open(p, "rb").read()
    start = raw.find(b"<?xml")
    end = raw.find(b"</plist>") + len(b"</plist>")
    if start != -1 and end > start:
        d = plistlib.loads(raw[start:end])
        app_id = d.get("Entitlements", {}).get("application-identifier", "")
        if bundle_id in app_id:
            profile_name = d.get("Name", "")
            print(f"Found profile: {profile_name}")
            break

if not profile_name:
    print("WARNING: No matching profile found, export may fail")

export_opts = {
    "method": "app-store",
    "teamID": team_id,
    "signingStyle": "manual",
}
if profile_name:
    export_opts["provisioningProfiles"] = {bundle_id: profile_name}

out = "/tmp/ExportOptions.plist"
with open(out, "wb") as f:
    plistlib.dump(export_opts, f)

print(f"Wrote {out}: {export_opts}")
