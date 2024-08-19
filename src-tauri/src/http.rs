use bytes::Bytes;
use lazy_static::lazy_static;
use std::time::Duration;

use http_body_util::Full;
use hyper::server::conn::http1;
use hyper::service::Service;
use hyper::{body::Incoming as IncomingBody, Request, Response};
use hyper_util::rt::TokioIo;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::pin;

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::watch;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn start_http_server(otp_code: String, backup_data: String) {
    println!("Called start_http_server()");

    let mut guard = SERVER.lock().await;
    let mut server = guard.as_mut().unwrap().clone();
    // releases the lock
    drop(guard);

    let mut guard = SERVER.lock().await;
    server.set_data(otp_code.clone(), backup_data);
    guard.replace(server.to_owned());
    // releases the lock
    drop(guard);

    println!("Conseguiu pegar o lock() do server");
    STOP_CONNECTIONS.lock().await.replace(false);
    //let server = HttpServer::new().set_data(otp_code, backup_data);
    
    println!("Let's start the server... with new otp: {:?}", otp_code);
    println!("Server was running? {:?}", server.running);
    if !server.running {
        server.set_running(true);
        SERVER.lock().await.replace(server.clone());
        let _ = start_server().await.unwrap();
    }
}

#[tauri::command]
pub async fn stop_http_server() {
    stop_server().await.unwrap();
}

lazy_static! {
    // a global watch channel behind a thread safe Mutex
    static ref SHUTDOWN_TX: Arc<Mutex<Option<watch::Sender<()>>>> = <_>::default();
    // thread safe boolean flag (behind a mutex)
    static ref STOP_CONNECTIONS: Arc<Mutex<Option<bool>>> = Arc::new(Mutex::new(Some(false)));
    // global server handle
    static ref SERVER: Arc<Mutex<Option<HttpServer>>> = Arc::new(Mutex::new(Some(HttpServer::new())));
}

#[derive(Debug, Clone)]
pub struct HttpServer {
    otp_code: String,
    json_data: String,
    running: bool
}

impl HttpServer {
    pub fn new() -> Self {
        Self {
            otp_code: String::new(),
            json_data: String::new(),
            running: false
        }
    }

    pub fn set_data(&mut self, otp_code: String, json_data: String) -> Self {
        self.otp_code = otp_code;
        self.json_data = json_data;
        self.clone()
    }

    pub fn set_running(&mut self, running: bool) {
        self.running = running;
    }
}

impl Service<Request<IncomingBody>> for HttpServer {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<IncomingBody>) -> Self::Future {
        fn mk_response(resp: String, status: u16) -> Result<Response<Full<Bytes>>, hyper::Error> {
            let response = hyper::Response::builder()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Headers", "*")
                .status(status)
                .body(Full::new(Bytes::from(resp)))
                .unwrap();

            Ok(response)
        }

        let method = request.method().as_str();
        if method != "POST" && method != "OPTIONS" {
            return Box::pin(async {
                Ok(Response::builder()
                    .status(500)
                    .body(Full::new(Bytes::from("Unacepted method")))
                    .unwrap())
            });
        }

        if method == "OPTIONS" {
            return Box::pin(async { mk_response("".to_string(), 200) });
        }

        let res: Result<Response<Full<Bytes>>, hyper::Error> = match request.uri().path() {
            "/handshake" => {
                println!("Handshaking...");
                if let Some(otp_token) = request.headers().get("x-signed-token") {
                    if otp_token.len() == 0 {
                        mk_response("Empty token".to_string(), 500)
                    } else {
                        let json_data = self.json_data.clone();
                        mk_response(json_data, 200)
                    }
                } else {
                    mk_response("Token not provided".to_string(), 500)
                }
            },
            "/disconnect" => {
                tokio::spawn(async move {
                    let _ = stop_server().await.unwrap();
                });
                mk_response("retornando do close".to_string(), 200)
            },
            _ => mk_response("Request not found".to_string(), 200),
        };

        Box::pin(async { res })
    }
}

pub async fn start_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
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
                STOP_CONNECTIONS.lock().await.replace(true);
            },
            Err(_) => println!("Sender dropped"),
        };
    });
    
    loop {
        let guard = SERVER.lock().await;
        let mut svc = guard.as_ref().unwrap().clone();
        drop(guard);
        println!("Listening for connections with the OTP: {:?}", svc.otp_code);
    
        let stop_conns = STOP_CONNECTIONS.lock().await.unwrap().clone();
        if stop_conns {
            println!("Stoping to receive connections");
            drop(listener);
            svc.set_running(false);
            SERVER.lock().await.replace(svc.to_owned());
            return Ok(());
        } else {
            println!("We can keep receiving connections. Listening to the next one");
        }

        // receives the connection with a timeout of 2 seconds
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
            _ = tokio::time::sleep(Duration::from_secs(2)) => {
                dbg!(format!("listener::accept() timedout. Listening for the next one... OTP: {:?}", svc.otp_code));
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
