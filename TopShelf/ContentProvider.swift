//
//  ContentProvider.swift
//  TopShelfNew
//
//  Created by Saeed Taheri on 9/25/19.
//  Copyright © 2019 Filimo. All rights reserved.
//

import TVServices

final class ContentProvider: TVTopShelfContentProvider {
	override func loadTopShelfContent() async -> TVTopShelfContent? {
		let movies = await fetchNewestItems()
		let carouselItems = movies.compactMap { $0.makeCarouselItem() }
		return TVTopShelfCarouselContent(style: .details, items: carouselItems)
	}
}

extension ContentProvider {
	private func fetchNewestItems() async -> [CarouselMovie] {
		var urlRequest = URLRequest(url: URL.vitrine)
		urlRequest.httpMethod = "GET"
		urlRequest.addAppHeaders()

		do {
			let data = (try await URLSession.shared.data(for: urlRequest)).0

			let specialMovies = extractSpecialMovies(from: data).prefix(8)
			var items = specialMovies.map { CarouselMovie(vitrineInfo: $0) }

			return try await withThrowingTaskGroup(
				of: (MovieDetailGeneral?, MovieDetailReview?, Int).self
			) { group in
				for (index, movie) in specialMovies.enumerated() {
					group.addTask {
						async let oneDetailData = try await URLSession.shared.data(
							for: {
								var oneDetailUrlRequest = URLRequest(url: URL.movieOneDetailURL(uuid: movie.uid))
								oneDetailUrlRequest.httpMethod = "GET"
								oneDetailUrlRequest.addAppHeaders()
								return oneDetailUrlRequest
							}()
						).0

						async let reviewDetailData = try await URLSession.shared.data(
							for: {
								var reviewDetailUrlRequest = URLRequest(url: URL.movieReviewDetailURL(uuid: movie.uid))
								reviewDetailUrlRequest.httpMethod = "GET"
								reviewDetailUrlRequest.addAppHeaders()
								return reviewDetailUrlRequest
							}()
						).0

						return await (
							try self.extractMovieOneDetail(from: oneDetailData),
							try self.extractMovieReviewDetail(from: reviewDetailData),
							index
						)
					}
				}

				for try await (detail, review, index) in group {
					items[index].oneDetail = detail
					items[index].reviewDetail = review
				}

				return items
			}
		} catch {
			print(error.localizedDescription)
			return []
		}
	}

	private func extractSpecialMovies(from data: Data) -> [VitrineMovie] {
		do {
			let decoder = JSONDecoder()
			let vitrineResponse = try decoder.decode(VitrineResponse.self, from: data)
			
			let specials = vitrineResponse.data.filter {
				$0.linkKey == "thumbnailspecial"
			}

			return specials.flatMap {
				$0.movies.data
			}
		} catch {
			print(error.localizedDescription)
			return []
		}
	}

	private func extractMovieOneDetail(from data: Data) -> MovieDetailGeneral? {
		do {
			let decoder = JSONDecoder()
			let detailResponse = try decoder.decode(MovieOneDetailResponse.self, from: data)
			return detailResponse.data.general
		} catch {
			print(error.localizedDescription)
			return nil
		}
	}

	private func extractMovieReviewDetail(from data: Data) -> MovieDetailReview? {
		do {
			let decoder = JSONDecoder()
			return try decoder.decode(MovieDetailReview.self, from: data)
		} catch {
			print(error.localizedDescription)
			return nil
		}
	}
}
