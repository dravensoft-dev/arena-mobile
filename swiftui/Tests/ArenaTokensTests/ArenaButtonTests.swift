/* A hosting controller lays a View out on a simulator, so this suite measures a render rather than
 * an expression. Every case that renders is on the main actor, because UIKit is. The drawing is
 * measured off an ImageRenderer capture at scale 1, as the extent of what is opaque down the
 * middle column, because a single pixel above the rung reads the gutter the focus ring reserves
 * and passes whatever is drawn. The paint claims below are a function of the scheme and need none
 * of it. */

import Testing
import SwiftUI
import UIKit
@testable import ArenaTokens

private let touchFloor: CGFloat = 44

@MainActor
private func hosted(_ view: some View, width: CGFloat = 390) -> (height: CGFloat, image: UIImage?) {
    let host = UIHostingController(rootView: view)
    let fits = host.sizeThatFits(in: CGSize(width: width, height: .greatestFiniteMagnitude))
    host.view.frame = CGRect(origin: .zero, size: fits)
    host.view.layoutIfNeeded()
    let renderer = ImageRenderer(content: view)
    renderer.scale = 1
    return (fits.height, renderer.uiImage)
}

private func drawnRows(of image: UIImage, x: Int) -> Int {
    guard let cg = image.cgImage else { return 0 }
    let height = cg.height
    var column = [UInt8](repeating: 0, count: height * 4)
    let space = CGColorSpaceCreateDeviceRGB()
    let bits = CGImageAlphaInfo.premultipliedLast.rawValue
    guard let context = CGContext(data: &column, width: 1, height: height, bitsPerComponent: 8,
                                  bytesPerRow: 4, space: space, bitmapInfo: bits) else { return 0 }
    context.draw(cg, in: CGRect(x: -CGFloat(x), y: 0, width: CGFloat(cg.width), height: CGFloat(height)))
    let painted = (0..<height).filter { column[$0 * 4 + 3] > 0 }
    guard let first = painted.first, let last = painted.last else { return 0 }
    return last - first + 1
}

@Test @MainActor func aControlWithNoFloorOffersTheRungItsDensityNames() {
    let view = ArenaButton("Send", size: .sm) {}.arenaTheme(density: .base)
    #expect(hosted(view).height < touchFloor)
}

@Test @MainActor func aControlAskedForAFloorOffersItToAThumb() {
    let view = ArenaButton("Send", size: .sm, targetFloor: touchFloor) {}.arenaTheme(density: .base)
    #expect(hosted(view).height >= touchFloor)
}

@Test @MainActor func theBoxIsOfferedWithoutTheControlBeingDrawnThatLarge() throws {
    let view = ArenaButton("Send", size: .sm, targetFloor: touchFloor) {}.arenaTheme(density: .base)
    let rendered = hosted(view)
    let image = try #require(rendered.image)
    let drawn = CGFloat(drawnRows(of: image, x: Int(image.size.width / 2)))
    let rung = ArenaScale.control(ArenaControl.height(.sm, .base))
    #expect(drawn <= rung + 2)
    #expect(drawn < touchFloor)
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
