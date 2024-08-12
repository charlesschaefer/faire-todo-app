use bytes::Bytes;

use http_body_util::Full;
use hyper::server::conn::http1;
use hyper::service::Service;
use hyper::{body::Incoming as IncomingBody, Request, Response};
use tokio::net::TcpListener;

use hyper_util::rt::TokioIo;

use std::future::Future;
use std::net::SocketAddr;

type GenericError = Box<dyn std::error::Error + Send + Sync + 'static>;



#[tauri::command]
pub async fn start_http_server(otp_code: String, backup_data: String) {
        let mut server = HttpServer {
            otp_code: otp_code,
            json_data: backup_data
        };

        let addr = SocketAddr::from(([0, 0, 0, 0], 9099));
        let listener = TcpListener::bind(addr).await?;
        println!("Listening on http://{}", addr);

        loop {
            let (stream, _) = listener.accept().await?;
            let io = TokioIo::new(stream);

            if let Err(err) = http1::Builder::new().serve_connection(io, server).await {
                println!("Failed to serve connection: {:?}", err);
            }
        }
}

struct HttpServer {
    otp_code: String,
    json_data: String,
}

impl HttpServer {
    fn new() -> Self {
        Self {
            otp_code: String::new(),
            json_data: String::new()
        }
    }
    
    fn response_with_cors_headers(&self, resp: &str) -> Result<Response<Full<Bytes>>, hyper::Error> {
        let response = hyper::Response::builder()
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Headers", "*")
            .body(Full::new(Bytes::from(resp)))
            .unwrap();
        
        Ok(response)
    }
}

impl Service<Request<IncomingBody>> for HttpServer {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<IncomingBody>) -> Self::Future {

        if request.method().as_str() == "OPTIONS" {
            dbg!("Received a OPTIONS method");
            let response = self.response_with_cors_headers("");
            dbg!("Returned the response");
            return Box::pin(async { response });
        }

        if request.method().as_str() != "POST" {
            dbg!("Received a method different of POST");
            
        }
        let response = match request.uri.path() {
            "/handshake" => {
                dbg!("Received a POST method on /handshake url");
                self.handshake(request)
            },
            "/disconnect" => {

            }
        }
        
        if request.uri().path() == "/handshake" {
            dbg!("Received a POST method on /handshake url");
            return self.handshake(request);
        }

        if request.url() == "/disconnect" {
            dbg!("Received the disconnect command");
            return None;
        }
        None
    }

    fn handshake(&self, request: &Request) {
        let otp_token = request
            .headers()
            .into_iter()
            .find_map(|header| {
                dbg!("Header {:?} with value {:?}", header.field.as_str(), header.value.as_str());
                if header.field.as_str() == "X-SIGNED-TOKEN" {
                    dbg!("Returned the header {:?}", header.value.as_str());
                    return Some(header.value.as_str());
                }
                None
            }).unwrap();
        dbg!("Valor to token: {:?}", &otp_token);

        if otp_token.len() == 0 {
            let response = Response::from_string("Empty token".to_string())
                        .with_status_code(500).boxed();
            return Some(response);
        }
        self.response_with_cors_headers(&self.json_data.as_str())
    }

    
}