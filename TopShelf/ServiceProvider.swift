//
//  ServiceProvider.swift
//  TopShelf
//
//  Created by Saeed Taheri on 3/31/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import Foundation
import TVServices

class ServiceProvider: NSObject, TVTopShelfProvider {

    //MARK: - Properties
    
    private let homepageURL = URL(string: "https://www.filimo.com/etc/api/homepage/devicetype/tvweb")!
    private var items = [TVContentItem]()
    
    override init() {
        super.init()
    }
    
    // MARK: - TVTopShelfProvider protocol

    var topShelfStyle: TVTopShelfContentStyle {
        return .sectioned
    }

    var topShelfItems: [TVContentItem] {
        
        let semaphore = DispatchSemaphore(value: 0)
        
        var urlRequest = URLRequest(url: homepageURL)
        urlRequest.httpMethod = "GET"
        
        URLSession.shared.dataTask(with: urlRequest) { [weak self] (data, response, error) in
            guard let data = data else {
                return
            }
            do {
                let decoder = JSONDecoder()
                let shelfData = try decoder.decode(ShelfResponse.self, from: data)
                
                var sectionItems = [TVContentItem]()
                var sectionName = ""
                
                for homepage in shelfData.homepage {
                    if let firstValuableItems = homepage.data {
                        sectionName = homepage.category.title
                        sectionItems = firstValuableItems.map() { compactMovie -> TVContentItem in
                            let item = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: compactMovie.id, container: nil)!)!
                            item.title = compactMovie.title.persianDigits()
                            item.imageShape = .poster
                            let imageURL = URL(string: compactMovie.thumbnailURLString)
                            item.setImageURL(imageURL, forTraits: .userInterfaceStyleLight)
                            item.setImageURL(imageURL, forTraits: .userInterfaceStyleDark)
                            item.setImageURL(imageURL, forTraits: .screenScale1x)
                            item.setImageURL(imageURL, forTraits: .screenScale2x)
                            item.displayURL = URL(string: "Filimo://\(compactMovie.id)/display")
                            item.playURL = URL(string: "Filimo://\(compactMovie.id)/play")
                            return item
                        }
                        break
                    } else {
                        continue
                    }
                }
                
                let section = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: "SpecialSection", container: nil)!)!
                section.title = sectionName.persianDigits()
                section.topShelfItems = sectionItems
                
                self?.items = [section]
                
                semaphore.signal()
            } catch {
                semaphore.signal()
            }
        }.resume()
        
        let _ = semaphore.wait(timeout: .distantFuture)
        
        return items
    }

}

extension String {
    func persianDigits() -> String {
        var str = self
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "fa")
        for i in 0..<10 {
            let number = NSNumber(integerLiteral: i)
            str = str.replacingOccurrences(of: number.stringValue, with: formatter.string(from: number)!)
        }
        return str
    }
}
