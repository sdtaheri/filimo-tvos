//
//  ContentProvider.swift
//  TopShelfNew
//
//  Created by Saeed Taheri on 9/25/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import TVServices

fileprivate let homepageURL = URL(string: "https://www.filimo.com/etc/api/homepage/devicetype/site")!
fileprivate func movieDetailURL(uuid: String) -> URL {
	return URL(string: "https://www.filimo.com/etc/api/moviedetail/uid/\(uuid)")!
}


class ContentProvider: TVTopShelfContentProvider {
	
	override func loadTopShelfContent(completionHandler: @escaping (TVTopShelfContent?) -> Void) {

		DispatchQueue.global().async { [weak self] in
			guard let self = self else {
				completionHandler(nil)
				return
			}
			self.fetchNewestItems { movies in
				let carouselItems = movies.compactMap { self.makeCarouselItem(from: $0) }
				let content = TVTopShelfCarouselContent(style: .details, items: carouselItems)
				completionHandler(content)
			}
		}
	}
	
}

extension ContentProvider {
	
	private func fetchNewestItems(completion: @escaping ([CarouselMovie]) -> Void) {
        var urlRequest = URLRequest(url: homepageURL)
        urlRequest.httpMethod = "GET"

		guard let data = URLSession.shared.synchronousDataTask(urlrequest: urlRequest).data else {
			completion([])
			return
		}
		
		let compactMovies = extractMovieInfo(from: data)
		
		var items = compactMovies.map { CarouselMovie(info: $0) }

		for (index, movie) in compactMovies.enumerated() {
			var detailUrlRequest = URLRequest(url: movieDetailURL(uuid: movie.id!))
			detailUrlRequest.httpMethod = "GET"
			
			let detailData = URLSession.shared.synchronousDataTask(urlrequest: detailUrlRequest).data
			if let detailData = detailData {
				let movieDetail = extractMovieDetail(from: detailData)
				items[index].detail = movieDetail
			}
		}
		
		completion(items)
	}
	
	private func extractMovieInfo(from data: Data) -> [MovieCompact] {
		do {
			
			let decoder = JSONDecoder()
			let shelfData = try decoder.decode(ShelfResponse.self, from: data)

			for homepage in shelfData.homepage {
				if let firstValuableItem = homepage.data {
					return Array(firstValuableItem.filter({ $0.id != nil }).prefix(10))
				} else {
					continue
				}
			}
			
		} catch {
			return []
		}
		
		return []
	}
	
	private func extractMovieDetail(from data: Data) -> MovieDetail? {
		do {
			let decoder = JSONDecoder()
			let detailResponse = try decoder.decode(MovieDetailResponse.self, from: data)
			
			return detailResponse.movieDetail
			
		} catch {
			return nil
		}
	}
	
	private func makeCarouselItem(from movie: CarouselMovie) -> TVTopShelfCarouselItem {
		let item = TVTopShelfCarouselItem(identifier: movie.info.id ?? UUID().uuidString)
		
		item.title = movie.info.title?.persianDigits()
		item.summary = movie.info.description?.persianDigits()
		item.genre = movie.info.genre
		item.duration = TimeInterval(movie.info.duration)
		if let trailerUrlString = movie.detail?.trailer?.first?.fileURLString {
			item.previewVideoURL = URL(string: trailerUrlString)
		}
		if let thumbnail = movie.info.thumbplay?.imageURLString ?? movie.info.thumbnailURLString, let imageURL = URL(string: thumbnail) {
			item.setImageURL(imageURL, for: .screenScale1x)
			item.setImageURL(imageURL, for: .screenScale2x)
		}
		item.displayAction = URL(string: "Filimo://\(movie.info.id!)/display").map { TVTopShelfAction(url: $0) }
		item.playAction = URL(string: "Filimo://\(movie.info.id!)/play").map { TVTopShelfAction(url: $0) }
		
		return item
	}
}


extension URLSession {
    func synchronousDataTask(urlrequest: URLRequest) -> (data: Data?, response: URLResponse?, error: Error?) {
        var data: Data?
        var response: URLResponse?
        var error: Error?

        let semaphore = DispatchSemaphore(value: 0)

        let dataTask = self.dataTask(with: urlrequest) {
            data = $0
            response = $1
            error = $2

            semaphore.signal()
        }
        dataTask.resume()

        _ = semaphore.wait(timeout: .distantFuture)

        return (data, response, error)
    }
}
