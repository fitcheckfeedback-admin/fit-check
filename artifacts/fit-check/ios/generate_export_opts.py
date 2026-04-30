import plistlib
import os

bundle_id = os.environ.get("BUNDLE_ID", "app.stylesense.fitcheck")
team_id = os.environ.get("TEAM_ID", "P6D4L2GJ75")

profile_name = open("/tmp/profile_name.txt").read().strip()
print(f"Using profile: {profile_name}")

export_opts = {
    "method": "app-store",
    "teamID": team_id,
    "signingStyle": "manual",
    "provisioningProfiles": {bundle_id: profile_name},
}

out = "/tmp/ExportOptions.plist"
with open(out, "wb") as f:
    plistlib.dump(export_opts, f)

print(f"Wrote {out}: {export_opts}")
