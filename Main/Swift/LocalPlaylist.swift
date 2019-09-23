//
//  LocalPlaylist.swift
//  Filimo
//
//  Created by Saeed Taheri on 9/23/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol LocalPlaylistProtocol: JSExport {
	
	static func urlWith(uid: String, movieSrc: String, subtitles: [[String: String]]?) -> String
	
	static func remove(uid: String)
}

class LocalPlaylist: NSObject, LocalPlaylistProtocol {
	
	static func urlWith(uid: String, movieSrc: String, subtitles: [[String: String]]?) -> String {
		guard let subtitles = subtitles, !subtitles.isEmpty else {
			return movieSrc
		}
		
		return movieSrc
	}
	
	static func remove(uid: String) {
		
	}
		
}
