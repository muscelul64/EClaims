//
//  SwiftImplementationExample.swift
//  
//  Example implementation showing how to integrate React Native E-Claims
//  into a native Swift 5 iOS application.
//
//  Production Configuration:
//  - Bundle ID: com.porsche.eclaims
//  - Deeplink Scheme: porscheeclaims://
//  - Universal Links: https://eclaims.deactech.com/
//  - API Endpoint: https://api.eclaims.deactech.com
//

import UIKit
import React

/**
 * Main View Controller that hosts the React Native E-Claims integration
 */
class MainViewController: UIViewController {
    
    // MARK: - Properties
    private var reactView: RCTRootView?
    private var bridge: RCTBridge?
    private var eClaimsModule: EClaimsIOSModule?
    
    // Your app's user and vehicle data
    private var currentUser: UserModel?
    private var userVehicles: [VehicleModel] = []
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupReactNative()
        loadUserDataAndInitialize()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Update navigation bar for E-Claims integration
        navigationController?.navigationBar.isHidden = false
        title = "E-Claims"
    }
    
    // MARK: - Setup Methods
    
    private func setupReactNative() {
        // Create React Native bridge with production configuration
        bridge = RCTBridge(delegate: self, launchOptions: nil)
        
        // Get E-Claims module
        eClaimsModule = bridge?.module(for: EClaimsIOSModule.self) as? EClaimsIOSModule
        eClaimsModule?.setHostDelegate(self)
        
        // Configure with production settings
        let config: [String: Any] = [
            "apiBaseUrl": "https://api.eclaims.deactech.com",
            "environment": Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") == "Debug" ? "development" : "production",
            "analyticsEnabled": true,
            "masterAppScheme": "porsche-master-app",
            "appScheme": "porscheeclaims",
            "universalLinkHost": "eclaims.deactech.com",
            "enableLogging": Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") == "Debug",
        
        // Create React Native root view
        reactView = RCTRootView(
            bridge: bridge!,
            moduleName: "EClaims",
            initialProperties: nil
        )
        
        // Add to view hierarchy
        if let reactView = reactView {
            view.addSubview(reactView)
            reactView.frame = view.bounds
            reactView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        }
    }
    
    private func loadUserDataAndInitialize() {
        // Load your app's user and vehicle data
        loadCurrentUser { [weak self] user in
            self?.currentUser = user
            self?.loadUserVehicles(userId: user.id) { vehicles in
                self?.userVehicles = vehicles
                self?.initializeEClaims()
            }
        }
    }
    
    private func initializeEClaims() {
        let config: [String: Any] = [
            "apiBaseUrl": "https://your-api.com",
            "environment": Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") == "Debug" ? "development" : "production",
            "analyticsEnabled": true,
            "theme": [
                "primaryColor": "#007AFF",
                "darkMode": traitCollection.userInterfaceStyle == .dark
            ],
            "features": [
                "offlineMode": true,
                "autoSave": true,
                "pushNotifications": true,
                "hapticFeedback": true
            ]
        ]
        
        do {
            let configData = try JSONSerialization.data(withJSONObject: config, options: [])
            let configJson = String(data: configData, encoding: .utf8) ?? ""
            
            eClaimsModule?.initializeEClaims(configJson, resolver: { [weak self] success in
                if let success = success as? Bool, success {
                    // Update React Native with user and vehicle data
                    self?.syncUserData()
                    self?.syncVehicleData()
                }
            }, rejecter: { code, message, error in
                print("Failed to initialize E-Claims: \(message ?? "")")
            })
        } catch {
            print("Failed to create config JSON: \(error)")
        }
    }
    
    private func syncUserData() {
        guard let user = currentUser else { return }
        
        let userData: [String: Any] = [
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "phone": user.phone,
            "driversLicense": [
                "number": user.driversLicense,
                "expiryDate": user.licenseExpiry
            ],
            "insurancePolicy": [
                "provider": user.insuranceProvider,
                "policyNumber": user.policyNumber
            ]
        ]
        
        do {
            let userDataJson = try convertToJSON(userData)
            eClaimsModule?.updateUserData(userDataJson, resolver: { _ in
                // User data synced successfully
            }, rejecter: { code, message, error in
                print("Failed to sync user data: \(message ?? "")")
            })
        } catch {
            print("Failed to serialize user data: \(error)")
        }
    }
    
    private func syncVehicleData() {
        let vehicleData = userVehicles.map { vehicle in
            return [
                "id": vehicle.id,
                "vin": vehicle.vin,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "licensePlate": vehicle.licensePlate,
                "color": vehicle.color,
                "insurance": [
                    "provider": vehicle.insuranceProvider,
                    "policyNumber": vehicle.insurancePolicyNumber,
                    "validUntil": vehicle.insuranceExpiry
                ]
            ]
        }
        
        do {
            let vehicleDataJson = try convertToJSON(vehicleData)
            eClaimsModule?.updateVehicleData(vehicleDataJson, resolver: { _ in
                // Vehicle data synced successfully
            }, rejecter: { code, message, error in
                print("Failed to sync vehicle data: \(message ?? "")")
            })
        } catch {
            print("Failed to serialize vehicle data: \(error)")
        }
    }
    
    // MARK: - Helper Methods
    
    private func convertToJSON(_ object: Any) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: object, options: [])
        return String(data: data, encoding: .utf8) ?? ""
    }
    
    private func loadCurrentUser(completion: @escaping (UserModel) -> Void) {
        // Load user from your database/API
        // This is just an example
        let user = UserModel(
            id: "user123",
            email: "john.doe@example.com",
            firstName: "John",
            lastName: "Doe",
            phone: "+1234567890",
            driversLicense: "DL123456",
            licenseExpiry: "2025-12-31",
            insuranceProvider: "Insurance Co",
            policyNumber: "POL123456"
        )
        completion(user)
    }
    
    private func loadUserVehicles(userId: String, completion: @escaping ([VehicleModel]) -> Void) {
        // Load vehicles from your database/API
        // This is just an example
        let vehicles = [
            VehicleModel(
                id: "vehicle1",
                vin: "1HGBH41JXMN109186",
                make: "Porsche",
                model: "911",
                year: 2023,
                licensePlate: "ABC123",
                color: "Black",
                insuranceProvider: "Insurance Co",
                insurancePolicyNumber: "POL123456",
                insuranceExpiry: "2024-12-31"
            )
        ]
        completion(vehicles)
    }
    
    private func saveStatementToBackend(statementId: String, data: [String: Any], completion: @escaping (Bool) -> Void) {
        // Save statement to your backend
        // This is just an example
        completion(true)
    }
    
    private func showSuccessMessage(_ message: String) {
        DispatchQueue.main.async {
            let alert = UIAlertController(title: "Success", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.present(alert, animated: true)
        }
    }
    
    private func showErrorMessage(_ message: String) {
        DispatchQueue.main.async {
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.present(alert, animated: true)
        }
    }
}

// MARK: - RCTBridgeDelegate

extension MainViewController: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}

// MARK: - EClaimsHostDelegate

extension MainViewController: EClaimsHostDelegate {
    
    func eClaimsDidInitialize(config: [String: Any]) {
        print("E-Claims initialized with config: \(config)")
    }
    
    func navigationRequested(screenName: String, params: [String: Any]?) {
        switch screenName {
        case "vehicle_management":
            // Navigate to your app's vehicle management screen
            let vehicleVC = VehicleManagementViewController()
            if let params = params {
                vehicleVC.configure(with: params)
            }
            navigationController?.pushViewController(vehicleVC, animated: true)
            
        case "user_profile":
            // Navigate to your app's user profile screen
            let profileVC = UserProfileViewController()
            navigationController?.pushViewController(profileVC, animated: true)
            
        case "settings":
            // Navigate to your app's settings screen
            let settingsVC = SettingsViewController()
            navigationController?.pushViewController(settingsVC, animated: true)
            
        default:
            print("Unknown screen requested: \(screenName)")
        }
    }
    
    func statementSubmitted(statementId: String, data: [String: Any]) {
        print("Statement submitted: \(statementId)")
        
        // Add haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        // Save to your backend
        saveStatementToBackend(statementId: statementId, data: data) { [weak self] success in
            DispatchQueue.main.async {
                if success {
                    self?.showSuccessMessage("Statement submitted successfully")
                } else {
                    self?.showErrorMessage("Failed to submit statement")
                }
            }
        }
    }
    
    func vehicleActionRequired(action: String, vehicleId: String?) {
        switch action {
        case "add_vehicle":
            // Navigate to add vehicle screen
            let addVehicleVC = AddVehicleViewController()
            let navController = UINavigationController(rootViewController: addVehicleVC)
            present(navController, animated: true)
            
        case "edit_vehicle":
            if let vehicleId = vehicleId {
                // Navigate to edit vehicle screen
                let editVehicleVC = EditVehicleViewController()
                editVehicleVC.vehicleId = vehicleId
                let navController = UINavigationController(rootViewController: editVehicleVC)
                present(navController, animated: true)
            }
            
        case "verify_insurance":
            if let vehicleId = vehicleId {
                // Navigate to insurance verification
                let insuranceVC = InsuranceVerificationViewController()
                insuranceVC.vehicleId = vehicleId
                let navController = UINavigationController(rootViewController: insuranceVC)
                present(navController, animated: true)
            }
            
        default:
            print("Unknown vehicle action: \(action)")
        }
    }
    
    func userActionRequired(action: String) {
        switch action {
        case "update_profile":
            // Navigate to profile update screen
            let updateProfileVC = UpdateProfileViewController()
            let navController = UINavigationController(rootViewController: updateProfileVC)
            present(navController, animated: true)
            
        case "verify_license":
            // Navigate to license verification
            let licenseVC = LicenseVerificationViewController()
            let navController = UINavigationController(rootViewController: licenseVC)
            present(navController, animated: true)
            
        default:
            print("Unknown user action: \(action)")
        }
    }
    
    func dataSyncRequested() -> [String: Any] {
        // Return current user and vehicle data
        var syncData: [String: Any] = [:]
        
        if let user = currentUser {
            syncData["user"] = [
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName
            ]
        }
        
        syncData["vehicles"] = userVehicles.map { vehicle in
            return [
                "id": vehicle.id,
                "vin": vehicle.vin,
                "make": vehicle.make,
                "model": vehicle.model
            ]
        }
        
        syncData["timestamp"] = Date().timeIntervalSince1970 * 1000
        
        return syncData
    }
    
    func fileSaved(filepath: String, filename: String) {
        print("File saved: \(filename) at \(filepath)")
        
        // Add haptic feedback
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.success)
    }
    
    func closeRequested() {
        // User wants to close E-Claims and return to your app
        navigationController?.popViewController(animated: true)
        // or dismiss if presented modally
        // dismiss(animated: true)
    }
    
    func analyticsEvent(event: String, parameters: [String: Any]) {
        // Forward to your analytics system
        // Example: Firebase Analytics, Mixpanel, etc.
        YourAnalyticsManager.shared.logEvent(event, parameters: parameters)
    }
    
    func toolbarUpdateRequested(config: [String: Any]) {
        // Update your app's navigation bar
        DispatchQueue.main.async { [weak self] in
            if let title = config["title"] as? String {
                self?.title = title
            }
            
            if let showBackButton = config["showBackButton"] as? Bool {
                self?.navigationItem.hidesBackButton = !showBackButton
            }
            
            if let backgroundColor = config["backgroundColor"] as? String {
                self?.navigationController?.navigationBar.backgroundColor = UIColor(hex: backgroundColor)
            }
        }
    }
}

// MARK: - Data Models

struct UserModel {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let phone: String
    let driversLicense: String
    let licenseExpiry: String
    let insuranceProvider: String
    let policyNumber: String
}

struct VehicleModel {
    let id: String
    let vin: String
    let make: String
    let model: String
    let year: Int
    let licensePlate: String
    let color: String
    let insuranceProvider: String
    let insurancePolicyNumber: String
    let insuranceExpiry: String
}

// MARK: - Example View Controllers

class VehicleManagementViewController: UIViewController {
    func configure(with params: [String: Any]) {
        // Configure with parameters from React Native
    }
}

class UserProfileViewController: UIViewController {
    // Implementation
}

class SettingsViewController: UIViewController {
    // Implementation
}

class AddVehicleViewController: UIViewController {
    // Implementation
}

class EditVehicleViewController: UIViewController {
    var vehicleId: String?
    // Implementation
}

class InsuranceVerificationViewController: UIViewController {
    var vehicleId: String?
    // Implementation
}

class UpdateProfileViewController: UIViewController {
    // Implementation
}

class LicenseVerificationViewController: UIViewController {
    // Implementation
}

// MARK: - Analytics Manager

class YourAnalyticsManager {
    static let shared = YourAnalyticsManager()
    
    func logEvent(_ event: String, parameters: [String: Any]) {
        // Your analytics implementation
        print("Analytics Event: \(event) with parameters: \(parameters)")
    }
}

// MARK: - UIColor Extension

extension UIColor {
    convenience init?(hex: String) {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexString = hexString.replacingOccurrences(of: "#", with: "")
        
        guard hexString.count == 6 else { return nil }
        
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)
        
        self.init(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgb & 0x0000FF) / 255.0,
            alpha: 1.0
        )
    }
}