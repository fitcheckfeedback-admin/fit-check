import Foundation
import Capacitor
import AVFoundation

// MARK: - Native text-to-speech
// Capacitor plugin that speaks through AVSpeechSynthesizer instead of the
// WebView's speechSynthesis, so the assistant uses the device's real
// high-quality voices (including iOS 17+ neural/premium voices) with a
// proper audio session routed to the speaker.
//
// Methods:
//   getVoices() -> { voices: [{ id, name, language, quality }] }
//     quality is one of "neural" (Apple's premium on-device voices — the
//     best quality third-party apps can use), "enhanced", or "standard".
//     English voices only.
//   speak({ text, voiceId?, rate?, pitch? })
//     rate/pitch are web-scale (1.0 = normal). rate is mapped to the
//     AVSpeech 0.0-1.0 range (0.5 = default). Emits "ttsStart"/"ttsEnd".
//   stop()
// Events: "ttsStart", "ttsEnd" (also fired on cancel).
@objc(VoiceTTS)
public class VoiceTTS: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {

    // CAPBridgedPlugin conformance: without this the Capacitor bridge
    // silently skips the plugin during registration (CapacitorPlugin is
    // CAPPlugin & CAPBridgedPlugin), leaving the app on the web fallback.
    public let identifier = "VoiceTTSPlugin"
    public let jsName = "VoiceTTS"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getVoices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    private lazy var synthesizer: AVSpeechSynthesizer = {
        let s = AVSpeechSynthesizer()
        s.delegate = self
        return s
    }()

    // MARK: - Voice selection

    /// Quality comes straight from Apple's own metadata: premium (the
    /// on-device neural voices — the best third-party apps can use) >
    /// enhanced > default/compact. Note "super-compact" in an identifier is
    /// just Apple's compact format at default quality, NOT a neural voice —
    /// it must never outrank a real enhanced/premium voice.
    private func qualityString(_ v: AVSpeechSynthesisVoice) -> String {
        if v.quality == .premium { return "neural" }
        if v.quality == .enhanced { return "enhanced" }
        return "standard"
    }

    private func englishVoices() -> [AVSpeechSynthesisVoice] {
        AVSpeechSynthesisVoice.speechVoices().filter {
            $0.language.lowercased().hasPrefix("en")
        }
    }

    /// Best available English voice: premium > enhanced > compact.
    /// If nothing good is installed this will be a compact voice — which
    /// sounds robotic. Only the user can fix that, by downloading
    /// Enhanced/Premium voices in iOS Settings (no API for it).
    private func bestVoice() -> AVSpeechSynthesisVoice? {
        let rank: (AVSpeechSynthesisVoice) -> Int = { v in
            if v.quality == .premium { return 0 }
            if v.quality == .enhanced { return 1 }
            return 2
        }
        let english = englishVoices().sorted { rank($0) < rank($1) }
        return english.first ?? AVSpeechSynthesisVoice.speechVoices().first
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try session.setActive(true)
        } catch {
            // Non-fatal: speech still works, just without the ideal routing.
        }
    }

    // MARK: - Plugin methods

    @objc func getVoices(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let list: [[String: Any]] = self.englishVoices().map { v in
                [
                    "id": v.identifier,
                    "name": v.name,
                    "language": v.language,
                    "quality": self.qualityString(v),
                ]
            }
            call.resolve(["voices": list])
        }
    }

    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty else {
            call.reject("VoiceTTS.speak: missing text")
            return
        }
        let voiceId = call.getString("voiceId")
        // Web-scale rate (1.0 = normal) mapped onto AVSpeech's 0.0-1.0 range.
        let webRate = call.getDouble("rate") ?? 1.0
        let pitch = call.getDouble("pitch") ?? 1.0

        DispatchQueue.main.async {
            self.configureAudioSession()
            if self.synthesizer.isSpeaking {
                self.synthesizer.stopSpeaking(at: .immediate)
            }

            let utterance = AVSpeechUtterance(string: text)
            if let id = voiceId,
               let match = AVSpeechSynthesisVoice.speechVoices().first(where: { $0.identifier == id }) {
                utterance.voice = match
            } else {
                utterance.voice = self.bestVoice()
            }
            utterance.rate = min(1.0, max(0.1, Float(webRate) * 0.5))
            utterance.pitchMultiplier = min(2.0, max(0.5, Float(pitch)))
            self.synthesizer.speak(utterance)
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.synthesizer.stopSpeaking(at: .immediate)
            call.resolve()
        }
    }

    // MARK: - AVSpeechSynthesizerDelegate

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                  didStart utterance: AVSpeechUtterance) {
        notifyListeners("ttsStart", data: [:])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                  didFinish utterance: AVSpeechUtterance) {
        notifyListeners("ttsEnd", data: [:])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                  didCancel utterance: AVSpeechUtterance) {
        notifyListeners("ttsEnd", data: [:])
    }
}
