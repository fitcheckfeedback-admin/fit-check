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
//     quality is one of "neural" (premium download, or Apple's built-in
//     "super-compact" on-device neural voices), "enhanced", or "standard".
//     English voices only.
//   speak({ text, voiceId?, rate?, pitch? })
//     rate/pitch are web-scale (1.0 = normal). rate is mapped to the
//     AVSpeech 0.0-1.0 range (0.5 = default). Emits "ttsStart"/"ttsEnd".
//   stop()
// Events: "ttsStart", "ttsEnd" (also fired on cancel).
@objc(VoiceTTS)
public class VoiceTTS: CAPPlugin, AVSpeechSynthesizerDelegate {

    private lazy var synthesizer: AVSpeechSynthesizer = {
        let s = AVSpeechSynthesizer()
        s.delegate = self
        return s
    }()

    // MARK: - Voice selection

    /// Apple's on-device neural voices (Siri-like quality) don't reliably
    /// report a premium/enhanced quality flag — they're identified by
    /// "super-compact" in the voice identifier. Without this check the picker
    /// and auto-select can land on a legacy robotic compact voice even though
    /// a far better built-in voice is sitting right there.
    private func isNeuralClass(_ v: AVSpeechSynthesisVoice) -> Bool {
        v.quality == .premium || v.identifier.lowercased().contains("super-compact")
    }

    private func qualityString(_ v: AVSpeechSynthesisVoice) -> String {
        if isNeuralClass(v) { return "neural" }
        if v.quality == .enhanced { return "enhanced" }
        return "standard"
    }

    private func englishVoices() -> [AVSpeechSynthesisVoice] {
        AVSpeechSynthesisVoice.speechVoices().filter {
            $0.language.lowercased().hasPrefix("en")
        }
    }

    /// Best available English voice: premium download > built-in super-compact
    /// neural > enhanced > legacy standard (robotic).
    private func bestVoice() -> AVSpeechSynthesisVoice? {
        let rank: (AVSpeechSynthesisVoice) -> Int = { v in
            if v.quality == .premium { return 0 }
            if v.identifier.lowercased().contains("super-compact") { return 1 }
            if v.quality == .enhanced { return 2 }
            return 3
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
