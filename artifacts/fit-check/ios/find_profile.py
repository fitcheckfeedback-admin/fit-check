import plistlib
import os
import glob
import sys

bundle_id = os.environ.get("BUNDLE_ID", "app.stylesense.fitcheck")

search_paths = [
    os.path.expanduser("~/Library/MobileDevice/Provisioning Profiles/*.mobileprovision"),
    "/Users/builder/Library/MobileDevice/Provisioning Profiles/*.mobileprovision",
    "/Library/MobileDevice/Provisioning Profiles/*.mobileprovision",
]

all_profiles = []
for pattern in search_paths:
    all_profiles.extend(glob.glob(pattern))

all_profiles = list(set(all_profiles))
print(f"Searching {len(all_profiles)} profile(s) for bundle ID: {bundle_id}")

profile_name = ""
profile_uuid = ""

for p in all_profiles:
    try:
        raw = open(p, "rb").read()
        start = raw.find(b"<?xml")
        end = raw.find(b"</plist>") + len(b"</plist>")
        if start == -1 or end <= start:
            continue
        d = plistlib.loads(raw[start:end])
        app_id = d.get("Entitlements", {}).get("application-identifier", "")
        name = d.get("Name", "")
        uuid = d.get("UUID", "")
        print(f"  Profile: {name!r} | AppID: {app_id!r} | UUID: {uuid}")
        if bundle_id in app_id:
            profile_name = name
            profile_uuid = uuid
            print(f"  -> MATCHED")
            break
    except Exception as e:
        print(f"  Error reading {p}: {e}")

if not profile_name:
    print("ERROR: No matching provisioning profile found!")
    sys.exit(1)

open("/tmp/profile_uuid.txt", "w").write(profile_uuid)
open("/tmp/profile_name.txt", "w").write(profile_name)
print(f"Wrote UUID: {profile_uuid}")
print(f"Wrote Name: {profile_name}")
