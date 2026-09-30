import Foundation
import Capacitor
import AVFoundation
import Speech

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
//
// MARK: - Native speech recognition
// Uses SFSpeechRecognizer + AVAudioEngine (the iPhone's own dictation
// engine). The WebView's webkitSpeechRecognition wedges on the second
// session and cannot be restarted without killing the app, so the voice
// assistant listens through this instead. The audio engine is fully torn
// down after every session so the next one always starts clean.
//
// Methods:
//   startListening() -> { transcript }
//     Resolves when the user stops speaking (3s of silence), on
//     stopListening, or after a 30s cap — whichever comes first. Rejects on
//     permission errors or audio failures. The call is kept alive across
//     the session.
//   stopListening()
//     Ends the current session gracefully; the pending startListening
//     resolves with whatever was heard.
// Events: "speechPartial" { transcript } — interim results for live UI.
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
        CAPPluginMethod(name: "startListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopListening", returnType: CAPPluginReturnPromise),
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

    // MARK: - Native speech recognition

    private static let listenSilenceTimeout: TimeInterval = 3.0
    private static let listenCapTimeout: TimeInterval = 30.0

    private var speechRecognizer: SFSpeechRecognizer? =
        SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var listeningCall: CAPPluginCall?
    private var lastTranscript: String = ""
    private var silenceWorkItem: DispatchWorkItem?
    private var capWorkItem: DispatchWorkItem?
    private var stopFallbackItem: DispatchWorkItem?

    @objc func startListening(_ call: CAPPluginCall) {
        call.keepAlive = true
        DispatchQueue.main.async {
            // End any previous session first (resolves it with what it heard).
            self.finishListening(transcript: self.lastTranscript.isEmpty ? nil : self.lastTranscript,
                                 error: nil)

            SFSpeechRecognizer.requestAuthorization { status in
                DispatchQueue.main.async {
                    switch status {
                    case .authorized:
                        self.listeningCall = call
                        do {
                            try self.beginRecognition()
                        } catch {
                            self.listeningCall = nil
                            call.keepAlive = false
                            call.reject("Microphone error: \(error.localizedDescription)")
                        }
                    case .denied:
                        call.keepAlive = false
                        call.reject("Speech recognition permission was denied. Turn it on for FIT Check in the Settings app.")
                    case .restricted:
                        call.keepAlive = false
                        call.reject("Speech recognition is restricted on this device.")
                    case .notDetermined:
                        call.keepAlive = false
                        call.reject("Speech recognition permission was not granted.")
                    @unknown default:
                        call.keepAlive = false
                        call.reject("Speech recognition is unavailable on this device.")
                    }
                }
            }
        }
    }

    @objc func stopListening(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Graceful end: lets the recognizer deliver a final result, which
            // resolves the pending startListening with what was heard.
            self.silenceWorkItem?.cancel(); self.silenceWorkItem = nil
            self.capWorkItem?.cancel(); self.capWorkItem = nil
            self.stopFallbackItem?.cancel()
            self.recognitionRequest?.endAudio()
            // Safety net: if the final result never arrives, resolve anyway.
            let item = DispatchWorkItem { [weak self] in
                guard let self = self, self.listeningCall != nil else { return }
                self.finishListening(transcript: self.lastTranscript, error: nil)
            }
            self.stopFallbackItem = item
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5, execute: item)
            call.resolve()
        }
    }

    private func beginRecognition() throws {
        // Full teardown of any previous audio state before starting fresh.
        teardownAudio()

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            throw NSError(domain: "VoiceTTS", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Speech recognition is not available right now."])
        }

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement, options: .duckOthers)
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        lastTranscript = ""
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }
        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let result = result {
                    self.lastTranscript = result.bestTranscription.formattedString
                    self.notifyListeners("speechPartial", data: ["transcript": self.lastTranscript])
                    self.armSilenceTimer()
                    if result.isFinal {
                        self.finishListening(transcript: self.lastTranscript, error: nil)
                        return
                    }
                }
                if let error = error {
                    // Already finished (e.g. cancelled by teardown): ignore.
                    if self.listeningCall == nil { return }
                    if !self.lastTranscript.isEmpty {
                        self.finishListening(transcript: self.lastTranscript, error: nil)
                    } else {
                        self.finishListening(transcript: nil, error: error)
                    }
                }
            }
        }

        armCapTimer()
    }

    /// Resolve/reject the pending startListening call (first call wins) and
    /// release all audio resources so the next session starts clean.
    private func finishListening(transcript: String?, error: Error?) {
        guard let call = listeningCall else { return }
        listeningCall = nil
        teardownAudio()
        call.keepAlive = false
        if let error = error {
            call.reject(error.localizedDescription)
        } else {
            call.resolve(["transcript": transcript ?? ""])
        }
    }

    private func teardownAudio() {
        silenceWorkItem?.cancel(); silenceWorkItem = nil
        capWorkItem?.cancel(); capWorkItem = nil
        stopFallbackItem?.cancel(); stopFallbackItem = nil
        recognitionTask?.cancel(); recognitionTask = nil
        recognitionRequest?.endAudio(); recognitionRequest = nil
        if audioEngine.isRunning { audioEngine.stop() }
        audioEngine.inputNode.removeTap(onBus: 0)
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    /// End the session after 3s without new speech (mirrors the WebView
    /// recognizer's auto-stop on silence).
    private func armSilenceTimer() {
        silenceWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            self?.recognitionRequest?.endAudio()
        }
        silenceWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.listenSilenceTimeout, execute: item)
    }

    /// Hard 30s cap: resolve with whatever was heard (possibly empty).
    private func armCapTimer() {
        capWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            self.finishListening(transcript: self.lastTranscript.isEmpty ? nil : self.lastTranscript,
                                 error: nil)
        }
        capWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.listenCapTimeout, execute: item)
    }
}
