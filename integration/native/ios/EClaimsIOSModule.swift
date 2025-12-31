//
//  EClaimsIOSModule.swift
//  
//  Native iOS module for integrating React Native E-Claims
//  into Swift 5 iOS applications.
//

import Foundation
import React
import UIKit

@objc(EClaimsIOSModule)
class EClaimsIOSModule: RCTEventEmitter {
    
    // MARK: - Constants
    static let moduleName = "EClaimsIOSNative"
    
    // Event names
    private let eventUserUpdated = "EClaimsNative_UserUpdated"
    private let eventVehiclesUpdated = "EClaimsNative_VehiclesUpdated"
    private let eventNavigationChanged = "EClaimsNative_NavigationChanged"
    
    // MARK: - Properties
    private var eClaimsConfig: [String: Any]?
    private weak var hostDelegate: EClaimsHostDelegate?
    private let jsonEncoder = JSONEncoder()
    private let jsonDecoder = JSONDecoder()
    
    // MARK: - RCTEventEmitter overrides
    override init() {
        super.init()
    }
    
    override static func moduleName() -> String! {
        return EClaimsIOSModule.moduleName
    }
    
    override func supportedEvents() -> [String]! {
        return [
            eventUserUpdated,
            eventVehiclesUpdated,
            eventNavigationChanged
        ]
    }
    
    override func constantsToExport() -> [AnyHashable: Any]! {
        return [
            "MODULE_NAME": EClaimsIOSModule.moduleName,
            "SUPPORTED_PERMISSIONS": [
                "camera",
                "location",
                "photos",
                "notifications"
            ]
        ]
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Public Methods
    
    /**
     * Set the host delegate for communication with Swift app
     */
    func setHostDelegate(_ delegate: EClaimsHostDelegate) {
        self.hostDelegate = delegate
    }
    
    // MARK: - React Native Methods
    
    /**
     * Initialize E-Claims with configuration from Swift host app
     */
    @objc func initializeEClaims(_ configJson: String, 
                                 resolver: @escaping RCTPromiseResolveBlock, 
                                 rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let configData = configJson.data(using: .utf8),
                  let config = try JSONSerialization.jsonObject(with: configData) as? [String: Any] else {
                rejecter("INIT_ERROR", "Invalid config JSON", nil)
                return
            }
            
            eClaimsConfig = config
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.eClaimsDidInitialize(config: config)
            }
            
            resolver(true)
        } catch {
            rejecter("INIT_ERROR", "Failed to initialize E-Claims", error)
        }
    }
    
    /**
     * Update user data from Swift host app
     */
    @objc func updateUserData(_ userDataJson: String, 
                              resolver: @escaping RCTPromiseResolveBlock, 
                              rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let userData = try parseJSON(userDataJson) else {
                rejecter("USER_UPDATE_ERROR", "Invalid user data JSON", nil)
                return
            }
            
            sendEvent(withName: eventUserUpdated, body: userData)
            resolver(nil)
        } catch {
            rejecter("USER_UPDATE_ERROR", "Failed to update user data", error)
        }
    }
    
    /**
     * Update vehicle data from Swift host app
     */
    @objc func updateVehicleData(_ vehicleDataJson: String, 
                                 resolver: @escaping RCTPromiseResolveBlock, 
                                 rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let vehicleData = try parseJSON(vehicleDataJson) else {
                rejecter("VEHICLE_UPDATE_ERROR", "Invalid vehicle data JSON", nil)
                return
            }
            
            sendEvent(withName: eventVehiclesUpdated, body: vehicleData)
            resolver(nil)
        } catch {
            rejecter("VEHICLE_UPDATE_ERROR", "Failed to update vehicle data", error)
        }
    }
    
    /**
     * Sync data from Swift host app
     */
    @objc func syncDataFromNative(_ resolver: @escaping RCTPromiseResolveBlock, 
                                  rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                rejecter("SYNC_ERROR", "Module deallocated", nil)
                return
            }
            
            let syncData = self.hostDelegate?.dataSyncRequested() ?? [:]
            
            do {
                let syncDataJson = try self.convertToJSON(syncData)
                resolver(syncDataJson)
            } catch {
                rejecter("SYNC_ERROR", "Failed to sync data from native", error)
            }
        }
    }
    
    /**
     * Navigate to native Swift screen
     */
    @objc func navigateToNativeScreen(_ screenName: String, 
                                      paramsJson: String?, 
                                      resolver: @escaping RCTPromiseResolveBlock, 
                                      rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            var params: [String: Any]?
            if let paramsJson = paramsJson {
                params = try parseJSON(paramsJson) as? [String: Any]
            }
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.navigationRequested(screenName: screenName, params: params)
            }
            
            resolver(nil)
        } catch {
            rejecter("NAVIGATION_ERROR", "Failed to navigate to native screen", error)
        }
    }
    
    /**
     * Close E-Claims and return to Swift app
     */
    @objc func closeEClaims(_ resolver: @escaping RCTPromiseResolveBlock, 
                            rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.hostDelegate?.closeRequested()
        }
        resolver(nil)
    }
    
    /**
     * Save file via Swift app
     */
    @objc func saveFileToNative(_ dataJson: String, 
                                filename: String, 
                                resolver: @escaping RCTPromiseResolveBlock, 
                                rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            let documentsURL = FileManager.default.urls(for: .documentDirectory, 
                                                       in: .userDomainMask).first!
            let fileURL = documentsURL.appendingPathComponent(filename)
            
            try dataJson.write(to: fileURL, atomically: true, encoding: .utf8)
            
            let filepath = fileURL.path
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.fileSaved(filepath: filepath, filename: filename)
            }
            
            resolver(filepath)
        } catch {
            rejecter("FILE_SAVE_ERROR", "Failed to save file", error)
        }
    }
    
    /**
     * Share file via Swift app
     */
    @objc func shareFromNative(_ filepath: String, 
                               mimeType: String, 
                               resolver: @escaping RCTPromiseResolveBlock, 
                               rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let fileURL = URL(fileURLWithPath: filepath)
            
            guard FileManager.default.fileExists(atPath: filepath) else {
                rejecter("FILE_NOT_FOUND", "File not found: \(filepath)", nil)
                return
            }
            
            let activityViewController = UIActivityViewController(
                activityItems: [fileURL], 
                applicationActivities: nil
            )
            
            if let rootViewController = UIApplication.shared.windows.first?.rootViewController {
                // Handle iPad popover presentation
                if let popoverController = activityViewController.popoverPresentationController {
                    popoverController.sourceView = rootViewController.view
                    popoverController.sourceRect = CGRect(x: rootViewController.view.bounds.midX,
                                                         y: rootViewController.view.bounds.midY,
                                                         width: 0, height: 0)
                    popoverController.permittedArrowDirections = []
                }
                
                rootViewController.present(activityViewController, animated: true) {
                    resolver(true)
                }
            } else {
                rejecter("SHARE_ERROR", "No root view controller available", nil)
            }
        }
    }
    
    /**
     * Request iOS permission via Swift app
     */
    @objc func requestNativePermission(_ permission: String, 
                                       resolver: @escaping RCTPromiseResolveBlock, 
                                       rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.handlePermissionRequest(permission, resolver: resolver, rejecter: rejecter)
        }
    }
    
    /**
     * Show native iOS alert
     */
    @objc func showNativeAlert(_ title: String, 
                               message: String, 
                               buttonsJson: String, 
                               resolver: @escaping RCTPromiseResolveBlock, 
                               rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let buttonsData = buttonsJson.data(using: .utf8),
                  let buttons = try JSONSerialization.jsonObject(with: buttonsData) as? [[String: Any]] else {
                rejecter("ALERT_ERROR", "Invalid buttons JSON", nil)
                return
            }
            
            DispatchQueue.main.async {
                let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
                
                for buttonConfig in buttons {
                    let buttonText = buttonConfig["text"] as? String ?? "OK"
                    let buttonStyle = buttonConfig["style"] as? String ?? "default"
                    
                    let alertStyle: UIAlertAction.Style
                    switch buttonStyle {
                    case "destructive":
                        alertStyle = .destructive
                    case "cancel":
                        alertStyle = .cancel
                    default:
                        alertStyle = .default
                    }
                    
                    let action = UIAlertAction(title: buttonText, style: alertStyle) { _ in
                        resolver(buttonText)
                    }
                    
                    alert.addAction(action)
                }
                
                if let rootViewController = UIApplication.shared.windows.first?.rootViewController {
                    rootViewController.present(alert, animated: true)
                } else {
                    rejecter("ALERT_ERROR", "No root view controller available", nil)
                }
            }
        } catch {
            rejecter("ALERT_ERROR", "Failed to show alert", error)
        }
    }
    
    /**
     * Show native iOS toast (using system banner)
     */
    @objc func showNativeToast(_ message: String, duration: NSNumber) {
        DispatchQueue.main.async {
            // Create a simple toast-like view
            let toast = UILabel()
            toast.text = message
            toast.backgroundColor = UIColor.black.withAlphaComponent(0.8)
            toast.textColor = .white
            toast.textAlignment = .center
            toast.layer.cornerRadius = 8
            toast.clipsToBounds = true
            toast.numberOfLines = 0
            
            guard let window = UIApplication.shared.windows.first else { return }
            
            toast.translatesAutoresizingMaskIntoConstraints = false
            window.addSubview(toast)
            
            NSLayoutConstraint.activate([
                toast.centerXAnchor.constraint(equalTo: window.centerXAnchor),
                toast.bottomAnchor.constraint(equalTo: window.safeAreaLayoutGuide.bottomAnchor, constant: -50),
                toast.leadingAnchor.constraint(greaterThanOrEqualTo: window.leadingAnchor, constant: 20),
                toast.trailingAnchor.constraint(lessThanOrEqualTo: window.trailingAnchor, constant: -20),
                toast.heightAnchor.constraint(greaterThanOrEqualConstant: 44)
            ])
            
            toast.alpha = 0
            UIView.animate(withDuration: 0.3, animations: {
                toast.alpha = 1
            }) { _ in
                let displayDuration = duration.doubleValue / 1000.0
                UIView.animate(withDuration: 0.3, delay: displayDuration, animations: {
                    toast.alpha = 0
                }) { _ in
                    toast.removeFromSuperview()
                }
            }
        }
    }
    
    /**
     * Log analytics event to Swift app
     */
    @objc func logEventToNative(_ event: String, parametersJson: String) {
        do {
            let parameters = try parseJSON(parametersJson) as? [String: Any] ?? [:]
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.analyticsEvent(event: event, parameters: parameters)
            }
        } catch {
            print("EClaimsIOSModule: Failed to log analytics event - \(error)")
        }
    }
    
    /**
     * Update native navigation bar from React Native
     */
    @objc func updateNativeToolbar(_ configJson: String, 
                                   resolver: @escaping RCTPromiseResolveBlock, 
                                   rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let config = try parseJSON(configJson) as? [String: Any] else {
                rejecter("TOOLBAR_ERROR", "Invalid toolbar config JSON", nil)
                return
            }
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.toolbarUpdateRequested(config: config)
            }
            
            resolver(nil)
        } catch {
            rejecter("TOOLBAR_ERROR", "Failed to update toolbar", error)
        }
    }
    
    /**
     * Notify Swift app that statement was submitted
     */
    @objc func notifyStatementSubmitted(_ statementId: String, 
                                        dataJson: String, 
                                        resolver: @escaping RCTPromiseResolveBlock, 
                                        rejecter: @escaping RCTPromiseRejectBlock) {
        do {
            guard let data = try parseJSON(dataJson) as? [String: Any] else {
                rejecter("STATEMENT_ERROR", "Invalid statement data JSON", nil)
                return
            }
            
            DispatchQueue.main.async { [weak self] in
                self?.hostDelegate?.statementSubmitted(statementId: statementId, data: data)
            }
            
            resolver(nil)
        } catch {
            rejecter("STATEMENT_ERROR", "Failed to submit statement", error)
        }
    }
    
    /**
     * Notify Swift app that vehicle action is required
     */
    @objc func notifyVehicleActionRequired(_ action: String, 
                                           vehicleId: String?, 
                                           resolver: @escaping RCTPromiseResolveBlock, 
                                           rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.hostDelegate?.vehicleActionRequired(action: action, vehicleId: vehicleId)
        }
        resolver(nil)
    }
    
    /**
     * Notify Swift app that user action is required
     */
    @objc func notifyUserActionRequired(_ action: String, 
                                        resolver: @escaping RCTPromiseResolveBlock, 
                                        rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.hostDelegate?.userActionRequired(action: action)
        }
        resolver(nil)
    }
    
    // MARK: - Helper Methods
    
    private func parseJSON(_ jsonString: String) throws -> Any? {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        return try JSONSerialization.jsonObject(with: data, options: [])
    }
    
    private func convertToJSON(_ object: Any) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: object, options: [])
        return String(data: data, encoding: .utf8) ?? ""
    }
    
    private func handlePermissionRequest(_ permission: String, 
                                       resolver: @escaping RCTPromiseResolveBlock, 
                                       rejecter: @escaping RCTPromiseRejectBlock) {
        switch permission {
        case "camera":
            handleCameraPermission(resolver: resolver, rejecter: rejecter)
        case "location":
            handleLocationPermission(resolver: resolver, rejecter: rejecter)
        case "photos":
            handlePhotosPermission(resolver: resolver, rejecter: rejecter)
        case "notifications":
            handleNotificationPermission(resolver: resolver, rejecter: rejecter)
        default:
            rejecter("PERMISSION_ERROR", "Unsupported permission: \(permission)", nil)
        }
    }
    
    private func handleCameraPermission(resolver: @escaping RCTPromiseResolveBlock, 
                                      rejecter: @escaping RCTPromiseRejectBlock) {
        import AVFoundation
        
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            resolver(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    resolver(granted)
                }
            }
        case .denied, .restricted:
            resolver(false)
        @unknown default:
            resolver(false)
        }
    }
    
    private func handleLocationPermission(resolver: @escaping RCTPromiseResolveBlock, 
                                        rejecter: @escaping RCTPromiseRejectBlock) {
        import CoreLocation
        
        let locationManager = CLLocationManager()
        let status = locationManager.authorizationStatus
        
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            resolver(true)
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
            resolver(false) // Will be handled in delegate
        case .denied, .restricted:
            resolver(false)
        @unknown default:
            resolver(false)
        }
    }
    
    private func handlePhotosPermission(resolver: @escaping RCTPromiseResolveBlock, 
                                      rejecter: @escaping RCTPromiseRejectBlock) {
        import Photos
        
        let status = PHPhotoLibrary.authorizationStatus()
        switch status {
        case .authorized, .limited:
            resolver(true)
        case .notDetermined:
            PHPhotoLibrary.requestAuthorization { newStatus in
                DispatchQueue.main.async {
                    resolver(newStatus == .authorized || newStatus == .limited)
                }
            }
        case .denied, .restricted:
            resolver(false)
        @unknown default:
            resolver(false)
        }
    }
    
    private func handleNotificationPermission(resolver: @escaping RCTPromiseResolveBlock, 
                                            rejecter: @escaping RCTPromiseRejectBlock) {
        import UserNotifications
        
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                switch settings.authorizationStatus {
                case .authorized, .provisional:
                    resolver(true)
                case .notDetermined:
                    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                        DispatchQueue.main.async {
                            resolver(granted)
                        }
                    }
                case .denied:
                    resolver(false)
                @unknown default:
                    resolver(false)
                }
            }
        }
    }
}

/**
 * Protocol for Swift host app to implement
 */
@objc protocol EClaimsHostDelegate: AnyObject {
    func eClaimsDidInitialize(config: [String: Any])
    func navigationRequested(screenName: String, params: [String: Any]?)
    func statementSubmitted(statementId: String, data: [String: Any])
    func vehicleActionRequired(action: String, vehicleId: String?)
    func userActionRequired(action: String)
    func dataSyncRequested() -> [String: Any]
    func fileSaved(filepath: String, filename: String)
    func closeRequested()
    func analyticsEvent(event: String, parameters: [String: Any])
    func toolbarUpdateRequested(config: [String: Any])
}