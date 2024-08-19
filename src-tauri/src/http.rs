use bytes::Bytes;
use std::time::Duration;
use lazy_static::lazy_static;

use http_body_util::Full;
use hyper::service::Service;
use hyper::{body::Incoming as IncomingBody, Request, Response};
use hyper::server::conn::http1;
use tokio::pin;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use hyper_util::rt::TokioIo;


use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::watch;


#[tauri::command]
pub async fn start_http_server(otp_code: String, backup_data: String) {
        let mut server = HttpServer::new().set_data(otp_code, backup_data);

        start_server(server).await;
}

#[tauri::command]
pub async fn stop_http_server() {
    stop_server().await;
}

lazy_static! {
    // a global watch channel behind a thread safe Mutex
    static ref SHUTDOWN_TX: Arc<Mutex<Option<watch::Sender<()>>>> = <_>::default();
    // thread safe boolean flag (behind a mutex)
    static ref STOP_CONNECTIONS: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}


#[derive(Debug, Clone)]
pub struct HttpServer {
    otp_code: String,
    json_data: String
}

impl HttpServer {
    pub fn new() -> Self {
        Self {
            otp_code: String::new(),
            json_data: String::new()
        }
    }

    pub fn set_data(&mut self, otp_code: String, json_data: String) -> Self {
        self.otp_code = otp_code;
        self.json_data = json_data;
        self.clone()
    }
}

impl Service<Request<IncomingBody>> for HttpServer {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;
    
    fn call(&self, request: Request<IncomingBody>) -> Self::Future {
        fn mk_response(resp: String, status: u16) -> Result<Response<Full<Bytes>>, hyper::Error>  {
            let response = hyper::Response::builder()
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Headers", "*")
            .status(status)
            .body(Full::new(Bytes::from(resp)))
            .unwrap();
            
            Ok(response)
        }
        
        let method = request.method().as_str();
        if method != "POST" && method != "OPTION" {
            return Box::pin( async {
                Ok(Response::builder().status(500).body(Full::new(Bytes::from("Unacepted method"))).unwrap())
            });
        }
        
        if method == "OPTION" {
            return Box::pin(async {
                mk_response("".to_string(), 200)
            });
        }
        
        let res: Result<Response<Full<Bytes>>, hyper::Error>  = match request.uri().path() {
            "/handshake" => {
                println!("Handshaking...");
                let otp_token = request.headers().get("x-signed-token").unwrap();
                if otp_token.len() == 0 {
                    mk_response("Empty token".to_string(), 500)
                } else {
                    let json_data = self.json_data.clone();
                    mk_response(json_data, 200)
                }
            },
            "/close" => {
                tokio::spawn(async move {
                    let _ = stop_server().await.unwrap();
                });
                mk_response("retornando do close".to_string(), 200)
            },
            _ => {
                mk_response("Request not found".to_string(), 200)
            }
        };
        
        Box::pin(async { res })
        
    }
}

pub async fn start_server(svc: HttpServer) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr: SocketAddr = ([0, 0, 0, 0], 9099).into();
    let listener = TcpListener::bind(addr).await?;
    dbg!("Listening on http://{}", addr);
    
    let (tx, rx) = watch::channel::<()>(());
    SHUTDOWN_TX.lock().await.replace(tx);
    
    let mut rx_clone = rx.clone();
    tokio::spawn(async move {
        //let mut keep = keep_receiving_connections.clone();
        match rx_clone.changed().await {
            Ok(_) => {
                dbg!("Received the stop server signal. Telling the loop to stop receiving connections");
                let mut stop = STOP_CONNECTIONS.lock().await;
                *stop = true;
            },
            Err(_) => println!("Sender dropped")
        };
    });
    
    loop {
        let stop_conns = STOP_CONNECTIONS.lock().await.clone();
        if stop_conns {
            dbg!("Stoping to receive connections");
            drop(listener);
            return Ok(());
        } else {
            dbg!("We can keep receiving connections. Listening to the next one");
        }
        
        // receives the connection with a timeout of 10 seconds
        tokio::select! {
            Ok((stream, remote)) = listener.accept() => {
                dbg!("Received a connection from {:?}", remote);
                let io = TokioIo::new(stream);
                let svc_clone = svc.clone();
                
                let mut rx_clone = rx.clone();
                
                tokio::task::spawn(async move {
                    // Pin the connection object so we can use tokio::select! below.
                    let conn = http1::Builder::new().serve_connection(io, svc_clone);
                    pin!(conn);
                    
                    tokio::select! {
                        res = conn.as_mut() => {
                            match res {
                                Ok(()) => println!("after polling conn, no error"),
                                Err(err) => println!("Error serving connection: {:?}", err)
                            };
                        },
                        _ = rx_clone.changed() => {
                            dbg!("Signaled to close connection");
                            conn.as_mut().graceful_shutdown();
                        }
                    }
                });
            },
            _ = tokio::time::sleep(Duration::from_secs(10)) => {
                dbg!("listener::accept() timedout. Listening for the next one...");
            }
        };
    }
}

pub async fn stop_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

    if let Some(tx) = SHUTDOWN_TX.lock().await.take() {
        let _ = tx.send(());
    }
    
    Ok(())
}