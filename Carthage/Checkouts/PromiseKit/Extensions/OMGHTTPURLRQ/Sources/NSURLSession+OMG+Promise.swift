import OMGHTTPURLRQ
import Foundation

#if !COCOAPODS
@_exported import class PMKFoundation.URLDataPromise
import PMKFoundation
import PromiseKit
#endif

/**
 To import the `OMGHTTPURLRQ` category:

    use_frameworks!
    pod "PromiseKit/OMGHTTPURLRQ"

 And then in your sources:

    import PromiseKit

 We provide convenience categories for the `NSURLSession.shared`, or
 an instance method `promise`. If you need more complicated behavior
 we recommend wrapping that usage in a `Promise` initializer.
*/
extension URLSession {
    /**
     Makes a **GET** request to the provided URL.

         let p = NSURLSession.GET("http://example.com", query: ["foo": "bar"])
         p.then { data -> Void  in
             //…
         }
         p.asImage().then { image -> Void  in
            //…
         }
         p.asDictionary().then { json -> Void  in
            //…
         }

     - Parameter url: The URL to request.
     - Parameter query: The parameters to be encoded as the query string for the GET request.
     - Returns: A promise that represents the GET request.
     - SeeAlso: `URLDataPromise`
     */
    public func GET(_ url: String, query: [NSObject: AnyObject]? = nil) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.get(url, query) as URLRequest)
    }

    /**
     Makes a POST request to the provided URL passing form URL encoded
     parameters.

     Form URL-encoding is the standard way to POST on the Internet, so
     probably this is what you want. If it doesn’t work, try the `+POST:JSON`
     variant.

         let url = "http://jsonplaceholder.typicode.com/posts"
         let params = ["title": "foo", "body": "bar", "userId": 1]
         NSURLSession.POST(url, formData: params).asDictionary().then { json -> Void  in
             //…
         }

     - Parameter url: The URL to request.
     - Parameter formData: The parameters to be form URL-encoded and passed as the POST body.
     - Returns: A promise that represents the POST request.
     - SeeAlso: `URLDataPromise`
     */
    public func POST(_ url: String, formData: [NSObject: AnyObject]? = nil) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.post(url, formData) as URLRequest)
    }

    /**
     Makes a POST request to the provided URL passing multipart form-data.

        let formData = OMGMultipartFormData()
        let imgData = Data(contentsOfFile: "image.png")
        formData.addFile(imgdata, parameterName: "file1", filename: "myimage1.png", contentType: "image/png")

        NSURLSession.POST(url, multipartFormData: formData).then { data in
            //…
        }

     - Parameter url: The URL to request.
     - Parameter multipartFormData: The parameters to be multipart form-data encoded and passed as the POST body.
     - Returns: A promise that represents the POST request.
     - SeeAlso: [https://github.com/mxcl/OMGHTTPURLRQ](OMGHTTPURLRQ)
     */
    public func POST(_ url: String, multipartFormData: OMGMultipartFormData) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.post(url, multipartFormData) as URLRequest)
    }

    /**
     Makes a POST request to the provided URL passing JSON encoded
     parameters.

     Most web servers nowadays support POST with either JSON or form
     URL-encoding. If in doubt try form URL-encoded parameters first.

         let url = "http://jsonplaceholder.typicode.com/posts"
         let params = ["title": "foo", "body": "bar", "userId": 1]
         NSURLSession.POST(url, json: params).asDictionary().then { json -> Void  in
             //…
         }

     - Parameter url: The URL to request.
     - Parameter json: The parameters to be JSON-encoded and passed as the POST body.
     - Returns: A promise that represents the POST request.
     - SeeAlso: `URLDataPromise`
     */
    public func POST(_ url: String, json: NSDictionary) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.post(url, json: json) as URLRequest)
    }

    /**
     Makes a PUT request to the provided URL passing JSON encoded parameters.

         let url = "http://jsonplaceholder.typicode.com/posts"
         let params = ["title": "foo", "body": "bar", "userId": 1]
         NSURLSession.PUT(url, json: params).asDictionary().then { json -> Void  in
             //…
         }

     - Parameter url: The URL to request.
     - Parameter json: The parameters to be JSON-encoded and passed as the PUT body.
     - Returns: A promise that represents the PUT request.
     - SeeAlso: `URLDataPromise`
     */
    public func PUT(_ url: String, json: NSDictionary? = nil) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.put(url, json: json) as URLRequest)
    }

    /**
     Makes a DELETE request to the provided URL passing form URL-encoded
     parameters.

         let url = "http://jsonplaceholder.typicode.com/posts/1"
         NSURLSession.DELETE(url).then.asDictionary() { json -> Void in
             //…
         }

     - Parameter url: The URL to request.
     - Returns: A promise that represents the PUT request.
     - SeeAlso: `URLDataPromise`
     */
    public func DELETE(_ url: String) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.delete(url, nil) as URLRequest)
    }

    /**
     Makes a PATCH request to the provided URL passing the provided JSON parameters.

         let url = "http://jsonplaceholder.typicode.com/posts/1"
         let params = ["foo": "bar"]
         NSURLConnection.PATCH(url, json: params).asDictionary().then { json -> Void in
             //…
         }
     - Parameter url: The URL to request.
     - Parameter json: The JSON parameters to encode as the PATCH body.
     - Returns: A promise that represents the PUT request.
     - SeeAlso: `URLDataPromise`
     */
    public func PATCH(_ url: String, json: NSDictionary) -> URLDataPromise {
        return start(try OMGHTTPURLRQ.patch(url, json: json) as URLRequest)
    }

    private func start(_ body: @autoclosure () throws -> URLRequest, session: URLSession = URLSession.shared) -> URLDataPromise {
        do {
            var request = try body()

            if request.value(forHTTPHeaderField: "User-Agent") == nil {
                request.setValue(OMGUserAgent(), forHTTPHeaderField: "User-Agent")
            }

            return dataTask(with: request)
        } catch {
            return URLDataPromise(error: error)
        }
    }
}
