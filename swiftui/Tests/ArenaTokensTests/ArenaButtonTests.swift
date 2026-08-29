/* A hosting controller lays a View out on a simulator and ImageRenderer rasterises it, so this
 * suite measures a render rather than an expression. Every case that renders is on the main
 * actor, because UIKit is. The render is taken at renderScale rather than at one, because a
 * boundary one point wide is a run a one-pixel tolerance cannot tell from an absent one, so
 * every contracted length below is multiplied by it and the layout numbers stay in points. The
 * probes read a capture in which the painted rectangle sits inset by the gutter the focus ring
 * reserves. The paint claims below are a function of the scheme and need none of it. */

import Testing
import SwiftUI
import UIKit
@testable import ArenaTokens

private let touchFloor: CGFloat = 44

private let renderScale: CGFloat = 3

private let renderWidth: CGFloat = 390

private let cases: [(ArenaButtonVariant, ArenaControlSize)] = [
    (.primary, .sm),
    (.primary, .md),
    (.primary, .lg),
    (.secondary, .sm),
    (.secondary, .md),
    (.secondary, .lg),
    (.ghost, .sm),
    (.ghost, .md),
    (.ghost, .lg),
    (.danger, .sm),
    (.danger, .md),
    (.danger, .lg),
]

private struct Pixels {
    let width: Int
    let height: Int
    private let bytes: [UInt8]

    init?(_ image: UIImage) {
        guard let cg = image.cgImage, let space = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
        width = cg.width
        height = cg.height
        var data = [UInt8](repeating: 0, count: width * height * 4)
        let info = CGImageAlphaInfo.premultipliedLast.rawValue
        guard let context = CGContext(data: &data, width: width, height: height, bitsPerComponent: 8,
                                      bytesPerRow: width * 4, space: space, bitmapInfo: info) else { return nil }
        context.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
        bytes = data
    }

    func at(_ x: Int, _ y: Int) -> [UInt8] {
        let start = ((y * width) + x) * 4
        return Array(bytes[start..<(start + 4)])
    }
}

@MainActor
private func inked(_ color: Color) -> [UInt8] {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0
    UIColor(color).getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    return [red, green, blue, alpha].map { UInt8(max(0, min(255, ($0 * 255).rounded()))) }
}

@MainActor
private func control(_ variant: ArenaButtonVariant, _ size: ArenaControlSize,
                     density: ArenaDensityScale = .comfortable,
                     floor: CGFloat? = nil,
                     contrast: Bool = false) -> some View {
    ArenaButton("Send", variant: variant, size: size, full: true,
                increasedContrast: contrast, targetFloor: floor) {}
        .arenaTheme(density: density)
        .background(ArenaColorScheme.dark.bg)
        .frame(width: renderWidth)
}

@MainActor
private func offered(_ view: some View) -> CGFloat {
    let host = UIHostingController(rootView: view)
    let fits = host.sizeThatFits(in: CGSize(width: renderWidth, height: .greatestFiniteMagnitude))
    host.view.frame = CGRect(origin: .zero, size: fits)
    host.view.layoutIfNeeded()
    return fits.height
}

@MainActor
private func captured(_ view: some View) throws -> Pixels {
    let renderer = ImageRenderer(content: view)
    renderer.scale = renderScale
    let image = try #require(renderer.uiImage)
    return try #require(Pixels(image))
}

private func isPainted(_ pixel: [UInt8], _ fill: [UInt8], _ edge: [UInt8]) -> Bool {
    pixel == fill || pixel == edge
}

private func px(_ points: CGFloat) -> Int {
    Int((points * renderScale).rounded())
}

@MainActor
private func gutter(_ contrast: Bool) -> CGFloat {
    ArenaTokens.focusOffset + ArenaContrast.focusWidth(contrast)
}

@Test @MainActor func paintedHeightIsTheRungTheDensityNamesAndNeverTheFloor() throws {
    for (variant, size) in cases where variant != .ghost {
        let scheme = ArenaColorScheme.dark
        let pixels = try captured(control(variant, size, density: .base, floor: touchFloor))
        let fill = inked(ArenaButtonPaint.fill(variant, scheme))
        let edge = inked(ArenaButtonPaint.edge(variant, scheme))
        let column = pixels.width / 2
        let rows = (0..<pixels.height).filter { isPainted(pixels.at(column, $0), fill, edge) }
        let paintedHeight = (rows.last ?? 0) - (rows.first ?? 0) + (rows.isEmpty ? 0 : 1)
        let rung = px(ArenaScale.control(ArenaControl.height(size, .base)))
        #expect(abs(paintedHeight - rung) <= 1,
                "\(variant) \(size) draws \(paintedHeight) row(s) of its own paint and the rung it is born at is \(rung)")
    }
}

@Test @MainActor func activationBoxIsTheRungComposedWithTheFloorTheCallerPasses() {
    for floor in [nil, touchFloor] as [CGFloat?] {
        for (variant, size) in cases {
            let painted = ArenaScale.control(ArenaControl.height(size, .base))
            let activationBox = floor.map { ArenaControl.target(painted, floor: $0) } ?? painted
            let expected = max(activationBox, painted + (gutter(false) * 2))
            let measured = offered(control(variant, size, density: .base, floor: floor))
            #expect(abs(measured - expected) < 0.5,
                    "\(variant) \(size) asked for \(String(describing: floor)) offers \(measured) and its seam composes \(expected)")
        }
    }
}

@Test @MainActor func groundInkIsWhatThePaintNamesOrTheDeclaredGround() throws {
    for (variant, size) in cases {
        let scheme = ArenaColorScheme.dark
        let pixels = try captured(control(variant, size))
        let fill = ArenaButtonPaint.fill(variant, scheme)
        let inward = px(gutter(false)) + (px(ArenaControl.padding) / 2)
        let groundInk = pixels.at(inward, pixels.height / 2)
        #expect(groundInk == inked(fill == Color.clear ? scheme.bg : fill),
                "\(variant) \(size) paints \(groundInk) past its boundary and short of its label")
    }
}

@Test @MainActor func boundaryWidthIsTheLadderTheContrastAxisNames() throws {
    for contrast in [false, true] {
        for (variant, size) in cases where variant != .primary {
            let scheme = ArenaColorScheme.dark
            let pixels = try captured(control(variant, size, contrast: contrast))
            let edge = inked(ArenaButtonPaint.edge(variant, scheme))
            let ladder = px(ArenaContrast.border(contrast))
            let from = px(gutter(contrast))
            let row = pixels.height / 2
            let boundaryWidth = (from..<min(from + ladder + 2, pixels.width))
                .filter { pixels.at($0, row) == edge }.count
            let expected = ArenaButtonPaint.edge(variant, scheme) == Color.clear ? 0 : ladder
            #expect(abs(boundaryWidth - expected) <= 1,
                    "\(variant) \(size) under increased contrast \(contrast) draws \(boundaryWidth) column(s) of its edge and ArenaContrast.border names \(expected)")
        }
    }
}

@Test @MainActor func boundaryInkIsWhatThePaintNamesOrTheDeclaredGround() throws {
    for (variant, size) in cases {
        let scheme = ArenaColorScheme.dark
        let pixels = try captured(control(variant, size))
        let edge = ArenaButtonPaint.edge(variant, scheme)
        let ladder = px(ArenaContrast.border(false))
        let inward = px(gutter(false)) + (edge == Color.clear ? 0 : ladder / 2)
        let boundaryInk = pixels.at(inward, pixels.height / 2)
        #expect(boundaryInk == inked(edge == Color.clear ? scheme.bg : edge),
                "\(variant) \(size) draws \(boundaryInk) at its first column, and ArenaButtonPaint.edge names \(edge)")
    }
}

@Test @MainActor func cornerRadiusIsTheStepTheControlRoleCollapsesOnto() throws {
    for (variant, size) in cases where variant != .ghost {
        let scheme = ArenaColorScheme.dark
        let pixels = try captured(control(variant, size))
        let outlined = ArenaButtonPaint.fill(variant, scheme) == Color.clear
        let fill = inked(ArenaButtonPaint.fill(variant, scheme))
        let edge = inked(ArenaButtonPaint.edge(variant, scheme))
        let from = px(gutter(false))
        let top = try #require((0..<pixels.height).first { isPainted(pixels.at(pixels.width / 2, $0), fill, edge) })
        let cornerRadius = (from..<pixels.width).prefix { !isPainted(pixels.at($0, top), fill, edge) }.count
        let step = px(ArenaControl.radius)
        let slack = 1 + (outlined ? px(ArenaContrast.border(false)) : 0)
        #expect(abs(cornerRadius - step) <= slack,
                "\(variant) \(size) leaves \(cornerRadius) column(s) unpainted at the top row of its rectangle and ArenaControl.radius names \(step); a variant drawing no ground offers only its stroke there, and this rasteriser reaches full coverage a stroke further in")
    }
}

@Test func dangerIsAnOutlineAndNeverAFill() {
    for colors in [ArenaColorScheme.dark, .light] {
        #expect(ArenaButtonPaint.fill(.danger, colors) == Color.clear)
        #expect(ArenaButtonPaint.edge(.danger, colors) == colors.danger)
        #expect(ArenaButtonPaint.ink(.danger, colors) == colors.danger)
    }
}

@Test func primaryIsTheOneVariantThatCarriesTheAccentAsAGround() {
    let colors = ArenaColorScheme.dark
    #expect(ArenaButtonPaint.fill(.primary, colors) == colors.accent)
    #expect(ArenaButtonPaint.ink(.primary, colors) == colors.onAccent)
    #expect(ArenaButtonPaint.edge(.primary, colors) == colors.accent)
    for variant in [ArenaButtonVariant.secondary, .ghost, .danger] {
        #expect(ArenaButtonPaint.fill(variant, colors) != colors.accent)
    }
}

@Test func aGhostDrawsNoGroundAndNoBoundary() {
    let colors = ArenaColorScheme.light
    #expect(ArenaButtonPaint.fill(.ghost, colors) == Color.clear)
    #expect(ArenaButtonPaint.edge(.ghost, colors) == Color.clear)
    #expect(ArenaButtonPaint.ink(.ghost, colors) == colors.textStrong)
}

@Test func secondaryIsTheSurfaceAndTheBoundaryThatCarriesMeaning() {
    let colors = ArenaColorScheme.dark
    #expect(ArenaButtonPaint.fill(.secondary, colors) == colors.surfaceCard)
    #expect(ArenaButtonPaint.edge(.secondary, colors) == colors.borderStrong)
    #expect(ArenaButtonPaint.ink(.secondary, colors) == colors.textStrong)
}
