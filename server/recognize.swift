import Foundation
import Vision
import ImageIO

struct Line: Codable { let text: String; let confidence: Float; let x: CGFloat; let y: CGFloat; let height: CGFloat }
struct Output: Codable { let text: String; let lines: [Line]; let warnings: [String] }
do {
 let data = FileHandle.standardInput.readDataToEndOfFile()
 guard let source = CGImageSourceCreateWithData(data as CFData,nil), let image = CGImageSourceCreateImageAtIndex(source,0,nil) else { throw NSError(domain:"Invalid image",code:1) }
 let request = VNRecognizeTextRequest()
 request.recognitionLevel = .accurate
 request.recognitionLanguages = ["en-US"]
 request.usesLanguageCorrection = true
 try VNImageRequestHandler(cgImage:image,options:[:]).perform([request])
 let all = (request.results ?? []).compactMap { observation -> Line? in
  guard let candidate = observation.topCandidates(1).first else { return nil }
  let text = candidate.string
  let letters = text.unicodeScalars.filter { CharacterSet.letters.contains($0) }
  let latin = letters.filter { $0.value < 128 }.count
  guard text.count >= 12, latin >= 12, !text.lowercased().hasSuffix(".jpg"), !text.lowercased().hasSuffix(".png"), !text.lowercased().hasSuffix(".webp"), letters.count > 0, Double(latin)/Double(letters.count) > 0.85 else { return nil }
  return Line(text:text,confidence:candidate.confidence,x:observation.boundingBox.minX,y:observation.boundingBox.maxY,height:observation.boundingBox.height)
 }.sorted { abs($0.y-$1.y) < min($0.height,$1.height)*0.45 ? $0.x < $1.x : $0.y > $1.y }
 var text = ""
 for (i,line) in all.enumerated() {
  if i > 0 {
   let previous=all[i-1]
   let gap=previous.y-line.y
   text += gap > max(previous.height,line.height)*2.1 ? "\n\n" : " "
  }
  text += line.text
 }
 let warnings=all.filter { $0.confidence < 0.8 }.map { "请核对："+$0.text }
 let output=Output(text:text,lines:all,warnings:warnings)
 FileHandle.standardOutput.write(try JSONEncoder().encode(output))
} catch { FileHandle.standardError.write(Data("无法识别此图片，请换一张清晰的照片。".utf8));exit(1) }
