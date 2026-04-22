export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem("fitcheck.deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("fitcheck.deviceId", deviceId);
  }
  return deviceId;
}