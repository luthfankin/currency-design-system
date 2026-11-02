// Do not edit directly, this file was auto-generated from tokens/ by build.mjs.

import UIKit

public struct CurrencyShadow {
    public let color: UIColor
    public let opacity: Float
    public let offset: CGSize
    public let radius: CGFloat
}

public extension CurrencyShadow {
    /// Cards, list containers resting on canvas
    static let level1 = CurrencyShadow(color: UIColor(red: 0.110, green: 0.110, blue: 0.114, alpha: 1), opacity: 0.10, offset: CGSize(width: 0, height: 1), radius: 1.5)
    /// Dropdowns, popovers, sticky headers when scrolled
    static let level2 = CurrencyShadow(color: UIColor(red: 0.110, green: 0.110, blue: 0.114, alpha: 1), opacity: 0.10, offset: CGSize(width: 0, height: 4), radius: 4.0)
    /// Toasts, floating action buttons
    static let level3 = CurrencyShadow(color: UIColor(red: 0.110, green: 0.110, blue: 0.114, alpha: 1), opacity: 0.10, offset: CGSize(width: 0, height: 12), radius: 8.0)
    /// Dialogs / modals
    static let level4 = CurrencyShadow(color: UIColor(red: 0.110, green: 0.110, blue: 0.114, alpha: 1), opacity: 0.12, offset: CGSize(width: 0, height: 20), radius: 12.0)
    /// Bottom sheets, bottom navigation, sticky footers (casts upward)
    static let sheet = CurrencyShadow(color: UIColor(red: 0.110, green: 0.110, blue: 0.114, alpha: 1), opacity: 0.10, offset: CGSize(width: 0, height: -8), radius: 8.0)
}

public extension CALayer {
    func applyCurrencyShadow(_ shadow: CurrencyShadow) {
        shadowColor = shadow.color.cgColor
        shadowOpacity = shadow.opacity
        shadowOffset = shadow.offset
        shadowRadius = shadow.radius
        masksToBounds = false
    }
}
